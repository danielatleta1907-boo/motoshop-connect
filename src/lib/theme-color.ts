// Derive a full store theme from a single hex color.
// Applied via inline CSS variables so it themes bg/text/cards/borders/primary.

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace("#", "").trim();
  if (h.length !== 6) return null;
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return null;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

// amount: -100 (black) .. 0 (same) .. 100 (white)
export function shade(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const t = amount < 0 ? 0 : 255;
  const p = Math.abs(amount) / 100;
  return rgbToHex(
    (t - rgb.r) * p + rgb.r,
    (t - rgb.g) * p + rgb.g,
    (t - rgb.b) * p + rgb.b,
  );
}

function luminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.5;
  const chan = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(rgb.r) + 0.7152 * chan(rgb.g) + 0.0722 * chan(rgb.b);
}

export function readableOn(hex: string): string {
  return luminance(hex) > 0.5 ? "#0f172a" : "#ffffff";
}

export function buildThemeStyle(
  hex?: string | null,
  overrides?: { bg?: string | null; text?: string | null; card?: string | null },
): React.CSSProperties | undefined {
  if (!hex && !overrides?.bg && !overrides?.text && !overrides?.card) return undefined;
  const primary = hex || "#84cc16";
  const primaryFg = readableOn(primary);
  const background = overrides?.bg || shade(primary, 92);
  const card = overrides?.card || shade(primary, 96);
  const foreground = overrides?.text || shade(primary, -75);
  const muted = shade(background, -8);
  const mutedFg = shade(foreground, 35);
  const border = shade(background, -15);
  const secondary = shade(primary, -60);
  const secondaryFg = shade(primary, 95);
  const accent = shade(primary, 70);

  return {
    ["--background" as any]: background,
    ["--foreground" as any]: foreground,
    ["--card" as any]: card,
    ["--card-foreground" as any]: foreground,
    ["--popover" as any]: card,
    ["--popover-foreground" as any]: foreground,
    ["--primary" as any]: primary,
    ["--primary-foreground" as any]: primaryFg,
    ["--secondary" as any]: secondary,
    ["--secondary-foreground" as any]: secondaryFg,
    ["--muted" as any]: muted,
    ["--muted-foreground" as any]: mutedFg,
    ["--accent" as any]: accent,
    ["--accent-foreground" as any]: foreground,
    ["--border" as any]: border,
    ["--input" as any]: border,
    ["--ring" as any]: primary,
    ["--color-background" as any]: background,
    ["--color-foreground" as any]: foreground,
    ["--color-card" as any]: card,
    ["--color-card-foreground" as any]: foreground,
    ["--color-primary" as any]: primary,
    ["--color-primary-foreground" as any]: primaryFg,
    ["--color-secondary" as any]: secondary,
    ["--color-secondary-foreground" as any]: secondaryFg,
    ["--color-muted" as any]: muted,
    ["--color-muted-foreground" as any]: mutedFg,
    ["--color-accent" as any]: accent,
    ["--color-border" as any]: border,
    ["--color-input" as any]: border,
    ["--color-ring" as any]: primary,
  } as React.CSSProperties;
}
