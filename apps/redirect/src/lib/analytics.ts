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

const resolveCountryName = (countryCode: string | null) => {
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
	const countryCode =
		readHeader(headers, ['x-vercel-ip-country', 'cf-ipcountry', 'client-geo-country']) ??
		edgescape?.countryCode ??
		null;
	const region =
		readHeader(headers, [
			'x-vercel-ip-country-region',
			'cf-region',
			'cf-region-code',
			'client-geo-region'
		]) ??
		edgescape?.region ??
		null;
	const city =
		readHeader(headers, ['x-vercel-ip-city', 'cf-ipcity', 'client-geo-city']) ??
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
