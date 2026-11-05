const currency = new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 });
const number = new Intl.NumberFormat("he-IL", { maximumFractionDigits: 0 });
const percent = new Intl.NumberFormat("he-IL", { style: "percent", maximumFractionDigits: 0 });

export const formatILS = (n: number) => currency.format(n);
export const formatNumber = (n: number) => number.format(n);
export const formatPercent = (ratio: number) => percent.format(ratio);
export const formatCompact = (n: number) => (n >= 1000 ? `${number.format(n / 1000)}K` : number.format(n));
export const formatSignedPercent = (p: number) => `${p > 0 ? "+" : ""}${p}%`;
