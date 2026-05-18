/**
 * Thrown when a query is invoked by a role that has no business asking for it
 * (e.g. a BA calling `getStoreRanking`). Preferred over returning `[]` because
 * it surfaces the programming mistake instead of hiding it as "empty data".
 */
export class RoleNotPermittedError extends Error {
  readonly roleAttempted: string;
  readonly queryName: string;

  constructor(roleAttempted: string, queryName: string) {
    super(`Role "${roleAttempted}" cannot call query "${queryName}"`);
    this.name = "RoleNotPermittedError";
    this.roleAttempted = roleAttempted;
    this.queryName = queryName;
  }
}
