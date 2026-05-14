import "server-only";
import type { BrandId } from "@/types/brand";
import type { Template } from "@/types/template";
import { templateRepository } from "@/server/repositories/template.repository";

export interface ListTemplatesArgs {
  brands?: readonly BrandId[];
  channel?: Template["channel"];
}

export async function listTemplates(args: ListTemplatesArgs = {}): Promise<Template[]> {
  return templateRepository.list(args);
}
