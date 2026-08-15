import { buildThemeStyle, shade, readableOn, isGradient, firstColorOf } from "@/lib/theme-color";

export type StoreThemeResult = {
  themeStyle: React.CSSProperties;
  heroStyle: React.CSSProperties;
  headerStyle?: React.CSSProperties;
  footerStyle?: React.CSSProperties;
  buttonColor?: string;
  buttonStyle?: React.CSSProperties;
  cardBgOverride?: string;
};

/** Deriva todos os estilos da vitrine a partir das cores salvas pelo lojista. */
export function storeTheme(settings: any | null): StoreThemeResult {
  const s: any = settings || {};

  const themeStyle: React.CSSProperties =
    buildThemeStyle(s.theme_color, { bg: s.theme_bg, text: s.theme_text, card: s.theme_card }) || {};
  if (isGradient(s.theme_bg)) (themeStyle as any).background = s.theme_bg;

  const heroRaw = s.theme_hero || s.theme_color;
  const heroStyle: React.CSSProperties = isGradient(s.theme_hero)
    ? { background: s.theme_hero, color: readableOn(firstColorOf(s.theme_hero) || "#0f172a") }
    : heroRaw
      ? {
          background: `linear-gradient(140deg, ${shade(heroRaw, -40)} 0%, ${shade(heroRaw, -15)} 60%, ${heroRaw} 100%)`,
          color: readableOn(heroRaw),
        }
      : {};

  const headerStyle: React.CSSProperties | undefined = s.theme_header
    ? isGradient(s.theme_header)
      ? { background: s.theme_header, color: readableOn(firstColorOf(s.theme_header) || "#ffffff") }
      : { backgroundColor: s.theme_header, color: readableOn(s.theme_header) }
    : undefined;

  const footerStyle: React.CSSProperties | undefined = s.theme_footer
    ? isGradient(s.theme_footer)
      ? { background: s.theme_footer, color: readableOn(firstColorOf(s.theme_footer) || "#0f172a") }
      : { backgroundColor: s.theme_footer, color: readableOn(s.theme_footer) }
    : undefined;

  const buttonColor: string | undefined = s.theme_button || undefined;

  return {
    themeStyle,
    heroStyle,
    headerStyle,
    footerStyle,
    buttonColor,
    buttonStyle: buttonStyleFor(buttonColor),
    cardBgOverride: isGradient(s.theme_card) ? s.theme_card : undefined,
  };
}

/** Estilo inline para qualquer botão que deve seguir a "cor dos botões" da loja. */
export function buttonStyleFor(color?: string | null): React.CSSProperties | undefined {
  if (!color) return undefined;
  const fg = isGradient(color) ? readableOn(firstColorOf(color) || "#25d366") : readableOn(color);
  return isGradient(color)
    ? { background: color, color: fg, borderColor: "transparent" }
    : { backgroundColor: color, color: fg, borderColor: color };
}
