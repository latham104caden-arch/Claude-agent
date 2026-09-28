import { stubSubmit } from "../../../lib/api/stub";

// TODO: connect email marketing provider (NOT approved yet).
export async function POST(req: Request) {
  return stubSubmit(req, ["email"], "Newsletter signup");
}
