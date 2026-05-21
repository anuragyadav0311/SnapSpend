from datetime import date
from decimal import Decimal, InvalidOperation
from types import SimpleNamespace
from uuid import uuid4

from django.db.models import Q
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from .models import Category, Transaction, TransactionVerification
from .ocr import BillOcrError, extract_amounts_from_text, extract_dates, extract_expense_from_bill
from .serializers import CategorySerializer, TransactionSerializer, TransactionVerificationSerializer
from ml.anomaly_detector import DEFAULT_CONTAMINATION, detect_anomalies, score_new_transaction


def parse_money(value):
    try:
        return Decimal(str(value)).quantize(Decimal("0.01"))
    except (InvalidOperation, TypeError, ValueError):
        return None


def amounts_match(ocr_amounts, proposed_amount) -> bool:
    expected = parse_money(proposed_amount)
    if expected is None:
        return False

    tolerance = max(Decimal("1.00"), expected * Decimal("0.05"))
    return any(abs(amount - expected) <= tolerance for amount in ocr_amounts)


def dates_match(ocr_dates, proposed_date) -> bool:
    try:
        expected = date.fromisoformat(str(proposed_date))
    except (TypeError, ValueError):
        return False
    return expected in ocr_dates


def proposed_from_transaction(transaction):
    category = transaction.category
    return {
        "transaction_id": transaction.id,
        "type": str(transaction.type),
        "amount": float(transaction.amount),
        "category": category.id if category else None,
        "category_name": category.name if category else "Uncategorized",
        "title": transaction.title,
        "note": transaction.note,
        "date": str(transaction.date),
    }


def verified_transaction_ids_for(user) -> set[int]:
    verified_ids = set()
    verifications = TransactionVerification.objects.filter(user=user, is_verified=True).values_list("proposed", flat=True)
    for proposed in verifications:
        try:
            transaction_id = int(proposed.get("transaction_id"))
        except (AttributeError, TypeError, ValueError):
            continue
        verified_ids.add(transaction_id)
    return verified_ids


