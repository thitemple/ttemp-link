import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db, schema } from "@ttemp/db";

export const authConfig = {
	database: drizzleAdapter(db, { provider: "pg", schema }),
	emailAndPassword: {
		enabled: true,
	},
	baseURL: process.env.BETTER_AUTH_BASE_URL ?? process.env.BETTER_AUTH_URL,
};
