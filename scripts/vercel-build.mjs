// Build command on Vercel (npm runs "vercel-build" automatically when it exists).
// Database migrations run ONLY for production deployments, so preview builds
// can never change the production database. Each step stops the build on failure.
import { execSync } from "node:child_process";

const run = (cmd) => { console.log(`\n> ${cmd}`); execSync(cmd, { stdio: "inherit" }); };

run("prisma generate");
if (process.env.VERCEL_ENV === "production") run("prisma migrate deploy");
else console.log(`\nSkipping migrations (VERCEL_ENV=${process.env.VERCEL_ENV ?? "unset"}).`);
run("next build");
