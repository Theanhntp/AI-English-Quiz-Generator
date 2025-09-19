// gen-scrypt.ts
import { randomBytes, scrypt } from "node:crypto";

async function gen(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key: Buffer = await new Promise((res, rej) =>
    scrypt(password, salt, 64, (e, k) => (e ? rej(e) : res(k as Buffer)))
  );
  console.log(`${salt}:${key.toString("hex")}`);
}

gen(process.argv[2] ?? "teacher1");
