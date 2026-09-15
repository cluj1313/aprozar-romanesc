import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Server-only check so the admin email/phone never ship in the public JS. */
export const verifyAdminLogin = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string(),
      email: z.string(),
      phone: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const { ADMIN_IDENTITY, isAdminLogin } = await import("@/lib/admin-identity.server");
    if (!isAdminLogin(data)) return { ok: false as const };
    return {
      ok: true as const,
      name: data.name.trim() || ADMIN_IDENTITY.name,
    };
  });
