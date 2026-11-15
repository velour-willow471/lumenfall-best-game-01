export const FIELD = { width: 1280, height: 720 };
export const STEP = 1 / 60;
export const BEST_KEY = 'lumenfall.best';
export const COLORS = {
  dark: '#070b14', ink: '#0b1221', grid: '#183142', cyan: '#52f5e7',
  white: '#e9f9fa', muted: '#8baab8', coral: '#ff6c76', gold: '#ffd36b',
  violet: '#b793ff', green: '#9affac'
};
export const UPGRADES = [
  { id: 'rate', title: 'RAPID PULSE', detail: '+22% fire rate', color: COLORS.cyan },
  { id: 'damage', title: 'HOT CORE', detail: '+1 damage', color: COLORS.coral },
  { id: 'speed', title: 'VECTOR DRIVE', detail: '+18% ship speed', color: COLORS.green },
  { id: 'hull', title: 'HULL PLATING', detail: '+1 max hull · repair 1', color: COLORS.gold },
  { id: 'multi', title: 'PRISM ARRAY', detail: '+2 angled shots', color: COLORS.violet },
  { id: 'shield', title: 'AEGIS FIELD', detail: '+1 shield charge', color: COLORS.cyan }
];
