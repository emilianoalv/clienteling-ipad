import type {
  AgeRange,
  Gender,
  Routine,
  RoutineTiming,
  SkinType,
  Subtone,
} from "@/types/client";

export type FieldErrors = Record<string, string[]>;

/**
 * Wizard-local mutable state. Maps 1:1 to the schema with some UX-only
 * fields (`channels` as Record, `allergiesText` as string).
 */
export interface Draft {
  firstName: string;
  lastName: string;
  dialCode: string;
  phone: string;
  email: string;
  birthday: string;
  city: string;
  gender: Gender;
  ageRange: AgeRange | "";
  brands: string[];
  skin: { type: SkinType; concerns: string[]; tone: string; subtone?: Subtone };
  routine: Routine;
  routineTiming: RoutineTiming[];
  interests: string[];
  allergiesText: string;
  acceptPrivacy: boolean;
  channels: Record<"WhatsApp" | "Email" | "SMS", boolean>;
}
