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

export const allTools: AnyTool[] = [
  ...clientsTools,
  ...metaAccountsTools,
  ...registerTools, // ← modo ledger: registra ações que MCP oficial Meta executou
  ...campaignsTools,
  ...adSetsTools,
  ...adsTools,
  ...performanceTools,
  ...alertsTools,
  ...approvalsTools,
  ...reportsTools,
];

export const toolMap = new Map<string, AnyTool>(allTools.map((t) => [t.name, t]));
