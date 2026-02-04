import { ADMIN_ALLOWLIST } from '$env/static/private';
import { fail, redirect } from '@sveltejs/kit';
import { auth } from '$lib/auth';

function getAllowlist() {
	return (ADMIN_ALLOWLIST ?? process.env.ADMIN_ALLOWLIST ?? '')
		.split(',')
		.map((entry) => entry.trim().toLowerCase())
		.filter(Boolean);
}

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const email = String(data.get('email') ?? '').trim().toLowerCase();
		const password = String(data.get('password') ?? '');
		const confirmPassword = String(data.get('confirmPassword') ?? '');
		const allowlist = getAllowlist();

		if (!email || !password || !confirmPassword) {
			return fail(400, {
				message: 'Email and password are required.',
				values: { email }
			});
		}

		if (allowlist.length === 0) {
			return fail(403, {
				message: 'Signup is disabled until ADMIN_ALLOWLIST is configured.',
				values: { email }
			});
		}

		if (!allowlist.includes(email)) {
			return fail(403, {
				message: 'This email is not on the admin allowlist.',
				values: { email }
			});
		}

		if (password.length < 8) {
			return fail(400, {
				message: 'Password must be at least 8 characters.',
				values: { email }
			});
		}

		if (password !== confirmPassword) {
			return fail(400, {
				message: 'Passwords do not match.',
				values: { email }
			});
		}

		try {
			await auth.api.signUpEmail({
				body: {
					email,
					password,
					name: email.split('@')[0]
				}
			});
		} catch (error) {
			console.error('Sign up failed:', error);
			return fail(400, {
				message: error instanceof Error ? error.message : 'Unable to create account. Try a different email.',
				values: { email }
			});
		}

		throw redirect(302, '/dashboard');
	}
};
