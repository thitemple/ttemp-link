import { redirect } from '@sveltejs/kit';
import { PUBLIC_ADMIN_APP_URL } from '$env/static/public';

export async function load() {
	if (PUBLIC_ADMIN_APP_URL) {
		throw redirect(302, PUBLIC_ADMIN_APP_URL);
	}

	return {};
}
