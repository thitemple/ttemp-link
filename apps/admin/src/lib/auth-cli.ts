import { betterAuth } from "better-auth";
import { authConfig } from "./auth-config.cli";

export const auth = betterAuth(authConfig);
