import { stubSubmit } from "../../../lib/api/stub";

// TODO: persist partner applications to the database.
export async function POST(req: Request) {
  return stubSubmit(req, ["name", "email", "channel"], "Partner applications");
}
