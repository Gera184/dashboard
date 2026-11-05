// Generates an scrypt hash for ADMIN_PASSWORD_HASH.
// Usage: npm run hash-password            (prompts, input hidden)
//        npm run hash-password -- "pass"  (non-interactive; avoid on shared machines)
import { randomBytes, scryptSync } from "node:crypto";
import readline from "node:readline";

const N = 16384, r = 8, p = 1, KEYLEN = 64;

function hash(password) {
  if (password.length < 12) {
    console.error("הסיסמה חייבת להכיל לפחות 12 תווים / Password must be at least 12 characters.");
    process.exit(1);
  }
  const salt = randomBytes(16);
  const key = scryptSync(password.normalize("NFKC"), salt, KEYLEN, { N, r, p });
  return `scrypt:${N}:${r}:${p}:${salt.toString("base64url")}:${key.toString("base64url")}`;
}

const arg = process.argv[2];
if (arg) {
  console.log(hash(arg));
} else {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  rl._writeToOutput = (s) => { if (!rl.muted) rl.output.write(s); };
  rl.question("Admin password: ", (pw) => {
    rl.close();
    process.stdout.write("\n");
    console.log(`ADMIN_PASSWORD_HASH=${hash(pw)}`);
  });
  rl.muted = true;
}
