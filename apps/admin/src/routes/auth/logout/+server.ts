import { redirect } from "@sveltejs/kit";
import { auth } from "$lib/auth";

async function signOut(request: Request): Promise<never> {
	try {
		await auth.api.signOut({ headers: request.headers });
	} catch (error) {
		// Ignore sign-out errors; we still redirect.
	}

	throw redirect(302, "/auth/login");
}

export async function POST({ request }) {
	return signOut(request);
}

export async function GET({ request }) {
	return signOut(request);
}
