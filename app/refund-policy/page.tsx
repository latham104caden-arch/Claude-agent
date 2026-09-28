import { LegalPage, legalMetadata } from "../../components/legal/LegalPage";

export const metadata = legalMetadata("refund-policy");

export default function Page() {
  return <LegalPage slug="refund-policy" />;
}
