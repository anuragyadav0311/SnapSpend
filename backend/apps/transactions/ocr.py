from __future__ import annotations

import platform
import re
import shutil
import statistics
import subprocess
import tempfile
from dataclasses import dataclass
from datetime import date
from decimal import Decimal, InvalidOperation
from pathlib import Path

from django.utils import timezone
from PIL import Image, ImageFilter, ImageOps, UnidentifiedImageError


MAX_UPLOAD_SIZE = 8 * 1024 * 1024
TESSERACT_PSMS = ("6", "11")
MONEY_RE = re.compile(
    r"(?<![\dA-Za-z])(?:rs\.?|inr|\u20b9)?\s*"
    r"([0-9]{1,3}(?:[, ]?[0-9]{2,3})*(?:\.\d{1,2})?|[0-9]+(?:\.\d{1,2}))"
    r"(?![\dA-Za-z])",
    re.IGNORECASE,
)
NUMBER_TOKEN_RE = re.compile(r"[A-Za-z0-9.,]+")
DATE_LIKE_RE = re.compile(
    r"\b(?:20\d{2}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})\b"
)
TEXT_DATE_LIKE_RE = re.compile(
    r"\b(?:\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{2,4})\b",
    re.IGNORECASE,
)

MONTHS = {
    "jan": 1,
    "january": 1,
    "feb": 2,
    "february": 2,
    "mar": 3,
    "march": 3,
    "apr": 4,
    "april": 4,
    "may": 5,
    "jun": 6,
    "june": 6,
    "jul": 7,
    "july": 7,
    "aug": 8,
    "august": 8,
    "sep": 9,
    "sept": 9,
    "september": 9,
    "oct": 10,
    "october": 10,
    "nov": 11,
    "november": 11,
    "dec": 12,
    "december": 12,
}

CATEGORY_KEYWORDS = {
    "Food & Dining": {
        "restaurant",
        "cafe",
        "coffee",
        "dining",
        "food",
        "pizza",
        "burger",
        "swiggy",
        "zomato",
        "bakery",
        "kitchen",
        "hotel",
        "meal",
    },
    "Groceries": {
        "grocery",
        "groceries",
        "supermarket",
        "mart",
        "bazaar",
        "provision",
        "fresh",
        "vegetable",
        "fruit",
        "milk",
    },
    "Transportation": {
        "fuel",
        "petrol",
        "diesel",
        "uber",
        "ola",
        "taxi",
        "metro",
        "parking",
        "toll",
        "transport",
    },
    "Utilities": {"electricity", "water", "gas", "broadband", "internet", "mobile", "recharge", "utility"},
    "Healthcare": {"pharmacy", "medical", "medicine", "clinic", "hospital", "health", "doctor", "diagnostic"},
    "Entertainment": {"movie", "cinema", "theatre", "ticket", "game", "bowling", "entertainment"},
    "Shopping": {"fashion", "apparel", "cloth", "store", "shopping", "mall", "electronics", "retail"},
    "Education": {"book", "school", "college", "course", "tuition", "education", "stationery"},
    "Subscriptions": {"subscription", "netflix", "spotify", "prime", "membership", "renewal"},
    "Insurance": {"insurance", "premium", "policy"},
    "Travel": {"flight", "hotel", "booking", "train", "bus", "travel", "airport"},
    "Rent": {"rent", "lease"},
    "Gifts & Donations": {"gift", "donation", "charity"},
}
GENERIC_TITLE_KEYWORDS = {"subscription", "membership", "renewal", "booking", "premium", "policy"}


class BillOcrError(ValueError):
    pass


@dataclass(frozen=True)
class BillDraft:
    amount: Decimal | None
    date: str
    title: str
    category_id: int | None
    category_name: str
    note: str
    raw_text: str


