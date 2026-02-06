import { env } from "$env/dynamic/private";
import { fail } from "@sveltejs/kit";
import {
	getAnalyticsSettings,
	getGeoipCountryDb,
	saveGeoipCountryDb,
	saveGeoipCountryDbCheck,
	upsertAnalyticsSettings,
} from "@ttemp/db/queries";
import { gunzipSync } from "node:zlib";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const MAXMIND_SOURCE = "https://dev.maxmind.com/geoip/geolite2-free-geolocation-data";

const nullIfEmpty = (value: string | null | undefined) => {
	if (!value) return null;
	const trimmed = value.trim();
	return trimmed === "" ? null : trimmed;
};

const parseDateHeader = (value: string | null) => {
	const parsed = nullIfEmpty(value);
	if (!parsed) return null;
	const date = new Date(parsed);
	return Number.isNaN(date.getTime()) ? null : date;
};

const getDownloadUrl = (licenseKey: string) =>
	`https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-Country&license_key=${encodeURIComponent(licenseKey)}&suffix=tar.gz`;

const extractTarFile = (archive: Uint8Array, matcher: (name: string) => boolean) => {
	let offset = 0;
	while (offset + 512 <= archive.length) {
		const header = archive.subarray(offset, offset + 512);
		const nameRaw = Buffer.from(header.subarray(0, 100)).toString("utf8");
		const name = nameRaw.replace(/\0.*$/, "");
		if (!name) break;

		const sizeRaw = Buffer.from(header.subarray(124, 136))
			.toString("utf8")
			.replace(/\0.*$/, "")
			.trim();
		const fileSize = Number.parseInt(sizeRaw || "0", 8);
		const dataStart = offset + 512;
		const dataEnd = dataStart + fileSize;
		if (matcher(name)) {
			return archive.subarray(dataStart, dataEnd);
		}

		const blocks = Math.ceil(fileSize / 512);
		offset = dataStart + blocks * 512;
	}

	return null;
};

const checkLatestGeoLiteVersion = async (licenseKey: string) => {
	const response = await fetch(getDownloadUrl(licenseKey), {
		method: "HEAD",
		redirect: "follow",
	});
	if (!response.ok) return null;
	return {
		etag: nullIfEmpty(response.headers.get("etag")),
		lastModifiedAt: parseDateHeader(response.headers.get("last-modified")),
	};
};

export async function load() {
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
}

export const actions = {
	saveSettings: async ({ request }) => {
		const formData = await request.formData();
		const trackCountry = formData.get("trackCountry") === "on";
		const useGeoLiteFallback = trackCountry && formData.get("useGeoLiteFallback") === "on";
		const submittedLicenseKey = nullIfEmpty(formData.get("maxmindLicenseKey")?.toString());
		const current = await getAnalyticsSettings();
		const maxmindLicenseKey =
			submittedLicenseKey !== null
				? submittedLicenseKey
				: (nullIfEmpty(current?.maxmindLicenseKey) ?? null);

		await upsertAnalyticsSettings({
			trackCountry,
			useGeoLiteFallback,
			maxmindLicenseKey,
		});

		return { success: true };
	},
	refreshGeoLite: async () => {
		const settings = await getAnalyticsSettings();
		const licenseKey =
			nullIfEmpty(settings?.maxmindLicenseKey) ?? nullIfEmpty(env.MAXMIND_LICENSE_KEY);
		if (!licenseKey) {
			return fail(400, { error: "MAXMIND_LICENSE_KEY is not configured." });
		}

		const response = await fetch(getDownloadUrl(licenseKey), { redirect: "follow" });
		if (!response.ok) {
			return fail(response.status, {
				error: "Unable to download GeoLite2 Country. Check your license key.",
			});
		}

		const archiveBuffer = new Uint8Array(await response.arrayBuffer());
		const tarBuffer = gunzipSync(archiveBuffer);
		const mmdb = extractTarFile(tarBuffer, (name) => name.endsWith(".mmdb"));
		if (!mmdb) {
			return fail(500, { error: "GeoLite2 archive did not contain an MMDB file." });
		}

		const lastModifiedAt = parseDateHeader(response.headers.get("last-modified"));
		const etag = nullIfEmpty(response.headers.get("etag"));
		await saveGeoipCountryDb({
			mmdb,
			sourceUrl: MAXMIND_SOURCE,
			etag,
			lastModifiedAt,
		});

		return { success: true };
	},
};
