import { redirect } from '@sveltejs/kit';
import { PUBLIC_ADMIN_APP_URL } from '$env/static/public';

const normalizeTarget = (value: string | null | undefined) => {
	const trimmed = value?.trim();
	return trimmed ? trimmed : null;
};

export async function load({ url }) {
	const target = normalizeTarget(PUBLIC_ADMIN_APP_URL);
	if (target) {
		try {
			const targetUrl = new URL(target, url.origin);
			const isSameUrl =
				targetUrl.origin === url.origin &&
				targetUrl.pathname === url.pathname &&
				targetUrl.search === url.search &&
				targetUrl.hash === url.hash;
			if (!isSameUrl) {
				throw redirect(302, targetUrl.toString());
			}
		} catch {
			// Ignore invalid URLs and fall back to the static page.
		}
	}

	return {};
}
