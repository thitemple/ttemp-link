import { getGeoipCountryDb } from '@ttemp/db/queries';
import { Reader, ReaderModel } from '@maxmind/geoip2-node';
import { resolveCountryName } from '$lib/analytics';

type CountryResult = {
	countryCode: string | null;
	countryName: string | null;
};

let cachedReader: ReaderModel | null = null;
let cachedFetchedAt: string | null = null;

const toUint8Array = (value: unknown) => {
	if (!value) return null;
	if (value instanceof Uint8Array) return value;
	if (typeof Buffer !== 'undefined' && value instanceof Buffer) {
		return new Uint8Array(value);
	}
	if (Array.isArray(value)) {
		return new Uint8Array(value);
	}
	return null;
};

const loadReader = async () => {
	const record = await getGeoipCountryDb();
	if (!record?.mmdb) return null;

	const nextFetchedAt = record.fetchedAt ? new Date(record.fetchedAt).toISOString() : null;
	if (cachedReader && cachedFetchedAt && nextFetchedAt === cachedFetchedAt) {
		return cachedReader;
	}

	const mmdbBytes = toUint8Array(record.mmdb);
	if (!mmdbBytes || mmdbBytes.length === 0) return null;

	const reader = Reader.openBuffer(Buffer.from(mmdbBytes));
	cachedReader = reader;
	cachedFetchedAt = nextFetchedAt;
	return reader;
};

export const resolveCountryFromGeoLite = async (
	ip: string | null
): Promise<CountryResult | null> => {
	if (!ip) return null;

	try {
		const reader = await loadReader();
		if (!reader) return null;
		const result = reader.country(ip);
		const countryCode = result?.country?.isoCode?.toUpperCase() ?? null;
		const countryName = result?.country?.names?.en ?? resolveCountryName(countryCode);
		return {
			countryCode,
			countryName: countryName ?? null
		};
	} catch (error) {
		return null;
	}
};
