import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import { NotFoundError } from "../lib/errors.js";
import type { AnyTool } from "./types.js";

export const listPendingApprovalsTool: AnyTool = {
  name: "list_pending_approvals",
  description: "Lista aprovações pendentes (filtráveis por cliente).",
  inputSchema: z.object({
    client_id: z.string().uuid().optional(),
    limit: z.number().int().positive().max(100).default(20),
  }),
  handler: async ({ client_id, limit }) => {
    let q = supabase
      .from("approvals")
      .select("*, client:clients(name, slug)")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (client_id) q = q.eq("client_id", client_id);
    const { data, error } = await q;
    if (error) throw error;
    return { approvals: data ?? [] };
  },
};

export const getApprovalTool: AnyTool = {
  name: "get_approval",
  description: "Detalhes de uma aprovação específica.",
  inputSchema: z.object({ approval_id: z.string().uuid() }),
  handler: async ({ approval_id }) => {
    const { data, error } = await supabase
      .from("approvals")
      .select("*, client:clients(name, slug)")
      .eq("id", approval_id)
      .single();
    if (error || !data) throw new NotFoundError("approval", approval_id);
    return data;
  },
};

export const approvalsTools = [listPendingApprovalsTool, getApprovalTool];