def extract_expense_from_bill(image_file, categories) -> BillDraft:
    if not image_file:
        raise BillOcrError("Please upload a bill photo.")

    if getattr(image_file, "size", 0) > MAX_UPLOAD_SIZE:
        raise BillOcrError("Bill photo must be smaller than 8 MB.")

    raw_text_candidates = run_tesseract(image_file)
    cleaned_candidates = []
    for raw_text in raw_text_candidates:
        normalized = normalize_ocr_text(raw_text)
        if normalized.strip() and normalized not in cleaned_candidates:
            cleaned_candidates.append(normalized)

    if not cleaned_candidates:
        raise BillOcrError("No readable text was found in this bill photo.")

    drafts = [parse_bill_text(raw_text, categories) for raw_text in cleaned_candidates]
    return max(drafts, key=score_bill_draft)


def get_tesseract_path() -> str | None:
    path = shutil.which("tesseract")
    if path:
        return path

    if platform.system() == "Windows":
        common_paths = [
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        ]
        for p in common_paths:
            if Path(p).is_file():
                return p
    return None


def run_tesseract(image_file) -> list[str]:
    tesseract_cmd = get_tesseract_path()
    if not tesseract_cmd:
        raise BillOcrError("Tesseract OCR is not installed on this system.")

    result = None
    try:
        with Image.open(image_file) as image:
            processed_variants = build_ocr_variants(ImageOps.exif_transpose(image))
            texts = []
            with tempfile.TemporaryDirectory() as temp_dir:
                for variant_index, processed in enumerate(processed_variants):
                    image_path = Path(temp_dir) / f"bill-{variant_index}.png"
                    processed.save(image_path)
                    for psm in TESSERACT_PSMS:
                        result = subprocess.run(
                            [tesseract_cmd, str(image_path), "stdout", "--psm", psm, "-l", "eng"],
                            check=False,
                            capture_output=True,
                            text=True,
                            timeout=25,
                        )
                        if result.returncode == 0 and result.stdout.strip():
                            texts.append(result.stdout)
    except (OSError, UnidentifiedImageError) as exc:
        raise BillOcrError("Please upload a valid bill image.") from exc
    except subprocess.TimeoutExpired as exc:
        raise BillOcrError("Tesseract took too long to read this bill photo.") from exc

    if not texts and result and result.returncode != 0:
        raise BillOcrError("Tesseract could not read this bill photo.")

    return texts


def build_ocr_variants(image: Image.Image) -> list[Image.Image]:
    grayscale = ImageOps.autocontrast(image.convert("L"))
    base_width = max(grayscale.width, 1)
    scale = max(1.0, min(2.5, 1800 / base_width))
    resized = grayscale.resize(
        (max(1, int(grayscale.width * scale)), max(1, int(grayscale.height * scale))),
        Image.Resampling.LANCZOS,
    )
    sharpened = ImageOps.autocontrast(resized.filter(ImageFilter.SHARPEN))
    thresholded = sharpened.point(lambda px: 255 if px > 168 else 0).convert("L")
    boosted = ImageOps.autocontrast(resized.point(lambda px: 255 if px > 188 else max(0, px - 32)).convert("L"))

    variants = [resized, sharpened, thresholded, boosted]

    # Detect dark-background images (screenshots, dark-mode bills, etc.)
    # by checking if the average pixel intensity is below 128.
    # Tesseract works best with dark text on light background, so we add
    # inverted variants to handle light-text-on-dark-background images.

    sample_data = list(resized.getdata())
    avg_pixel = statistics.mean(sample_data) if sample_data else 128
    if avg_pixel < 128:
        inverted_resized = ImageOps.invert(resized)
        inverted_sharpened = ImageOps.autocontrast(inverted_resized.filter(ImageFilter.SHARPEN))
        inverted_thresholded = inverted_sharpened.point(lambda px: 255 if px > 168 else 0).convert("L")
        inverted_boosted = ImageOps.autocontrast(
            inverted_resized.point(lambda px: 255 if px > 188 else max(0, px - 32)).convert("L")
        )
        # Prepend inverted variants so they are tried first for dark images
        variants = [inverted_resized, inverted_sharpened, inverted_thresholded, inverted_boosted] + variants

    return variants


