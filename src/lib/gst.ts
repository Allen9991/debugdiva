export function calculateNzGst(amount: number) {
  return Math.round(amount * 0.15 * 100) / 100;
}

export function addGst(subtotal: number) {
  const gst = calculateNzGst(subtotal);
  return { subtotal, gst, total: subtotal + gst };
}
