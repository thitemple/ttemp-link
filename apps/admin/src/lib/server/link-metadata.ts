const TITLE_REGEX = /<title[^>]*>([^<]*)<\/title>/i;
const OG_TITLE_REGEX = /<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i;
const OG_TITLE_NAME_REGEX = /<meta[^>]+name=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i;

export const normalizeTitle = (value: string | null) => {
	if (!value) return null;
	const cleaned = value.replace(/\s+/g, " ").trim();
	if (!cleaned) return null;
	return cleaned.slice(0, 200);
};

export const extractTitleFromHtml = (html: string) => {
	const ogMatch = html.match(OG_TITLE_REGEX) ?? html.match(OG_TITLE_NAME_REGEX);
	if (ogMatch?.[1]) return normalizeTitle(ogMatch[1]);
	const titleMatch = html.match(TITLE_REGEX);
	if (titleMatch?.[1]) return normalizeTitle(titleMatch[1]);
	return null;
};

export const fetchPageTitle = async (url: string, timeoutMs = 4000) => {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const response = await fetch(url, {
			signal: controller.signal,
			redirect: "follow",
			headers: {
				"user-agent": "ttemp-link/1.0",
			},
		});
		if (!response.ok) return null;
		const contentType = response.headers.get("content-type") ?? "";
		if (!contentType.includes("text/html")) return null;
		const html = await response.text();
		return extractTitleFromHtml(html);
	} catch (error) {
		return null;
	} finally {
		clearTimeout(timeout);
	}
};
