export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value || 0);
}

export function formatDecimalInput(value: string | number) {
  if (typeof value === "string") return value;

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
    useGrouping: false
  }).format(value || 0);
}

export function parseDecimalInput(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const compact = raw.replace(/\s+/g, "");
  if (!/^[\d.,]+$/.test(compact)) return null;

  const lastComma = compact.lastIndexOf(",");
  const lastDot = compact.lastIndexOf(".");
  const separatorIndex = Math.max(lastComma, lastDot);

  let integerPart = compact;
  let decimalPart = "";

  if (separatorIndex >= 0) {
    integerPart = compact.slice(0, separatorIndex);
    decimalPart = compact.slice(separatorIndex + 1);
  }

  const integerGroups = integerPart ? integerPart.split(/[.,]/) : [];
  if (integerGroups.some((group) => group.length === 0)) {
    return null;
  }

  if (
    integerGroups.length > 1 &&
    integerGroups.slice(1).some((group) => group.length !== 3)
  ) {
    return null;
  }

  const normalizedInteger = integerGroups.join("");

  if (normalizedInteger && !/^\d+$/.test(normalizedInteger)) {
    return null;
  }

  if (decimalPart && !/^\d{1,2}$/.test(decimalPart)) {
    return null;
  }

  const normalized = decimalPart
    ? `${normalizedInteger || "0"}.${decimalPart}`
    : normalizedInteger || "0";

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatDate(value: string) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium"
  }).format(new Date(value));
}

export function formatHours(value: number) {
  return `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 2
  })} h`;
}

export function toTitleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatMonthReference(value: string) {
  if (!value) return "-";
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric"
  }).format(new Date(year, month - 1, 1));
}

export function formatMonthYearLabel(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric"
  }).format(value);
}
