import { stubSubmit } from "../../../lib/api/stub";

// TODO: route to support inbox via transactional email provider.
export async function POST(req: Request) {
  return stubSubmit(req, ["name", "email", "message"], "The contact form");
}
