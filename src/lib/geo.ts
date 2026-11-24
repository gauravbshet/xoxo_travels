/* Distance helpers. Coordinates never leave the server. */

const R = 6371; // km
const rad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance in km. */
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** A lat/lng box that contains every point within `km` (a cheap SQL pre-filter before Haversine). */
export function boundingBox(lat: number, lng: number, km: number) {
  const dLat = km / 111.32;
  const cos = Math.cos(rad(lat));
  const dLng = cos < 1e-6 ? 180 : Math.min(180, km / (111.32 * cos));
  return { minLat: lat - dLat, maxLat: lat + dLat, minLng: lng - dLng, maxLng: lng + dLng };
}

export const roundCoord = (v: number, decimals: number) => Math.round(v * 10 ** decimals) / 10 ** decimals;

/** "~40 km away", rounded so the exact spot can't be worked out. */
export function roughDistance(km: number) {
  if (km < 10) return "under 10 km away";
  if (km < 50) return `~${Math.round(km / 5) * 5} km away`;
  return `~${Math.round(km / 10) * 10} km away`;
}
