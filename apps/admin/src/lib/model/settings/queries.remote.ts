import { query } from "$app/server";
import { env } from "$env/dynamic/private";
import { getAnalyticsSettings, getGeoipCountryDb, saveGeoipCountryDbCheck } from "@ttemp/db/queries";
import {
	checkLatestGeoLiteVersion,
	MAXMIND_SOURCE,
	nullIfEmpty,
	ONE_DAY_MS,
} from "$lib/server/geo-utils";

export const getSettingsPageData = query(async () => {
	const [settings, geoDb] = await Promise.all([getAnalyticsSettings(), getGeoipCountryDb()]);
	const licenseKey =
		nullIfEmpty(settings?.maxmindLicenseKey) ?? nullIfEmpty(env.MAXMIND_LICENSE_KEY);
	const now = Date.now();
	const checkedAtMs = geoDb?.checkedAt ? new Date(geoDb.checkedAt).getTime() : 0;
	const shouldCheck = Boolean(licenseKey) && (!checkedAtMs || now - checkedAtMs > ONE_DAY_MS);

	let latestVersionAt = geoDb?.latestLastModifiedAt ?? null;
	let latestEtag = geoDb?.etag ?? null;

	if (shouldCheck && licenseKey) {
		const latest = await checkLatestGeoLiteVersion(licenseKey);
		if (latest) {
			latestVersionAt = latest.lastModifiedAt ?? latestVersionAt;
			latestEtag = latest.etag ?? latestEtag;
			await saveGeoipCountryDbCheck({
				latestLastModifiedAt: latestVersionAt,
				etag: latestEtag,
				sourceUrl: MAXMIND_SOURCE,
			});
		}
	}

	return {
		settings: {
			trackCountry: settings?.trackCountry ?? false,
			useGeoLiteFallback: settings?.useGeoLiteFallback ?? false,
			hasStoredLicenseKey: Boolean(nullIfEmpty(settings?.maxmindLicenseKey)),
		},
		geo: {
			sourceUrl: geoDb?.sourceUrl ?? MAXMIND_SOURCE,
			lastModifiedAt: geoDb?.lastModifiedAt?.toISOString() ?? null,
			fetchedAt: geoDb?.fetchedAt?.toISOString() ?? null,
			checkedAt: geoDb?.checkedAt?.toISOString() ?? null,
			latestVersionAt: latestVersionAt?.toISOString() ?? null,
			hasDatabase: Boolean(geoDb?.mmdb && geoDb.mmdb.length > 0),
		},
		hasLicenseKey: Boolean(licenseKey),
	};
});
