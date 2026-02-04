import { randomBytes } from 'node:crypto';

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const SLUG_REGEX = /^[a-zA-Z0-9_-]+$/;

export function generateSlug(length = 7) {
	const bytes = randomBytes(length);
	let slug = '';

	for (let i = 0; i < length; i += 1) {
		slug += ALPHABET[bytes[i] % ALPHABET.length];
	}

	return slug;
}

export function normalizeSlug(input: string) {
	return input.trim();
}

export function isValidSlug(slug: string) {
	return slug.length > 0 && slug.length <= 64 && SLUG_REGEX.test(slug);
}
