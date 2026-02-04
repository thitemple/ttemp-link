import { redirect } from '@sveltejs/kit';
import { PUBLIC_APP_URL } from '$env/static/public';

export async function load() {
	if (PUBLIC_APP_URL) {
		throw redirect(302, PUBLIC_APP_URL);
	}

	return {};
}
