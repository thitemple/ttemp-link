import { betterAuth } from "better-auth";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { getRequestEvent } from "$app/server";
import { authConfig } from "$lib/auth-config.runtime";

export const auth = betterAuth({
	...authConfig,
	plugins: [sveltekitCookies(getRequestEvent)],
});
