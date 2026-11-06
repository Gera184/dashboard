"use client";

import { useSearchParams } from "next/navigation";
import { resolveMonth } from "./data";
import { useStore } from "./local-store";

/** The data saved in this browser plus the month chosen in the header (?month=YYYY-MM). store is null until loaded. */
export function useMonthData() {
  const store = useStore();
  const month = resolveMonth(useSearchParams().get("month") ?? undefined);
  return { store, month };
}
