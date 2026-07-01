import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    NEXTAUTH_SECRET: z.string().min(1),
    SUPERADMIN_EMAIL: z.email(),
    SUPERADMIN_PASSWORD: z.string().min(6),
    SUPERADMIN_NAME: z.string().min(1),
    SMTP_HOST: z.string().min(1),
    SMTP_PORT: z.string().transform(Number),
    SMTP_USER: z.string().min(1),
    SMTP_PASS: z.string().min(1),
    SMTP_FROM: z.string().min(1),
  },
  client: {},
  experimental__runtimeEnv: process.env,
})
