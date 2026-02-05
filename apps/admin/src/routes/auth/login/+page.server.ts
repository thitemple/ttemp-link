import { fail, redirect } from "@sveltejs/kit";
import { auth } from "$lib/auth";

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const email = String(data.get("email") ?? "")
			.trim()
			.toLowerCase();
		const password = String(data.get("password") ?? "");

		if (!email || !password) {
			return fail(400, {
				message: "Email and password are required.",
				values: { email },
			});
		}

		try {
			await auth.api.signInEmail({ body: { email, password } });
		} catch (error) {
			return fail(400, {
				message: "Invalid email or password.",
				values: { email },
			});
		}

		throw redirect(302, "/dashboard");
	},
};
