import "server-only";
import type { User } from "@/types/user";
import { userRepository } from "@/server/repositories/user.repository";

export async function listUsers(): Promise<User[]> {
  return userRepository.list();
}