def normalize_ocr_text(raw_text: str) -> str:
    normalized_lines = []
    for line in raw_text.splitlines():
        cleaned = line.replace("\u20b9", "Rs. ")
        cleaned = re.sub(r"[ \t]+", " ", cleaned).strip()
        if cleaned:
            normalized_lines.append(cleaned)
    return "\n".join(normalized_lines)


def parse_bill_text(raw_text: str, categories) -> BillDraft:
    lines = clean_lines(raw_text)
    category = infer_category(raw_text, categories)

    amount = infer_amount(lines)
    bill_date = infer_date(raw_text)
    title = infer_title(lines, category_name=category.name if category else "")
    category_name = category.name if category else "Uncategorized"
    note = "Scanned from bill photo."

    return BillDraft(
        amount=amount,
        date=bill_date.isoformat(),
        title=title,
        category_id=category.id if category else None,
        category_name=category_name,
        note=note,
        raw_text=raw_text.strip(),
    )


def clean_lines(raw_text: str) -> list[str]:
    return [line.strip() for line in raw_text.splitlines() if line.strip()]


def infer_amount(lines: list[str]) -> Decimal | None:
    candidates = []
    for index, line in enumerate(lines):
        lowered = line.lower()
        if any(token in lowered for token in ("phone", "mobile", "gstin", "invoice no", "bill no", "order id", "date", "time")):
            continue

        money_context = has_money_context(line)
        surrounding_context = nearby_amount_context(lines, index)
        amount_context = money_context or surrounding_context
        if not amount_context and looks_like_reference_or_date_line(line):
            continue

        priority = 0
        scoring_context = " ".join(
            lines[position].lower()
            for position in (index - 1, index, index + 1)
            if 0 <= position < len(lines)
        )
        if any(
            token in scoring_context
            for token in ("grand total", "amount payable", "net payable", "balance due", "bill amount")
        ):
            priority = 5
        elif re.search(r"\btotal\b", scoring_context):
            priority = 4
        elif any(token in scoring_context for token in ("paid", "card", "cash", "upi")):
            priority = 2

        if any(
            token in lowered
            for token in ("subtotal", "sub total", "tax", "cgst", "sgst", "igst", "change", "qty", "rate")
        ):
            priority -= 2
        if not amount_context:
            priority -= 3

        for value in extract_line_amounts(line, money_context=amount_context):
            candidates.append((priority, amount_plausibility_score(value), value, index))

    if not candidates:
        return None

    _, _, value, _ = max(candidates, key=lambda item: (item[0], item[1], item[2], item[3]))
    return value.quantize(Decimal("0.01"))


def extract_amounts_from_text(raw_text: str) -> list[Decimal]:
    amounts = []
    seen = set()

    for line in clean_lines(raw_text):
        money_context = has_money_context(line)
        if not money_context:
            continue

        for amount in extract_line_amounts(line, money_context=money_context):
            normalized = amount.quantize(Decimal("0.01"))
            if normalized not in seen:
                amounts.append(normalized)
                seen.add(normalized)

    return amounts


def has_money_context(line: str) -> bool:
    lowered = line.lower()
    return any(
        token in lowered
        for token in (
            "total",
            "subtotal",
            "sub total",
            "tax",
            "gst",
            "cgst",
            "sgst",
            "igst",
            "paid",
            "cash",
            "card",
            "upi",
            "amount",
            "rs",
            "inr",
        )
    ) or "\u20b9" in line


def looks_like_reference_or_date_line(line: str) -> bool:
    lowered = line.lower()
    if any(token in lowered for token in ("invoice", "order", "reference", "receipt", "transaction id")):
        return True
    if DATE_LIKE_RE.search(line) or TEXT_DATE_LIKE_RE.search(line):
        return True

    digits = sum(char.isdigit() for char in line)
    separators = sum(char in "-/:_#" for char in line)
    return digits >= 4 and separators >= 1


