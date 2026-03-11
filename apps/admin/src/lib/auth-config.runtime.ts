import { env } from "$env/dynamic/private";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db, schema } from "@ttemp/db";

export const authConfig = {
	database: drizzleAdapter(db, { provider: "pg", schema }),
	emailAndPassword: {
		enabled: true,
	},
	baseURL: env.BETTER_AUTH_BASE_URL ?? env.BETTER_AUTH_URL,
};
