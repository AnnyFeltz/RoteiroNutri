// Paleta do src/styles.css do Lovable (oklch convertido para hex).
export const colors = {
  background: "#faf7ec", foreground: "#162316", card: "#fffdf9",
  primary: "#2e5929", primaryForeground: "#faf8f1",
  leaf: "#367b30", leafDeep: "#1c4219",
  secondary: "#ede8d9", secondaryForeground: "#243921",
  muted: "#efebe0", mutedForeground: "#5e6657",
  accent: "#f2e2d0", accentForeground: "#4e270d",
  terracotta: "#ae5528", sand: "#ece4d2", cream: "#f9f5eb",
  destructive: "#c53732", success: "#47944c", warning: "#dc932e",
  border: "#dbd7cd", input: "#e0dcd0",
};
export const gradients = { leaf: [colors.leafDeep, colors.leaf] };
export const radius = { sm: 8, md: 10, lg: 14, xl: 18, pill: 999 };
export const spacing = (n) => n * 4;
