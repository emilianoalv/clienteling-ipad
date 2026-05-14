/**
 * `purchases` feature — public API (F3.4).
 *
 * Read-only history view. The create flow lives in
 * `features/clients/actions/register-sale.ts` (BA registers sale from a client profile).
 */
export { PurchasesList, type PurchasesListProps } from "./components/purchases-list";
export { listPurchases, type ListPurchasesArgs } from "./server/list-purchases";
