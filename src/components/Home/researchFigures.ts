// The numbers behind the three Research charts. Every value is quoted from the paper's own
// PDF (public/research/<slug>/paper.pdf); the page is the one printed on the sheet.
// Colours are the bklit tokens of `.bk` (src/styles/tailwind.css).

/** RCT, Table 6.1 (p. 67): reported saving, % of initial residual income, completers. */
export const RCT_MONTHS = ['Baseline', 'Aug', 'Sep', 'Oct'];
export const RCT_ARMS = [
  { key: 'hybrid', label: 'Hybrid', color: 'var(--chart-1)', mean: [37.55, 75.97, 91.33, 101.07], sd: [17.1, 20.9, 26.1, 23.3] },
  { key: 'app', label: 'App', color: 'var(--chart-warm-2)', mean: [39.21, 70.37, 89.64, 97.82], sd: [24.4, 28.2, 17.4, 25.5] },
  { key: 'spreadsheet', label: 'Spreadsheet', color: 'var(--chart-2)', mean: [45.89, 67.45, 80.59, 91.4], sd: [22.7, 28.8, 12.4, 20.3] },
  { key: 'control', label: 'Control', color: 'var(--chart-3)', mean: [41.27, 42.33, 40.16, 44.25], sd: [13.5, 22.4, 15.7, 26.4] },
];

/**
 * Kinetics, mechanism A → I → B. The three ratios k2/k1 are the ones drawn in Figure 18 (p. 41);
 * `maxError` is Table 6 (p. 41), column 2, as a percentage of [A]0.
 */
export const KINETICS_RATIOS = [
  { ratio: 2, maxError: '25.0%' },
  { ratio: 10, maxError: '7.7%' },
  { ratio: 100, maxError: '0.95%' },
];
export const KINETICS_SERIES = [
  { key: 'a', label: '[A] reactant', short: '[A]', color: 'var(--chart-3)', dashed: false },
  { key: 'b', label: '[B] product, exact', short: '[B] exact', color: 'var(--chart-5)', dashed: false },
  { key: 'bSsh', label: '[B] by the approximation', short: '[B] approximation', color: 'var(--chart-1)', dashed: true },
  { key: 'i', label: '[I] intermediate, the gap between the two', short: '[I]', color: 'var(--chart-1)', dashed: false },
];

/** Candela, Table 1 (p. 5): material cost of each experiment, in reais. They add up to the R$83 kit. */
export const KIT_EXPERIMENTS = [
  { name: 'Velocity', domain: 'Kinematics', cost: 15 },
  { name: 'Friction', domain: 'Dynamics', cost: 18 },
  { name: "Hooke's law", domain: 'Elasticity', cost: 12 },
  { name: 'Pendulum', domain: 'Oscillations', cost: 8 },
  { name: 'Buoyancy', domain: 'Fluid statics', cost: 30 },
];
