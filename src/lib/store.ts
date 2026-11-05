import "server-only";
import { randomUUID } from "node:crypto";
import { copyFile, mkdir, open, readdir, readFile, rename, unlink } from "node:fs/promises";
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
  person?: string; // for salaries: the employee's name
  createdAt: string;
};

export type Employee = {
  id: string;
  name: string;
  target: number; // monthly sales target, ₪ (0 = none)
  commissionRate: number; // percent, e.g. 6.25
  archived?: boolean; // left the business: hidden from forms, sales history kept
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

export type Loan = {
  id: string;
  lender: string;
  amount: number; // principal received
  monthlyPayment: number;
  firstPayment: string; // YYYY-MM-DD of the first repayment
  payments: number; // number of monthly repayments
  note?: string;
  createdAt: string;
};

export type Order = {
  id: string;
  client: string;
  date: string; // order date
  amount: number;
  paidDate?: string; // set when the client paid
  note?: string;
  createdAt: string;
};

export type Store = { version: 1; entries: Entry[]; employees: Employee[]; sales: Sale[]; loans: Loan[]; orders: Order[] };

const EMPTY: Store = { version: 1, entries: [], employees: [], sales: [], loans: [], orders: [] };

export const DATA_FILE = process.env.DATA_FILE?.trim() || path.join(/*turbopackIgnore: true*/ process.cwd(), "data", "finance.json");

export async function readStore(): Promise<Store> {
  try {
    const raw = JSON.parse(await readFile(/*turbopackIgnore: true*/ DATA_FILE, "utf8")) as Partial<Store>;
    return {
      version: 1,
      entries: Array.isArray(raw.entries) ? raw.entries : [],
      employees: Array.isArray(raw.employees) ? raw.employees : [],
      sales: Array.isArray(raw.sales) ? raw.sales : [],
      loans: Array.isArray(raw.loans) ? raw.loans : [],
      orders: Array.isArray(raw.orders) ? raw.orders : [],
    };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return structuredClone(EMPTY);
    throw err; // never silently overwrite a file we could not parse
  }
}

// Daily copies of the data file, kept beside it in backups/ (gitignored with /data/).
export const BACKUP_DIR = path.join(path.dirname(DATA_FILE), "backups");
const KEEP_BACKUPS = 30;
const BACKUP_RE = /^finance-\d{4}-\d{2}-\d{2}\.json$/;

/** Before the first change of each day, copies the current file to backups/finance-YYYY-MM-DD.json. */
async function dailyBackup() {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date());
  const target = path.join(BACKUP_DIR, `finance-${day}.json`);
  await mkdir(/*turbopackIgnore: true*/ BACKUP_DIR, { recursive: true, mode: 0o700 });
  try {
    await copyFile(/*turbopackIgnore: true*/ DATA_FILE, target, 1 /* COPYFILE_EXCL: keep the first copy of the day */);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "EEXIST" || code === "ENOENT") return; // already backed up today, or nothing to back up yet
    throw err;
  }
  const old = (await readdir(/*turbopackIgnore: true*/ BACKUP_DIR)).filter((f) => BACKUP_RE.test(f)).sort().reverse().slice(KEEP_BACKUPS);
  await Promise.all(old.map((f) => unlink(/*turbopackIgnore: true*/ path.join(BACKUP_DIR, f)).catch(() => undefined)));
}

/** Writes to a temp file, flushes it to disk, then renames over the real file (atomic replace). */
async function writeDurable(file: string, data: string) {
  const tmp = `${file}.${process.pid}.tmp`;
  const fh = await open(/*turbopackIgnore: true*/ tmp, "w", 0o600);
  try {
    await fh.writeFile(data);
    await fh.sync();
  } finally {
    await fh.close();
  }
  await rename(/*turbopackIgnore: true*/ tmp, file);
}

// Serialise writes so two quick submissions cannot overwrite each other.
let queue: Promise<unknown> = Promise.resolve();

/**
 * Runs fn on a fresh copy of the data and saves it. Pass { beforeDelete: true } for deletions:
 * the file as it was just before is also kept in backups/finance-before-last-delete.json.
 */
export function updateStore<T>(fn: (s: Store) => T, opts: { beforeDelete?: boolean } = {}): Promise<T> {
  const run = queue.then(async () => {
    const store = await readStore();
    const result = fn(store);
    await mkdir(/*turbopackIgnore: true*/ path.dirname(DATA_FILE), { recursive: true, mode: 0o700 });
    await dailyBackup();
    if (opts.beforeDelete) {
      await copyFile(/*turbopackIgnore: true*/ DATA_FILE, path.join(BACKUP_DIR, "finance-before-last-delete.json")).catch((err) => {
        if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
      });
    }
    await writeDurable(DATA_FILE, JSON.stringify(store, null, 2));
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

export const newId = () => randomUUID();
