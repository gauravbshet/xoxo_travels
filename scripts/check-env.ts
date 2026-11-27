/* Run before deploying: `npm run check:env` (checks .env + .env.local)
   or against the values you'll put in Vercel. Prints key names only, never values. */
import { config } from "dotenv";
import { checkProductionEnv, formatProblems } from "../src/lib/env-check";

config({ path: [".env.local", ".env"], quiet: true });
const problems = checkProductionEnv();
if (!problems.length) {
  console.log("✓ Production configuration looks complete.");
} else {
  console.log(formatProblems(problems));
  if (problems.some((p) => p.level === "error")) process.exitCode = 1;
}
