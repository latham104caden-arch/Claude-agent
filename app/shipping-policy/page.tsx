import { LegalPage, legalMetadata } from "../../components/legal/LegalPage";

export const metadata = legalMetadata("shipping-policy");

export default function Page() {
  return <LegalPage slug="shipping-policy" />;
}