def nearby_amount_context(lines: list[str], index: int) -> bool:
    current_amounts = extract_line_amounts(lines[index], money_context=False)
    if not current_amounts:
        return False

    for neighbor_index in (index - 1, index + 1):
        if not 0 <= neighbor_index < len(lines):
            continue
        neighbor = lines[neighbor_index]
        if has_money_context(neighbor) and not extract_line_amounts(neighbor, money_context=True):
            return True

    return False


def extract_line_amounts(line: str, money_context: bool) -> list[Decimal]:
    values = []
    seen = set()

    for match in MONEY_RE.finditer(line):
        amount = parse_amount(match.group(1), money_context=money_context)
        if amount is not None and amount not in seen:
            values.append(amount)
            seen.add(amount)

    for token in NUMBER_TOKEN_RE.findall(line):
        if not any(char.isdigit() for char in token):
            continue
        amount = parse_amount(token, money_context=money_context)
        if amount is not None and amount not in seen:
            values.append(amount)
            seen.add(amount)

    return values


def parse_amount(value: str, money_context: bool = False) -> Decimal | None:
    normalized = normalize_numeric_token(value)
    if not normalized:
        return None

    raw_variants = [normalized]
    if "." not in normalized and money_context and len(normalized.replace(".", "")) >= 3:
        raw_variants.append(f"{normalized[:-2]}.{normalized[-2:]}")

    best_amount = None
    best_score = None
    for variant in raw_variants:
        try:
            amount = Decimal(variant)
        except InvalidOperation:
            continue

        if amount <= 0 or amount > Decimal("10000000"):
            continue

        score = amount_plausibility_score(amount)
        if "." in variant:
            score += 2
        if variant != normalized:
            score += 2

        if best_score is None or score > best_score or (score == best_score and amount < best_amount):
            best_amount = amount
            best_score = score

    return best_amount


def normalize_numeric_token(value: str) -> str:
    filtered = re.sub(r"[^0-9A-Za-z.,]", "", value)
    if not any(char.isdigit() for char in filtered):
        return ""

    translation = str.maketrans({
        "O": "0",
        "o": "0",
        "Q": "0",
        "D": "0",
        "I": "1",
        "l": "1",
        "S": "5",
        "s": "5",
        "B": "8",
    })
    normalized = filtered.translate(translation)
    normalized = re.sub(r"[^0-9.,]", "", normalized).replace(",", "")
    if normalized.count(".") > 1:
        parts = normalized.split(".")
        normalized = "".join(parts[:-1]) + "." + parts[-1]
    return normalized.strip(".")


def amount_plausibility_score(amount: Decimal) -> int:
    if amount < Decimal("1"):
        return -5
    if amount > Decimal("100000"):
        return -4
    if amount > Decimal("50000"):
        return -2
    if amount > Decimal("10000"):
        return -1
    return 0


def infer_date(raw_text: str) -> date:
    dates = extract_dates(raw_text)
    if dates:
        return dates[0]

    return timezone.localdate()


def extract_dates(raw_text: str) -> list[date]:
    dates = []
    seen = set()

    for pattern in (
        r"\b(?P<year>20\d{2})[-/.](?P<month>\d{1,2})[-/.](?P<day>\d{1,2})\b",
        r"\b(?P<day>\d{1,2})[-/.](?P<month>\d{1,2})[-/.](?P<year>\d{2,4})\b",
        r"\b(?P<day>\d{1,2})(?!\d)\s+(?P<month_name>[A-Za-z]{3,9})\s*,?\s*(?P<year>\d{2,4})\b",
        r"\b(?P<month_name>[A-Za-z]{3,9})\s+(?P<day>\d{1,2})(?!\d)\s*,?\s*(?P<year>\d{2,4})\b",
    ):
        for match in re.finditer(pattern, raw_text, flags=re.IGNORECASE):
            parsed_date = build_date(match.groupdict())
            if parsed_date and parsed_date not in seen:
                dates.append(parsed_date)
                seen.add(parsed_date)

    return dates


