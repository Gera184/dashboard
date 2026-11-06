"use client";

import { useSyncExternalStore } from "react";
import { EMPTY_STORE, type Store } from "./types";

// All financial data lives in this browser's localStorage. Nothing is sent to the server.
// Each browser/device has its own copy; use export/import (backup file) to move or keep it.
const KEY = "finance-dashboard:v1";
const BACKUP_KEY = "finance-dashboard:v1:before-last-delete";

export function normalize(raw: unknown): Store {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<Store>;
  return {
    version: 1,
    entries: Array.isArray(r.entries) ? r.entries : [],
    employees: Array.isArray(r.employees) ? r.employees : [],
    sales: Array.isArray(r.sales) ? r.sales : [],
    loans: Array.isArray(r.loans) ? r.loans : [],
    orders: Array.isArray(r.orders) ? r.orders : [],
  };
}

let cache: { raw: string | null; store: Store } | null = null;
const listeners = new Set<() => void>();

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function getStore(): Store {
  const raw = readRaw();
  if (cache && cache.raw === raw) return cache.store;
  let store: Store;
  try {
    store = raw ? normalize(JSON.parse(raw)) : structuredClone(EMPTY_STORE);
  } catch {
    store = structuredClone(EMPTY_STORE); // damaged value: show empty, never overwrite until the user saves
  }
  cache = { raw, store };
  return store;
}

function write(store: Store, { backup = false } = {}) {
  const raw = JSON.stringify(store);
  try {
    if (backup) {
      const prev = readRaw();
      if (prev) window.localStorage.setItem(BACKUP_KEY, prev);
    }
    window.localStorage.setItem(KEY, raw);
  } catch {
    throw new Error("לא ניתן לשמור בדפדפן (ייתכן שהאחסון מלא או חסום במצב גלישה פרטית).");
  }
  cache = { raw, store };
  listeners.forEach((l) => l());
}

/** Runs fn on a copy of the data and saves it in this browser. */
export function updateStore<T>(fn: (s: Store) => T, opts: { beforeDelete?: boolean } = {}): T {
  const store = structuredClone(getStore());
  const result = fn(store);
  write(store, { backup: opts.beforeDelete });
  return result;
}

/** Replaces all data (import). The previous data is kept as the "before last delete" copy. */
export function replaceStore(store: Store) {
  write(normalize(store), { backup: true });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) cb(); }; // another tab changed it
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(cb); window.removeEventListener("storage", onStorage); };
}

/** The data, or null during server rendering / before the browser has loaded it. */
export function useStore(): Store | null {
  return useSyncExternalStore(subscribe, getStore, () => null);
}

export const newId = () => crypto.randomUUID();
