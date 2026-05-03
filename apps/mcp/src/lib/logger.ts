import winston from "winston";
import { env } from "../config/env.js";

const { combine, timestamp, printf, errors, json } = winston.format;

const consoleFormat = printf(({ level, message, timestamp: ts, ...rest }) => {
  const meta = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : "";
  return `${ts} [${level.toUpperCase()}] ${message}${meta}`;
});

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: combine(timestamp(), errors({ stack: true }), json()),
  transports: [
    // stderr — Claude Desktop reads stdout as MCP protocol, so logs go to stderr
    new winston.transports.Console({
      stderrLevels: ["debug", "info", "warn", "error"],
      format: combine(timestamp(), consoleFormat),
    }),
    // arquivo (opcional)
    new winston.transports.File({
      filename: env.LOG_PATH,
      maxsize: 5 * 1024 * 1024,
      maxFiles: 3,
      tailable: true,
    }),
  ],
});
