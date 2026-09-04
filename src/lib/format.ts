export const brl = (n: number | null | undefined) =>
  typeof n === "number"
    ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "—";

export const km = (n: number | null | undefined) =>
  typeof n === "number" ? `${n.toLocaleString("pt-BR")} km` : "—";

export const onlyDigits = (s: string) => s.replace(/\D+/g, "");

/**
 * Normaliza um telefone brasileiro para o formato exigido pela API do WhatsApp
 * (DDI + DDD + número, apenas dígitos).
 * Aceita "(83) 9 3618-0252", "+55 83 93618-0252", "083936180252", etc.
 */
export const waNumber = (phone: string | null | undefined) => {
  let d = onlyDigits(phone || "");
  if (!d) return "";
  // remove zeros de operadora/prefixo internacional: 0055..., 083...
  d = d.replace(/^0+/, "");
  if (d.startsWith("00")) d = d.slice(2);
  // já com DDI Brasil
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) return d;
  // número BR sem DDI: 10 (fixo) ou 11 (celular) dígitos
  if (d.length === 10 || d.length === 11) return `55${d}`;
  // celular sem DDI e sem o 9 (ex.: 83 3618-0252 já cai acima); demais casos
  if (d.length < 10) return "";
  return d;
};

/** Link válido para abrir a conversa no WhatsApp (web e app). */
export const whatsappLink = (phone: string | null | undefined, msg?: string) => {
  const n = waNumber(phone);
  if (!n) return "";
  return msg ? `https://wa.me/${n}?text=${encodeURIComponent(msg)}` : `https://wa.me/${n}`;
};

/** Monta o endereço completo a partir dos campos detalhados (rua, número, bairro, cidade, UF, CEP). */
export const composeAddress = (s: any): string => {
  if (!s) return "";
  const street = [s.address_street, s.address_number].filter(Boolean).join(", ");
  const parts = [
    street,
    s.address_district,
    [s.address_city, s.address_state].filter(Boolean).join(" - "),
    s.address_cep ? `CEP ${s.address_cep}` : "",
  ].filter((p) => p && String(p).trim());
  const full = parts.join(", ");
  return full || (s.address || "");
};
