export const normalizeDestinationUrl = (input: string) => {
	try {
		const url = new URL(input);
		if (!["http:", "https:"].includes(url.protocol)) return null;
		return url.toString();
	} catch (error) {
		return null;
	}
};
