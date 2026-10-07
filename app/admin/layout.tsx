import type { Metadata } from "next";
import Link from "next/link";
import { currentAdmin } from "../../lib/admin";
import { SignOut } from "../../components/account/AccountActions";
import "../../styles/admin.css";

export const metadata: Metadata = { title: "Team dashboard", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await currentAdmin();
  return (
    <div className="adm">
      <header className="adm-bar">
        <div className="adm-bar-in">
          <Link href="/admin" className="adm-brand">Revised Research <span>Team</span></Link>
          {admin ? (
            <nav className="adm-nav" aria-label="Dashboard">
              <Link href="/admin">Overview</Link>
              <Link href="/admin/orders">Orders</Link>
              <Link href="/" target="_blank">Store ↗</Link>
            </nav>
          ) : null}
          {admin ? <div className="adm-who"><span className="muted">{admin}</span><SignOut /></div> : null}
        </div>
      </header>
      <div className="adm-main">{children}</div>
    </div>
  );
}