def compare_bill_to_proposed(image, categories, proposed):
    draft = extract_expense_from_bill(image, categories)
    ocr_amounts = extract_amounts_from_text(draft.raw_text)
    if draft.amount is not None:
        normalized_draft_amount = draft.amount.quantize(Decimal("0.01"))
        if normalized_draft_amount not in ocr_amounts:
            ocr_amounts.append(normalized_draft_amount)

    ocr_dates = extract_dates(draft.raw_text)
    try:
        draft_date = date.fromisoformat(draft.date)
    except (TypeError, ValueError):
        draft_date = None
    if draft_date and draft_date not in ocr_dates:
        ocr_dates.append(draft_date)

    amount_ok = amounts_match(ocr_amounts, proposed.get("amount"))
    date_ok = dates_match(ocr_dates, proposed.get("date"))
    verified = amount_ok and date_ok

    return draft, verified, {
        "amount": amount_ok,
        "date": date_ok,
    }


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        base_queryset = Category.objects.order_by("type", "name")
        if self.action in {"list", "retrieve"}:
            return base_queryset.filter(Q(user=self.request.user) | Q(user__isnull=True))
        return base_queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        if serializer.instance.user_id != self.request.user.id:
            raise PermissionDenied("Default categories cannot be modified.")
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.user_id != request.user.id:
            raise PermissionDenied("Default categories cannot be deleted.")
        if instance.transactions.exists():
            return Response(
                {"detail": "Categories with transactions cannot be deleted."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)


class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def validate_date_filters(self, params):
        today = timezone.localdate()
        start_date = params.get("start_date")
        end_date = params.get("end_date")

        def parse_date(raw_value, field_name):
            if not raw_value:
                return None
            try:
                return date.fromisoformat(raw_value)
            except ValueError as exc:
                raise ValidationError({field_name: "Enter a valid date."}) from exc

        parsed_start = parse_date(start_date, "start_date")
        parsed_end = parse_date(end_date, "end_date")

        if parsed_start and parsed_start > today:
            raise ValidationError({"start_date": "Future dates are not allowed."})
        if parsed_end and parsed_end > today:
            raise ValidationError({"end_date": "Future dates are not allowed."})
        if parsed_start and parsed_end and parsed_start > parsed_end:
            raise ValidationError({"end_date": "The end date must be on or after the start date."})

    def get_queryset(self):
        queryset = Transaction.objects.filter(user=self.request.user).select_related("category")
        params = self.request.query_params
        tx_type = params.get("type")
        category_id = params.get("category")
        start_date = params.get("start_date")
        end_date = params.get("end_date")
        search = params.get("search")
        ordering = params.get("ordering")

        self.validate_date_filters(params)

        if tx_type in {"income", "expense"}:
            queryset = queryset.filter(type=tx_type)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(note__icontains=search)
                | Q(category__name__icontains=search)
            )

        ordering_map = {
            "newest": ("-date", "-created_at"),
            "oldest": ("date", "created_at"),
            "highest": ("-amount", "-date"),
            "lowest": ("amount", "-date"),
            "-date": ("-date", "-created_at"),
            "date": ("date", "created_at"),
            "-amount": ("-amount", "-date"),
            "amount": ("amount", "-date"),
        }
        if ordering in ordering_map:
            queryset = queryset.order_by(*ordering_map[ordering])
        return queryset

    def create(self, request, *args, **kwargs):
        """Override create to intercept anomalous transactions and create a verification record."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        validated = serializer.validated_data
        if validated.get("type") == "income":
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

        category = validated.get("category")
        new_tx = SimpleNamespace(
            id=-1,
            amount=validated.get("amount"),
            type=validated.get("type"),
            category=SimpleNamespace(name=category.name if category else "Uncategorized"),
            title=validated.get("title"),
            date=validated.get("date"),
        )

        recent = list(self.get_queryset().filter(type="expense").order_by("date", "created_at"))
        history = [SimpleNamespace(
            id=tx.id,
            amount=tx.amount,
            type=tx.type,
            category=SimpleNamespace(name=tx.category.name if tx.category else "Uncategorized"),
            title=tx.title,
            date=tx.date,
            updated_at=tx.updated_at,
        ) for tx in recent]

        new_result = score_new_transaction(
            history,
            new_tx,
            cache_key=f"user-{request.user.id}",
        )

        if new_result and new_result.is_anomaly:
            token = uuid4().hex
            proposed = {
                "type": str(validated.get("type")),
                "amount": float(validated.get("amount")),
                "category": category.id if category else None,
                "category_name": category.name if category else "Uncategorized",
                "title": validated.get("title"),
                "note": validated.get("note", ""),
                "date": str(validated.get("date")),
            }
            verification = TransactionVerification.objects.create(
                token=token,
                user=request.user,
                proposed=proposed,
                anomaly_reason=new_result.reason,
            )
            data = TransactionVerificationSerializer(verification).data
            return Response(
                {
                    "detail": "Transaction flagged as unusual. Upload bill photo to verify.",
                    "verification": data,
                },
                status=status.HTTP_202_ACCEPTED,
            )

        # not anomalous — proceed with normal create
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        if serializer.instance.user_id != self.request.user.id:
            raise PermissionDenied("You cannot modify another user's transaction.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.user_id != self.request.user.id:
            raise PermissionDenied("You cannot delete another user's transaction.")
        instance.delete()

    @action(detail=False, methods=["post"], url_path="scan-bill")
    def scan_bill(self, request):
        image = request.FILES.get("image")
        if image is None:
            return Response({"detail": "Please upload a bill photo."}, status=status.HTTP_400_BAD_REQUEST)

        categories = Category.objects.filter(
            Q(user=request.user) | Q(user__isnull=True),
            type="expense",
        ).order_by("name")

        try:
            draft = extract_expense_from_bill(image, list(categories))
        except BillOcrError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "type": "expense",
                "amount": f"{draft.amount:.2f}" if draft.amount is not None else "",
                "category": draft.category_id,
                "category_name": draft.category_name,
                "title": draft.title,
                "note": draft.note,
                "date": draft.date,
                "raw_text": draft.raw_text,
            }
        )

    @action(detail=False, methods=["post"], url_path="verify")
    def verify(self, request):
        token = request.data.get("token")
        image = request.FILES.get("image")
        if not token:
            raise ValidationError({"token": "Verification token is required."})
        try:
            verification = self.request.user.transaction_verifications.get(token=token)
        except TransactionVerification.DoesNotExist:
            raise ValidationError({"token": "Invalid verification token."})

        if verification.is_verified:
            return Response({"detail": "Already verified."}, status=status.HTTP_200_OK)

        if image is None:
            raise ValidationError({"image": "Please upload a bill photo for verification."})

        categories = Category.objects.filter(Q(user=request.user) | Q(user__isnull=True), type="expense").order_by("name")
        try:
            draft = extract_expense_from_bill(image, list(categories))
        except BillOcrError as exc:
            raise ValidationError({"image": str(exc)})

        # compare OCR draft with proposed
        proposed = verification.proposed
        ocr_amounts = extract_amounts_from_text(draft.raw_text)
        if draft.amount is not None:
            normalized_draft_amount = draft.amount.quantize(Decimal("0.01"))
            if normalized_draft_amount not in ocr_amounts:
                ocr_amounts.append(normalized_draft_amount)

        ocr_dates = extract_dates(draft.raw_text)
        try:
            draft_date = date.fromisoformat(draft.date)
        except (TypeError, ValueError):
            draft_date = None
        if draft_date and draft_date not in ocr_dates:
            ocr_dates.append(draft_date)

        proposed_amount = proposed.get("amount")
        amount_ok = amounts_match(ocr_amounts, proposed_amount)
        date_ok = dates_match(ocr_dates, proposed.get("date"))
        verification.ocr_raw_text = draft.raw_text
        verification.save()

        verified = amount_ok and date_ok

        if verified:
            # create the real transaction
            tx_serializer = TransactionSerializer(data={
                "type": proposed.get("type"),
                "amount": proposed.get("amount"),
                "category": proposed.get("category"),
                "title": proposed.get("title"),
                "note": proposed.get("note"),
                "date": proposed.get("date"),
            }, context={"request": request})
            tx_serializer.is_valid(raise_exception=True)
            tx = tx_serializer.save(user=request.user)
            verification.mark_verified(ocr_text=draft.raw_text)
            return Response(TransactionSerializer(tx, context={"request": request}).data, status=status.HTTP_201_CREATED)

        # not matched — return OCR draft and mismatch details
        return Response(
            {
                "detail": "OCR did not match the proposed transaction.",
                "proposed": proposed,
                "ocr": {
                    "amount": f"{draft.amount:.2f}" if draft.amount is not None else None,
                    "date": draft.date,
                    "category_name": draft.category_name,
                    "title": draft.title,
                    "raw_text": draft.raw_text,
                },
                "matches": {"amount": amount_ok, "date": date_ok},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    @action(detail=True, methods=["post"], url_path="verify-ocr")
    def verify_existing(self, request, pk=None):
        transaction = self.get_object()
        if transaction.type != "expense":
            raise ValidationError({"transaction": "Only expense transactions can be verified with a bill photo."})

        image = request.FILES.get("image")
        if image is None:
            raise ValidationError({"image": "Please upload a bill photo for verification."})

        proposed = proposed_from_transaction(transaction)
        categories = Category.objects.filter(Q(user=request.user) | Q(user__isnull=True), type="expense").order_by("name")

        try:
            draft, verified, matches = compare_bill_to_proposed(image, list(categories), proposed)
        except BillOcrError as exc:
            raise ValidationError({"image": str(exc)})

        verification = next(
            (
                item
                for item in TransactionVerification.objects.filter(user=request.user)
                if str(item.proposed.get("transaction_id")) == str(transaction.id)
            ),
            None,
        )
        if verification is None:
            verification = TransactionVerification.objects.create(
                user=request.user,
                proposed=proposed,
                anomaly_reason=request.data.get("anomaly_reason", ""),
            )
        verification.proposed = proposed
        verification.ocr_raw_text = draft.raw_text
        if request.data.get("anomaly_reason"):
            verification.anomaly_reason = request.data.get("anomaly_reason")
        verification.save()

        if verified:
            verification.mark_verified(ocr_text=draft.raw_text)
            return Response(
                {
                    **TransactionSerializer(transaction, context={"request": request}).data,
                    "verification": TransactionVerificationSerializer(verification).data,
                    "matches": matches,
                    "detail": "Transaction verified with OCR.",
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                "detail": "OCR did not match the selected transaction.",
                "proposed": proposed,
                "ocr": {
                    "amount": f"{draft.amount:.2f}" if draft.amount is not None else None,
                    "date": draft.date,
                    "category_name": draft.category_name,
                    "title": draft.title,
                    "raw_text": draft.raw_text,
                },
                "matches": matches,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    @action(detail=False, methods=["get"], url_path="anomalies")
    def anomalies(self, request):
        try:
            contamination = float(request.query_params.get("contamination", str(DEFAULT_CONTAMINATION)))
        except ValueError:
            raise ValidationError({"contamination": "Enter a valid number."})

        if not 0 < contamination < 0.5:
            raise ValidationError({"contamination": "Value must be greater than 0 and less than 0.5."})

        transactions = list(self.get_queryset().filter(type="expense").order_by("date", "created_at"))
        results = detect_anomalies(
            transactions,
            contamination=contamination,
            cache_key=f"user-{request.user.id}",
        )
        result_map = {result.transaction_id: result for result in results}
        anomalous_transactions = [
            transaction
            for transaction in transactions
            if result_map[transaction.id].is_anomaly
        ]
        verified_ids = verified_transaction_ids_for(request.user)
        anomalous_transactions = [
            transaction for transaction in anomalous_transactions if transaction.id not in verified_ids
        ]
        anomalous_transactions.sort(
            key=lambda transaction: result_map[transaction.id].anomaly_score,
            reverse=True,
        )

        limit = request.query_params.get("limit")
        if limit:
            try:
                limit_value = int(limit)
            except ValueError:
                raise ValidationError({"limit": "Enter a valid integer."})
            anomalous_transactions = anomalous_transactions[: max(limit_value, 0)]

        return Response(
            {
                "count": len(anomalous_transactions),
                "total_checked": len(transactions),
                "results": [
                    {
                        **TransactionSerializer(transaction, context={"request": request}).data,
                        "anomaly_score": result_map[transaction.id].anomaly_score,
                        "anomaly_reason": result_map[transaction.id].reason,
                    }
                    for transaction in anomalous_transactions
                ],
            }
        )
