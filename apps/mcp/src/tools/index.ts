import type { AnyTool } from "./types.js";
import { clientsTools } from "./clients.js";
import { metaAccountsTools } from "./meta-accounts.js";
import { campaignsTools } from "./campaigns.js";
import { adSetsTools } from "./ad-sets.js";
import { adsTools } from "./ads.js";
import { performanceTools } from "./performance.js";
import { alertsTools } from "./alerts.js";
import { approvalsTools } from "./approvals.js";
import { reportsTools } from "./reports.js";
import { registerTools } from "./register.js";
import { syncTools } from "./sync.js";

export const allTools: AnyTool[] = [
  ...clientsTools,
  ...metaAccountsTools,
  ...syncTools, // ← bulk_register, get_sync_status, log_sync_run, list_clients_needing_sync
  ...registerTools, // ← register_campaign, register_ad_set, register_ad (granular)
  ...campaignsTools,
  ...adSetsTools,
  ...adsTools,
  ...performanceTools,
  ...alertsTools,
  ...approvalsTools,
  ...reportsTools,
];

export const toolMap = new Map<string, AnyTool>(allTools.map((t) => [t.name, t]));
