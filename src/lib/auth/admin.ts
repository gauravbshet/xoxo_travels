import "server-only";
import { notFound } from "next/navigation";
import { getCurrentUser } from "./current-user";

/* Admin checks. Admins come from ADMIN_EMAILS (role set at sign-in, see user-sync.ts). */

/** For pages and layouts: the admin user, or a 404 so the area isn't advertised. */
export async function adminOr404() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") notFound();
  return user;
}

/** For server actions: throws unless the caller is an admin. Call it first in every admin action. */
export async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") throw new Error("Not authorised.");
  return user;
}
