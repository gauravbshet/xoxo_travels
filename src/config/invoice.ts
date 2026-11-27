/* GST tax invoice details. Fill these in with your registered business details
   and confirm the treatment with your CA before going live. */

export const invoice = {
  /** Registered legal name, as on your GST certificate. */
  sellerName: "XOXO Travels",
  /** Your 15-character GSTIN. Leave empty until registered; the invoice then says "GSTIN: applied for". */
  gstin: "",
  sellerAddress: "Mangaluru, Karnataka, India",
  sellerState: "Karnataka",
  sellerStateCode: "29",
  /** SAC for tour operator services. */
  sac: "998552",
  /** Invoice numbers look like XO/26-27/00042: prefix / financial year / running number. */
  prefix: "XO",
  /**
   * Split of the GST on the invoice. "intra" shows CGST + SGST (half each);
   * "inter" shows IGST. Default intra-state; confirm per your CA.
   */
  supply: "intra" as "intra" | "inter",
} as const;

/** Indian financial year (April to March) for a date, e.g. "26-27". */
export function financialYear(d: Date) {
  const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return `${String(y).slice(2)}-${String(y + 1).slice(2)}`;
}
