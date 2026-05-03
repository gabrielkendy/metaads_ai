import type { z } from "zod";

/**
 * Converter mínimo de Zod schema -> JSONSchema.
 * Cobre os casos comuns usados pelas tools do MCP.
 * Se quiser um suporte completo, troque por `zod-to-json-schema`.
 */
export function zodToJsonSchema(schema: z.ZodTypeAny): Record<string, unknown> {
  const def = schema._def;

  switch (def.typeName) {
    case "ZodObject": {
      const shape = (def.shape as () => Record<string, z.ZodTypeAny>)();
      const properties: Record<string, unknown> = {};
      const required: string[] = [];
      for (const [key, val] of Object.entries(shape)) {
        properties[key] = zodToJsonSchema(val);
        if (!val.isOptional()) required.push(key);
      }
      const out: Record<string, unknown> = { type: "object", properties };
      if (required.length) out.required = required;
      return out;
    }
    case "ZodString": {
      const out: Record<string, unknown> = { type: "string" };
      const checks = (def.checks ?? []) as Array<{
        kind: string;
        value?: number | string;
      }>;
      for (const c of checks) {
        if (c.kind === "min") out.minLength = c.value;
        if (c.kind === "max") out.maxLength = c.value;
        if (c.kind === "uuid") out.format = "uuid";
        if (c.kind === "email") out.format = "email";
        if (c.kind === "url") out.format = "uri";
        if (c.kind === "datetime") out.format = "date-time";
      }
      if (def.description) out.description = def.description;
      return out;
    }
    case "ZodNumber": {
      const out: Record<string, unknown> = { type: "number" };
      const checks = (def.checks ?? []) as Array<{ kind: string; value?: number; inclusive?: boolean }>;
      for (const c of checks) {
        if (c.kind === "min") out.minimum = c.value;
        if (c.kind === "max") out.maximum = c.value;
        if (c.kind === "int") out.type = "integer";
      }
      if (def.description) out.description = def.description;
      return out;
    }
    case "ZodBoolean":
      return { type: "boolean", ...(def.description ? { description: def.description } : {}) };
    case "ZodEnum":
      return { type: "string", enum: def.values, ...(def.description ? { description: def.description } : {}) };
    case "ZodNativeEnum":
      return { type: "string", enum: Object.values(def.values) };
    case "ZodArray":
      return { type: "array", items: zodToJsonSchema(def.type) };
    case "ZodOptional":
      return zodToJsonSchema(def.innerType);
    case "ZodNullable":
      return { ...zodToJsonSchema(def.innerType), nullable: true };
    case "ZodDefault":
      return { ...zodToJsonSchema(def.innerType), default: def.defaultValue() };
    case "ZodEffects":
      return zodToJsonSchema(def.schema);
    case "ZodUnion":
      return { oneOf: (def.options as z.ZodTypeAny[]).map(zodToJsonSchema) };
    case "ZodLiteral":
      return { const: def.value };
    case "ZodRecord":
      return { type: "object", additionalProperties: zodToJsonSchema(def.valueType) };
    case "ZodAny":
    case "ZodUnknown":
      return {};
    default:
      return {};
  }
}
