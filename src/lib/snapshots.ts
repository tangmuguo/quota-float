import type { ProviderSnapshot, QuotaWindow, UsageWindow } from "../types";

/** Return only the quota window selected by the tray preference. */
export function selectedUsageWindow(snapshot: ProviderSnapshot, quotaWindow: QuotaWindow): UsageWindow | null {
  return quotaWindow === "fiveHour" ? snapshot.fiveHourWindow ?? null : snapshot.weeklyWindow ?? null;
}

export function hasUsageWindow(snapshot: ProviderSnapshot): boolean {
  return Boolean(snapshot.weeklyWindow || snapshot.fiveHourWindow);
}

export function mergeSnapshots(current: ProviderSnapshot[], incoming: ProviderSnapshot[]): ProviderSnapshot[] {
  return incoming.map((next) => {
    if (next.status === "ok") return next;
    if (next.status === "signed_out") return next;
    const previous = current.find((item) => item.provider === next.provider && hasUsageWindow(item));
    return previous
      ? { ...previous, status: "stale", message: next.message, updatedAt: previous.updatedAt }
      : next;
  });
}
