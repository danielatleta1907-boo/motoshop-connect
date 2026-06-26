export const brl = (n: number | null | undefined) =>
  typeof n === "number"
    ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "—";

export const km = (n: number | null | undefined) =>
  typeof n === "number" ? `${n.toLocaleString("pt-BR")} km` : "—";

export const onlyDigits = (s: string) => s.replace(/\D+/g, "");

// Garante DDI Brasil (55) quando o número foi salvo só com DDD.
export const waNumber = (phone: string) => {
  const d = onlyDigits(phone);
  if (!d) return "";
  if (d.startsWith("55")) return d;
  // 10 (fixo) ou 11 (celular) dígitos = número BR sem DDI
  if (d.length === 10 || d.length === 11) return `55${d}`;
  return d;
};

export const whatsappLink = (phone: string, msg: string) =>
  `https://wa.me/${waNumber(phone)}?text=${encodeURIComponent(msg)}`;
