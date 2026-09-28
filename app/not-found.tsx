import Link from "next/link";
import { Icon } from "../components/Icon";

export default function NotFound() {
  return (
    <section className="container nf">
      <p className="h1">404</p>
      <h1 className="h2">This page isn&apos;t in the catalog.</h1>
      <p className="lead" style={{ margin: "14px auto 0" }}>The link may be old, or the page may have moved.</p>
      <Link href="/shop" className="btn btn--primary">Browse Compounds <Icon name="arrow" /></Link>
    </section>
  );
}
