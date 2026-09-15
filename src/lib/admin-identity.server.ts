import { emailsMatch, phonesMatch } from "@/lib/admin-identity";

/** Server-only. Do not import from client components. */
export const ADMIN_IDENTITY = {
  name: "Cioban Iosif Gabriel",
  email: "cluj1313@gmail.com",
  phone: "0770148119",
} as const;

export function isAdminLogin(input: { email: string; phone: string }) {
  return emailsMatch(input.email, ADMIN_IDENTITY.email) && phonesMatch(input.phone, ADMIN_IDENTITY.phone);
}
