import { BETTER_AUTH_BASE_URL, BETTER_AUTH_URL } from "$env/static/private";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db, schema } from "@ttemp/db";

export const authConfig = {
	database: drizzleAdapter(db, { provider: "pg", schema }),
	emailAndPassword: {
		enabled: true,
	},
	baseURL: BETTER_AUTH_BASE_URL ?? BETTER_AUTH_URL,
};
