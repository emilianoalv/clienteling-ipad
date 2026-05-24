/**
 * Shared types for the dashboard export pipeline (RF-43 / RF-46 / RF-49).
 * Columns are typed by row shape so callers get autocompletion on `key`.
 */

export type ExportFormat = "xlsx" | "csv";

export type ExportColumnFormat =
  | "currency"
  | "currency-mxn"
  | "percent"
  | "date"
  | "datetime"
  | "number"
  | "text";

export interface ExportColumn<T> {
  /** Key in the row object. Strings allowed for synthetic columns. */
  key: keyof T & string;
  label: string;
  format?: ExportColumnFormat;
  /** Width in Excel character units. Default 18. */
  width?: number;
}

export interface ExportMetadata {
  title?: string;
  filters?: Record<string, string>;
  generatedAt?: Date;
  generatedBy?: string;
}

export interface ExportSheet<T> {
  sheetName: string;
  columns: ReadonlyArray<ExportColumn<T>>;
  rows: ReadonlyArray<T>;
}

export interface ExportRequest<T> {
  format: ExportFormat;
  /** Single-sheet shortcut. Pass `sheets` for multi-sheet. */
  sheetName?: string;
  columns?: ReadonlyArray<ExportColumn<T>>;
  rows?: ReadonlyArray<T>;
  /** Multi-sheet workbook. Mutually exclusive with the single-sheet props. */
  sheets?: ReadonlyArray<ExportSheet<unknown>>;
  metadata?: ExportMetadata;
}
