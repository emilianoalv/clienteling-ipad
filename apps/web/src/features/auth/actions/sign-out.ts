"use server";

import { redirect } from "next/navigation";
import { destroySession } from "@/server/auth/session";
import { routes } from "@/config/routes";

export async function signOutAction(): Promise<void> {
  await destroySession();
  redirect(routes.login);
}
