import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

// Your own data lives in a JSON file on the server, outside git (see .gitignore: /data/).
// Override the location with DATA_FILE, e.g. DATA_FILE=/Users/me/finance-data/finance.json

export type EntryType = "income" | "expense";

export type Entry = {
  id: string;
  type: EntryType;
  date: string; // YYYY-MM-DD
  category: string; // income source or expense category
  amount: number; // ₪
  note?: string;
  createdAt: string;
};

export type Employee = {
  id: string;
  name: string;
  target: number; // monthly sales target, ₪ (0 = none)
  commissionRate: number; // percent, e.g. 6.25
  createdAt: string;
};

export type Sale = {
  id: string;
  employeeId: string;
  date: string;
  amount: number;
  note?: string;
  createdAt: string;
};

export type Store = { version: 1; entries: Entry[]; employees: Employee[]; sales: Sale[] };

const EMPTY: Store = { version: 1, entries: [], employees: [], sales: [] };

export const DATA_FILE = process.env.DATA_FILE?.trim() || path.join(/*turbopackIgnore: true*/ process.cwd(), "data", "finance.json");

export async function readStore(): Promise<Store> {
  try {
    const raw = JSON.parse(await readFile(/*turbopackIgnore: true*/ DATA_FILE, "utf8")) as Partial<Store>;
    return {
      version: 1,
      entries: Array.isArray(raw.entries) ? raw.entries : [],
      employees: Array.isArray(raw.employees) ? raw.employees : [],
      sales: Array.isArray(raw.sales) ? raw.sales : [],
    };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return structuredClone(EMPTY);
    throw err; // never silently overwrite a file we could not parse
  }
}

// Serialise writes so two quick submissions cannot overwrite each other.
let queue: Promise<unknown> = Promise.resolve();

export function updateStore<T>(fn: (s: Store) => T): Promise<T> {
  const run = queue.then(async () => {
    const store = await readStore();
    const result = fn(store);
    await mkdir(/*turbopackIgnore: true*/ path.dirname(DATA_FILE), { recursive: true, mode: 0o700 });
    const tmp = `${DATA_FILE}.${process.pid}.tmp`;
    await writeFile(/*turbopackIgnore: true*/ tmp, JSON.stringify(store, null, 2), { mode: 0o600 });
    await rename(/*turbopackIgnore: true*/ tmp, DATA_FILE); // atomic replace
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

export const newId = () => randomUUID();
