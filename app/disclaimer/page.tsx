import { LegalPage, legalMetadata } from "../../components/legal/LegalPage";

export const metadata = legalMetadata("disclaimer");

export default function Page() {
  return <LegalPage slug="disclaimer" />;
}
