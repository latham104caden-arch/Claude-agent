import { currentEmail } from "./auth";

/**
 * Team access for /admin. Team members sign in with the normal emailed-code
 * login; only emails listed in ADMIN_EMAILS (comma-separated) get in.
 */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

export const isAdmin = (email: string | null | undefined) => !!email && adminEmails().includes(email.toLowerCase());

/** Signed-in team email for this request, or null (not signed in, or not on the team list). */
export async function currentAdmin(): Promise<string | null> {
  const email = await currentEmail();
  return isAdmin(email) ? email : null;
}

/** Business time zone for day boundaries on the dashboard. */
export const ADMIN_TZ = process.env.ADMIN_TZ || "America/Chicago";
