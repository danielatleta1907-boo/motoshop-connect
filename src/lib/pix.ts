// PIX BR Code (EMV) payload generator — chave estática
function crc16(s: string) {
  let crc = 0xffff;
  for (let i = 0; i < s.length; i++) {
    crc ^= s.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}
const f = (id: string, val: string) => id + val.length.toString().padStart(2, "0") + val;

export function pixPayload(opts: {
  key: string;
  name?: string;
  city?: string;
  amount?: number;
  txid?: string;
  description?: string;
}) {
  const name = (opts.name || "MotoStore SaaS").substring(0, 25);
  const city = (opts.city || "CAMPINA GRANDE").substring(0, 15);
  const merchant = f("00", "BR.GOV.BCB.PIX") + f("01", opts.key) + (opts.description ? f("02", opts.description.substring(0, 60)) : "");
  const additional = f("05", (opts.txid || "***").substring(0, 25));
  const amountStr = opts.amount ? f("54", opts.amount.toFixed(2)) : "";
  const partial =
    f("00", "01") +
    f("26", merchant) +
    f("52", "0000") +
    f("53", "986") +
    amountStr +
    f("58", "BR") +
    f("59", name) +
    f("60", city) +
    f("62", additional);
  const toHash = partial + "6304";
  return toHash + crc16(toHash);
}

export const PIX_KEY = "5e5c677c-9e21-4240-91d4-026263bdbac6";
export const PLAN_PRICE = 65.9;
