export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
  }).format(amount);
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-NZ").format(date);
}
