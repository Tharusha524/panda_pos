export function calcPricing(selling: number, purchase: number) {
  const profit = selling - purchase;
  const margin = selling > 0 ? (profit / selling) * 100 : 0;
  const markup = purchase > 0 ? (profit / purchase) * 100 : 0;
  return {
    margin: Math.round(margin * 100) / 100,
    markup: Math.round(markup * 100) / 100,
    profit: Math.round(profit * 100) / 100,
  };
}
