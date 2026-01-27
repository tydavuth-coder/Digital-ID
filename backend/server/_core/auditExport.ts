import type { Express, Request, Response } from "express";
import { z } from "zod";
import { format } from "date-fns";
import * as db from "../db";
import { sdk } from "./sdk";

const querySchema = z.object({
  format: z.enum(["csv", "tsv", "txt", "json"]).default("csv"),
  from: z.string().optional(), // yyyy-MM-dd
  to: z.string().optional(),   // yyyy-MM-dd
  actionType: z.string().optional(),
  search: z.string().optional(),
  ids: z.string().optional(),  // comma-separated ids
});

function parseDate(s?: string) {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function escapeCsv(value: unknown) {
  const str = String(value ?? "");
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function registerAuditExportRoutes(app: Express) {
  app.get("/api/audit/export", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);

      // Allow admin-like roles
      if (!["admin", "super_admin", "system_admin"].includes(user.role)) {
        res.status(403).json({ error: "FORBIDDEN" });
        return;
      }

      const q = querySchema.parse(req.query);

      const all = await db.getAllActivityLogs();

      const from = parseDate(q.from);
      const to = parseDate(q.to);

      const idSet =
        q.ids?.trim()
          ? new Set(q.ids.split(",").map(x => Number(x)).filter(n => Number.isFinite(n)))
          : null;

      const actionType = q.actionType && q.actionType !== "all" ? q.actionType : null;
      const search = q.search?.trim().toLowerCase() || null;

      const filtered = all.filter((log: any) => {
        if (idSet && !idSet.has(log.id)) return false;
        const createdAt = new Date(log.createdAt);
        if (from && createdAt < from) return false;
        if (to) {
          // include whole day
          const end = new Date(to);
          end.setHours(23, 59, 59, 999);
          if (createdAt > end) return false;
        }
        if (actionType && log.actionType !== actionType) return false;
        if (search) {
          const hay = `${log.action ?? ""} ${log.description ?? ""} ${log.username ?? ""} ${log.ipAddress ?? ""}`.toLowerCase();
          if (!hay.includes(search)) return false;
        }
        return true;
      });

      const ts = format(new Date(), "yyyy-MM-dd-HHmmss");

      if (q.format === "json") {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="audit-trail-${ts}.json"`);
        res.send(JSON.stringify({ exportedAt: new Date().toISOString(), count: filtered.length, data: filtered }, null, 2));
        return;
      }

      if (q.format === "txt") {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="audit-trail-${ts}.txt"`);
        let out = `AUDIT TRAIL EXPORT\nExportedAt: ${new Date().toISOString()}\nRecords: ${filtered.length}\n\n`;
        for (const [i, log] of filtered.entries()) {
          out += `[${i + 1}] ${format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss")}\n`;
          out += `  ActionType: ${log.actionType}\n`;
          out += `  Action: ${log.action}\n`;
          out += `  User: ${log.username ?? ""} (ID: ${log.userId ?? ""})\n`;
          out += `  IP: ${log.ipAddress ?? ""}\n`;
          out += `  Description: ${log.description ?? ""}\n`;
          out += `  UserAgent: ${log.userAgent ?? ""}\n`;
          out += `  Metadata: ${log.metadata ?? ""}\n`;
          out += `\n`;
        }
        res.send(out);
        return;
      }

      const delimiter = q.format === "tsv" ? "\t" : ",";
      const mime =
        q.format === "tsv"
          ? "text/tab-separated-values; charset=utf-8"
          : "text/csv; charset=utf-8";
      const ext = q.format === "tsv" ? "tsv" : "csv";

      res.setHeader("Content-Type", mime);
      res.setHeader("Content-Disposition", `attachment; filename="audit-trail-${ts}.${ext}"`);

      const headers = ["ID","Timestamp","User ID","Username","Action Type","Action","Description","IP Address","User Agent","Metadata"];
      const rows = filtered.map((log: any) => {
        const cells = [
          log.id,
          format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss"),
          log.userId ?? "",
          log.username ?? "",
          log.actionType ?? "",
          log.action ?? "",
          log.description ?? "",
          log.ipAddress ?? "",
          log.userAgent ?? "",
          log.metadata ?? "",
        ];
        if (delimiter === ",") return cells.map(escapeCsv).join(",");
        // tsv
        return cells.map(v => String(v ?? "").replace(/\t/g, " ")).join("\t");
      });

      res.send([headers.join(delimiter), ...rows].join("\n"));
    } catch (e: any) {
      console.error("[AuditExport] failed:", e);
      res.status(400).json({ error: e?.message || "Bad request" });
    }
  });
}
