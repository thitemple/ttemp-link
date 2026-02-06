import * as UAParser from 'ua-parser-js';

const deviceTypeMap: Record<string, string> = {
	mobile: 'mobile',
	tablet: 'tablet',
	console: 'console',
	smarttv: 'smarttv',
	wearable: 'wearable',
	embedded: 'embedded'
};

const nullIfEmpty = (value: string | null | undefined) => {
	if (!value) return null;
	const trimmed = value.trim();
	return trimmed === '' ? null : trimmed;
};

export const normalizeReferrer = (referer: string | null) => {
	const value = nullIfEmpty(referer);
	if (!value) return null;
	try {
		return new URL(value).hostname || null;
	} catch (error) {
		return null;
	}
};

export const parseUserAgent = (ua: string | null) => {
	const value = nullIfEmpty(ua);
	if (!value) {
		return {
			deviceType: 'unknown',
			browserName: 'Unknown',
			browserVersion: null,
			osName: null,
			osVersion: null
		};
	}

	const parser = new UAParser.UAParser(value);
	const result = parser.getResult();
	const deviceType = result.device.type
		? (deviceTypeMap[result.device.type] ?? 'unknown')
		: 'desktop';
	return {
		deviceType,
		browserName: result.browser.name ?? 'Unknown',
		browserVersion: result.browser.version ?? null,
		osName: result.os.name ?? null,
		osVersion: result.os.version ?? null
	};
};

const readHeader = (headers: Headers, names: string[]) => {
	for (const name of names) {
		const value = headers.get(name);
		if (value) return value;
	}
	return null;
};

const parseEdgescape = (value: string | null) => {
	if (!value) return null;
	const entries = value.split(',');
	const map = new Map<string, string>();
	for (const entry of entries) {
		const [rawKey, ...rest] = entry.split('=');
		if (!rawKey || rest.length === 0) continue;
		const key = rawKey.trim().toLowerCase();
		const rawValue = rest.join('=').trim();
		if (!rawValue || rawValue.toLowerCase() === 'reserved') continue;
		map.set(key, rawValue);
	}
	if (map.size === 0) return null;
	return {
		countryCode: map.get('country_code') ?? null,
		region: map.get('region_code') ?? map.get('region') ?? null,
		city: map.get('city') ?? null
	};
};

const parseJsonObject = (value: string | null) => {
	const input = nullIfEmpty(value);
	if (!input) return null;
	try {
		const parsed = JSON.parse(input);
		return parsed && typeof parsed === 'object' ? parsed : null;
	} catch (error) {
		return null;
	}
};

const parseNetlifyGeo = (value: string | null) => {
	const parsed = parseJsonObject(value);
	if (!parsed) return null;
	const getString = (key: string) => {
		const raw = (parsed as Record<string, unknown>)[key];
		return typeof raw === 'string' ? raw : null;
	};
	return {
		countryCode: getString('country') ?? getString('country_code'),
		region: getString('subdivision') ?? getString('region') ?? getString('region_code') ?? null,
		city: getString('city')
	};
};

export const resolveCountryName = (countryCode: string | null) => {
	const code = nullIfEmpty(countryCode);
	if (!code || code.toUpperCase() === 'XX') return null;
	try {
		const display = new Intl.DisplayNames(['en'], { type: 'region' });
		return display.of(code.toUpperCase()) ?? null;
	} catch (error) {
		return null;
	}
};

export const resolveGeoFromHeaders = (headers: Headers) => {
	const edgescape = parseEdgescape(headers.get('x-akamai-edgescape'));
	const netlifyGeo = parseNetlifyGeo(headers.get('x-nf-geo'));
	const countryCode =
		readHeader(headers, [
			'x-vercel-ip-country',
			'cf-ipcountry',
			'cloudfront-viewer-country',
			'x-appengine-country',
			'x-country-code',
			'x-geo-country',
			'client-geo-country'
		]) ??
		netlifyGeo?.countryCode ??
		edgescape?.countryCode ??
		null;
	const region =
		readHeader(headers, [
			'x-vercel-ip-country-region',
			'cf-region',
			'cf-region-code',
			'cloudfront-viewer-country-region',
			'x-appengine-region',
			'x-geo-region',
			'client-geo-region'
		]) ??
		netlifyGeo?.region ??
		edgescape?.region ??
		null;
	const city =
		readHeader(headers, [
			'x-vercel-ip-city',
			'cf-ipcity',
			'cloudfront-viewer-city',
			'x-appengine-city',
			'x-geo-city',
			'client-geo-city'
		]) ??
		netlifyGeo?.city ??
		edgescape?.city ??
		null;
	const countryName = resolveCountryName(countryCode);

	return {
		countryCode: nullIfEmpty(countryCode)?.toUpperCase() ?? null,
		countryName,
		region: nullIfEmpty(region),
		city: nullIfEmpty(city)
	};
};

const privateIpRegex =
	/^(127\.|10\.|0\.0\.0\.0|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|::1$|fc00:|fd00:|fe80:)/i;

const normalizeIp = (value: string | null | undefined) => {
	const raw = nullIfEmpty(value);
	if (!raw) return null;
	const normalized = raw.replace(/^::ffff:/, '').replace(/^\[(.*)\]$/, '$1');
	return privateIpRegex.test(normalized) ? null : normalized;
};

const firstForwardedIp = (value: string | null) => {
	const input = nullIfEmpty(value);
	if (!input) return null;
	const parts = input.split(',').map((item) => item.trim());
	for (const part of parts) {
		const match = part.match(/for="?([^;"]+)"?/i);
		const candidate = normalizeIp(match ? match[1] : part);
		if (candidate) return candidate;
	}
	return null;
};

export const resolveClientIpFromHeaders = (headers: Headers) => {
	const direct = [
		'cf-connecting-ip',
		'true-client-ip',
		'fastly-client-ip',
		'fly-client-ip',
		'x-real-ip',
		'x-client-ip',
		'client-ip'
	];

	for (const name of direct) {
		const value = normalizeIp(headers.get(name));
		if (value) return value;
	}

	return (
		firstForwardedIp(headers.get('x-forwarded-for')) ??
		firstForwardedIp(headers.get('forwarded')) ??
		null
	);
};
