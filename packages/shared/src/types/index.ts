// Tipos de domínio (separados dos schemas Zod) — pra uso amplo em UI/Server
import type {
  AggregatedMetrics,
  Alert,
  AlertSeverityType,
  Approval,
  Campaign,
  Client,
  PerformanceSnapshot,
} from "../schemas";

// ─── Notification ────────────────────────────────────────────────────
export type NotificationChannel = "in_app" | "email" | "whatsapp" | "discord" | "webhook";

export interface Notification {
  id: string;
  user_id: string;
  client_id: string | null;
  channel: NotificationChannel;
  type: string;
  title: string;
  message: string;
  link_url: string | null;
  read: boolean;
  read_at: string | null;
  delivered_at: string | null;
  delivery_error: string | null;
  data: Record<string, unknown>;
  created_at: string;
}

// ─── Claude Action ───────────────────────────────────────────────────
export type ClaudeActionStatus = "pending" | "in_progress" | "success" | "failed" | "cancelled";

export interface ClaudeAction {
  id: string;
  client_id: string | null;
  action_type: string;
  status: ClaudeActionStatus;
  tool_name: string;
  input_payload: Record<string, unknown>;
  output_payload: Record<string, unknown> | null;
  reasoning: string | null;
  conversation_id: string | null;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  error_message: string | null;
  error_stack: string | null;
  meta_api_calls: unknown[];
  approval_id: string | null;
  created_at: string;
}

// ─── Audit Log ───────────────────────────────────────────────────────
export interface AuditLog {
  id: string;
  actor_type: "user" | "claude" | "system" | "cron";
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  client_id: string | null;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ─── Message ─────────────────────────────────────────────────────────
export interface Message {
  id: string;
  client_id: string;
  sender_id: string;
  sender_role: "super_admin" | "admin" | "client_admin" | "client_viewer";
  content: string;
  attachments: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  read_by: string[];
  reply_to_id: string | null;
  created_at: string;
  // Joined
  sender?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

// ─── Dashboard summary ───────────────────────────────────────────────
export interface ClientDashboardSummary {
  client_id: string;
  client_name: string;
  slug: string;
  status: string;
  active_campaigns: number;
  active_ads: number;
  pending_approvals: number;
  active_alerts: number;
  spend_last_30d: number;
  last_claude_action_at: string | null;
}

// ─── UI helpers ──────────────────────────────────────────────────────
export type Severity = AlertSeverityType;

export interface DashboardOverview {
  active_clients: number;
  total_spend_today: number;
  total_spend_7d: number;
  total_spend_30d: number;
  claude_actions_today: number;
  pending_approvals: number;
  active_alerts: number;
  avg_roas: number;
  top_clients: Array<{
    client: Pick<Client, "id" | "name" | "slug">;
    metrics: AggregatedMetrics;
  }>;
}

export interface ClientDetailView {
  client: Client;
  metrics_7d: AggregatedMetrics;
  metrics_30d: AggregatedMetrics;
  active_campaigns: Campaign[];
  recent_alerts: Alert[];
  pending_approvals: Approval[];
  daily_snapshots: PerformanceSnapshot[];
}

export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const err = <E = Error>(error: E): Result<never, E> => ({ ok: false, error });
