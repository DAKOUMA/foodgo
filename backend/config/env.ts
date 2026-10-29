import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL manquant"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET doit faire 16 caractères minimum"),
  PORT: z.coerce.number().default(3000),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("❌ Variables d'environnement invalides :");
  for (const issue of result.error.issues) {
    console.error(`  - ${issue.path.join(".")} : ${issue.message}`);
  }
  process.exit(1); // le serveur ne démarre pas
}

export const env = result.data;