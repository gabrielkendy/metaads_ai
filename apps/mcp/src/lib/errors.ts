export class MCPError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: "low" | "medium" | "high" | "critical" = "medium",
    public retryable = false,
  ) {
    super(message);
    this.name = "MCPError";
  }
}

export class ValidationError extends MCPError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", "low", false);
  }
}

export class MetaAPIError extends MCPError {
  constructor(
    message: string,
    public metaErrorCode?: number,
  ) {
    super(message, "META_API_ERROR", "medium", true);
  }
}

export class ApprovalRequiredError extends MCPError {
  constructor(public approvalId: string) {
    super("Esta ação requer aprovação", "APPROVAL_REQUIRED", "low", false);
  }
}

export class RateLimitError extends MCPError {
  constructor(public retryAfter: number) {
    super(`Rate limit. Retry after ${retryAfter}s`, "RATE_LIMIT", "medium", true);
  }
}

export class NotFoundError extends MCPError {
  constructor(resource: string, id: string) {
    super(`${resource} não encontrado: ${id}`, "NOT_FOUND", "low", false);
  }
}

export function formatToolError(err: unknown) {
  if (err instanceof MCPError) {
    return {
      success: false,
      error: err.message,
      code: err.code,
      severity: err.severity,
    };
  }
  if (err instanceof Error) {
    return {
      success: false,
      error: err.message,
      code: "INTERNAL_ERROR",
    };
  }
  return {
    success: false,
    error: "Erro desconhecido",
    code: "UNKNOWN",
  };
}