def build_date(parts: dict[str, str]) -> date | None:
    try:
        year = int(parts["year"])
        if year < 100:
            year += 2000

        month = MONTHS.get(parts.get("month_name", "").lower()) if parts.get("month_name") else int(parts["month"])
        day = int(parts["day"])
        return date(year, month, day)
    except (KeyError, TypeError, ValueError):
        return None


def infer_category(raw_text: str, categories):
    expense_categories = [category for category in categories if category.type == "expense"]
    if not expense_categories:
        return None

    lowered = raw_text.lower()
    scores = []
    for category in expense_categories:
        category_name = category.name.lower()
        score = 3 if category_name in lowered else 0
        for keyword in CATEGORY_KEYWORDS.get(category.name, set()):
            if keyword in lowered:
                score += 1
        scores.append((score, category))

    best_score, best_category = max(scores, key=lambda item: item[0])
    if best_score > 0:
        return best_category

    return next(
        (category for category in expense_categories if category.name == "Other Expense"),
        expense_categories[0],
    )


def infer_title(lines: list[str], category_name: str) -> str:
    noisy_tokens = {
        "invoice",
        "bill",
        "receipt",
        "date",
        "time",
        "gst",
        "gstin",
        "total",
        "amount",
        "cash",
        "card",
        "upi",
        "tax",
        "payment",
        "status",
        "successful",
        "sold to",
        "email",
        "location",
        "thank",
        "membership",
        "help",
    }

    for line in lines[:8]:
        title = clean_title_candidate(line)
        lowered = title.lower()
        alpha_count = sum(char.isalpha() for char in title)
        if alpha_count < 3:
            continue
        if is_noise_title_line(title):
            continue
        if any(token in lowered for token in noisy_tokens):
            continue
        return title[:80]

    keyword_title = infer_title_from_keywords(lines, category_name)
    if keyword_title:
        return keyword_title

    return f"{category_name or 'Bill'} Expense"


def infer_title_from_keywords(lines: list[str], category_name: str) -> str:
    raw_text = "\n".join(lines).lower()
    keywords = CATEGORY_KEYWORDS.get(category_name, set()) - GENERIC_TITLE_KEYWORDS
    for keyword in sorted(keywords, key=len, reverse=True):
        if keyword in raw_text and len(keyword) >= 4:
            return keyword.title()
    return ""


def clean_title_candidate(line: str) -> str:
    cleaned = re.sub(r"^[^A-Za-z0-9]+|[^A-Za-z0-9]+$", "", line)
    return re.sub(r"\s+", " ", cleaned).strip()


def is_noise_title_line(line: str) -> bool:
    compact = re.sub(r"\s+", "", line)
    if not compact:
        return True

    alpha_chars = [char for char in compact if char.isalpha()]
    punctuation_count = sum(not char.isalnum() for char in compact)
    alpha_ratio = len(alpha_chars) / len(compact)
    distinct_letters = {char.lower() for char in alpha_chars}

    if len(compact) > 24 and alpha_ratio < 0.65:
        return True
    if len(compact) > 18 and punctuation_count > len(alpha_chars):
        return True
    if len(compact) > 18 and len(distinct_letters) <= 3:
        return True

    return False


def score_bill_draft(draft: BillDraft) -> tuple[int, int, int]:
    score = 0
    if draft.amount is not None:
        score += 5
        score += amount_plausibility_score(draft.amount)
    if draft.date != timezone.localdate().isoformat():
        score += 2
    if draft.title and not draft.title.endswith("Expense"):
        score += 2
    if draft.category_name != "Uncategorized":
        score += 1
    if "total" in draft.raw_text.lower():
        score += 1
    alpha_chars = sum(char.isalpha() for char in draft.raw_text)
    return score, alpha_chars, len(draft.raw_text)
