import winston from "winston";
import { env } from "../config/env.js";

const { combine, timestamp, printf, errors, json } = winston.format;

const consoleFormat = printf(({ level, message, timestamp: ts, ...rest }) => {
  const meta = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : "";
  return `${ts} [${level.toUpperCase()}] ${message}${meta}`;
});

// Em ambientes serverless (Vercel) o filesystem é read-only fora de /tmp,
// e Claude Desktop lê stdout como protocolo MCP — sempre logamos via stderr.
const isServerless =
  process.env.VERCEL === "1" || process.env.NEXT_RUNTIME !== undefined;

const transports: winston.transport[] = [
  new winston.transports.Console({
    stderrLevels: ["debug", "info", "warn", "error"],
    format: combine(timestamp(), consoleFormat),
  }),
];

if (!isServerless && env.LOG_PATH) {
  try {
    transports.push(
      new winston.transports.File({
        filename: env.LOG_PATH,
        maxsize: 5 * 1024 * 1024,
        maxFiles: 3,
        tailable: true,
      }),
    );
  } catch {
    // ignora se diretório não existir — log via stderr basta
  }
}

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: combine(timestamp(), errors({ stack: true }), json()),
  transports,
});
