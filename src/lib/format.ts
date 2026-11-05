const currency = new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 });
const number = new Intl.NumberFormat("he-IL", { maximumFractionDigits: 0 });
const percent = new Intl.NumberFormat("he-IL", { style: "percent", maximumFractionDigits: 0 });

const currency2 = new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const formatILS = (n: number) => (Number.isInteger(Math.round(n * 100) / 100) ? currency : currency2).format(n);
export const formatNumber = (n: number) => number.format(n);
export const formatPercent = (ratio: number) => percent.format(ratio);
export const formatCompact = (n: number) => (n >= 1000 ? `${number.format(n / 1000)}K` : number.format(n));
export const formatSignedPercent = (p: number) => `${p > 0 ? "+" : ""}${p}%`;
