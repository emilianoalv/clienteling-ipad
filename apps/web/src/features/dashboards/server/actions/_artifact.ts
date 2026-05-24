import "server-only";
import { buildExportFilename, buildWorkbookBytes } from "@/lib/export";
import type { ExportFormat, ExportRequest } from "@/lib/export";
import type { FilenameContext } from "@/lib/export";

/**
 * Server-action-compatible payload returned by every export. Server Actions
 * cannot serialize `Blob` directly, so the bytes are base64-encoded and the
 * client decodes them inside `<ExportButton>`.
 */
export interface ExportArtifact {
  base64: string;
  mimeType: string;
  filename: string;
}

export async function packArtifact<T>(
  req: ExportRequest<T>,
  base: string,
  context: FilenameContext,
): Promise<ExportArtifact> {
  const { bytes, mimeType } = buildWorkbookBytes(req);
  return {
    base64: bytesToBase64(bytes),
    mimeType,
    filename: buildExportFilename(base, context, req.format),
  };
}

function bytesToBase64(bytes: Uint8Array): string {
  // Buffer is available on the Node runtime that Server Actions use.
  return Buffer.from(bytes).toString("base64");
}

export function formatExportFormatArg(format: unknown): ExportFormat {
  if (format === "csv") return "csv";
  return "xlsx";
}
