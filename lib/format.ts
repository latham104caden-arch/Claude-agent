const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export const money = (n: number) => usd.format(n);

export function priceRange(prices: number[]): { from: boolean; amount: number } {
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return { from: min !== max, amount: min };
}
