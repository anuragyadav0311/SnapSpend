export function parseInputDate(dateValue) {
  if (!dateValue) {
    return null;
  }

  const [year, month, day] = dateValue.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatLocalDate(dateValue) {
  return [
    dateValue.getFullYear(),
    String(dateValue.getMonth() + 1).padStart(2, "0"),
    String(dateValue.getDate()).padStart(2, "0"),
  ].join("-");
}

export function todayValue() {
  return formatLocalDate(new Date());
}

export function currentMonthValue() {
  return todayValue().slice(0, 7);
}

export function addDays(dateValue, days) {
  const next = new Date(dateValue.getTime());
  next.setDate(next.getDate() + days);
  return next;
}

export function toInputDate(dateValue) {
  return formatLocalDate(dateValue);
}

export function monthRange(baseDate) {
  const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
  return { start: toInputDate(start), end: toInputDate(end) };
}

export function clampDateToToday(dateValue) {
  if (!dateValue) {
    return "";
  }
  return dateValue > todayValue() ? todayValue() : dateValue;
}

export function normalizeDateRange(startDate, endDate) {
  const safeStart = clampDateToToday(startDate);
  const safeEnd = clampDateToToday(endDate);

  if (safeStart && safeEnd && safeStart > safeEnd) {
    return { startDate: safeStart, endDate: safeStart };
  }

  return { startDate: safeStart, endDate: safeEnd };
}

export function buildReportRange(period, anchor = todayValue()) {
  const baseDate = parseInputDate(clampDateToToday(anchor) || todayValue());
  const today = todayValue();
  const normalizeReportRange = (start, end) => {
    const normalized = normalizeDateRange(start, end);
    return { start: normalized.startDate, end: normalized.endDate };
  };

  if (period === "daily") {
    const value = toInputDate(baseDate);
    return { start: value, end: value };
  }

  if (period === "weekly") {
    const weekday = baseDate.getDay();
    const offsetToMonday = weekday === 0 ? -6 : 1 - weekday;
    const weekStart = addDays(baseDate, offsetToMonday);
    return normalizeReportRange(toInputDate(weekStart), toInputDate(addDays(weekStart, 6)));
  }

  if (period === "quarterly") {
    const quarterStartMonth = Math.floor(baseDate.getMonth() / 3) * 3;
    const start = new Date(baseDate.getFullYear(), quarterStartMonth, 1);
    const end = new Date(baseDate.getFullYear(), quarterStartMonth + 3, 0);
    return normalizeReportRange(toInputDate(start), toInputDate(end));
  }

  if (period === "yearly") {
    return normalizeReportRange(
      toInputDate(new Date(baseDate.getFullYear(), 0, 1)),
      toInputDate(new Date(baseDate.getFullYear(), 11, 31)),
    );
  }

  const monthly = monthRange(baseDate);
  return {
    start: monthly.start,
    end: monthly.end > today ? today : monthly.end,
  };
}
