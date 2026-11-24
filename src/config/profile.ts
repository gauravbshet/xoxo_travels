/* Profile and verification rules. Change here, not in components. */

const mb = (v: string | undefined, d: number) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : d; };

export const profile = {
  /** Youngest allowed traveler on a profile. */
  minAge: 18,
  displayName: { min: 2, max: 40 },
  bioMax: 500,
  maxInterests: 8,
  maxLanguages: 6,
  genders: [
    { value: "female", label: "Woman" },
    { value: "male", label: "Man" },
    { value: "other", label: "Non-binary" },
    { value: "prefer_not_to_say", label: "Prefer not to say" },
  ],
  interests: ["Treks", "Beaches", "Road trips", "Food", "Culture", "Nightlife", "Photography", "Wildlife", "Wellness", "Adventure sports", "Backpacking", "Luxury stays"],
  languages: ["English", "Hindi", "Bengali", "Marathi", "Tamil", "Telugu", "Kannada", "Malayalam", "Gujarati", "Punjabi", "Urdu", "Odia"],
  /** Needed before Find a Partner (phase 5). Bio, interests and languages stay optional. */
  requiredForPartner: ["displayName", "photo", "city", "dateOfBirth", "gender"] as const,
} as const;

export const uploads = {
  photo: { maxBytes: mb(process.env.UPLOAD_MAX_MB_PHOTO, 5) * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp"] },
  id: { maxBytes: mb(process.env.UPLOAD_MAX_MB_ID, 5) * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp", "application/pdf"] },
  /** Signed upload links expire after this many seconds. */
  uploadUrlTtl: 300,
  /** Signed links admins use to view an ID expire after this many seconds. */
  viewUrlTtl: 300,
} as const;

export const idDocumentTypes = [
  { value: "aadhaar", label: "Aadhaar" },
  { value: "pan", label: "PAN card" },
  { value: "passport", label: "Passport" },
  { value: "driving-licence", label: "Driving licence" },
  { value: "voter-id", label: "Voter ID" },
] as const;

export type GenderValue = (typeof profile.genders)[number]["value"];
export type IdDocumentType = (typeof idDocumentTypes)[number]["value"];
