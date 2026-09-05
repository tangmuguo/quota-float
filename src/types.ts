export type ProviderId = "codex" | "claude";
export type SnapshotStatus = "ok" | "stale" | "loading" | "unavailable" | "signed_out";
export type Language = "zh-CN" | "en";
export type QuotaWindow = "weekly" | "fiveHour";

export const DEFAULT_QUOTA_WINDOW: QuotaWindow = "weekly";

export function normalizeQuotaWindow(value: unknown): QuotaWindow {
  return value === "fiveHour" ? "fiveHour" : DEFAULT_QUOTA_WINDOW;
}

export interface UsageWindow {
  remainingPercent: number;
  resetsAt: string | null;
  windowSeconds: number;
}

export interface ProviderSnapshot {
  provider: ProviderId;
  displayName: string;
  plan: string | null;
  weeklyWindow: UsageWindow | null;
  fiveHourWindow: UsageWindow | null;
  resetCredits: number | null;
  resetCreditExpiresAt?: string[];
  updatedAt: string;
  status: SnapshotStatus;
  message: string | null;
}

export interface WidgetPreferences {
  panelVisible: boolean;
  expanded: boolean;
  alwaysOnTop: boolean;
  pinnedProvider: ProviderId | null;
  autoRotateSeconds: number;
  language: Language;
  quotaWindow: QuotaWindow;
}
