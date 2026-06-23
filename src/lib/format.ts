export const brl = (n: number | null | undefined) =>
  typeof n === "number"
    ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "—";

export const km = (n: number | null | undefined) =>
  typeof n === "number" ? `${n.toLocaleString("pt-BR")} km` : "—";

export const onlyDigits = (s: string) => s.replace(/\D+/g, "");

export const whatsappLink = (phone: string, msg: string) =>
  `https://wa.me/${onlyDigits(phone)}?text=${encodeURIComponent(msg)}`;
