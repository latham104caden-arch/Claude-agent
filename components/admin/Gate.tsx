import { authConfigured, currentEmail } from "../../lib/auth";
import { adminEmails } from "../../lib/admin";
import { AdminSignIn } from "./AdminSignIn";
import { SignOut } from "../account/AccountActions";

/** Shown instead of a dashboard page when the visitor isn't a signed-in team member. */
export async function Gate() {
  if (!authConfigured()) return <div className="card adm-signin"><p>Sign-in isn&apos;t configured (AUTH_SECRET / RESEND_API_KEY).</p></div>;
  if (adminEmails().length === 0) return <div className="card adm-signin"><p>No team emails are set yet. Add them to <code>ADMIN_EMAILS</code> in Vercel (comma-separated), then redeploy.</p></div>;
  const email = await currentEmail();
  if (!email) return <AdminSignIn />;
  return (
    <div className="card adm-signin">
      <p><b>{email}</b> isn&apos;t on the team list. Ask the owner to add it, or sign in with your team email.</p>
      <div style={{ marginTop: 16 }}><SignOut /></div>
    </div>
  );
}
