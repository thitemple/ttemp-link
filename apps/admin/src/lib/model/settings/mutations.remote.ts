import { command, form } from "$app/server";
import { error } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import {
	getAnalyticsSettings,
	saveGeoipCountryDb,
	upsertAnalyticsSettings,
} from "@ttemp/db/queries";
import { gunzipSync } from "node:zlib";
import * as v from "valibot";
import {
	extractTarFile,
	getDownloadUrl,
	MAXMIND_SOURCE,
	nullIfEmpty,
	parseDateHeader,
} from "$lib/server/geo-utils";

const saveSettingsSchema = v.object({
	trackCountry: v.optional(v.boolean()),
	useGeoLiteFallback: v.optional(v.boolean()),
	maxmindLicenseKey: v.optional(v.string()),
});

export const saveSettings = form(saveSettingsSchema, async (data) => {
	const trackCountry = data.trackCountry ?? false;
	const useGeoLiteFallback = trackCountry && (data.useGeoLiteFallback ?? false);
	const submittedLicenseKey = nullIfEmpty(data.maxmindLicenseKey);
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

	const { getSettingsPageData } = await import("$lib/model/settings/queries.remote");
	getSettingsPageData().refresh();

	return { success: true };
});

export const refreshGeoLite = command(async () => {
	const settings = await getAnalyticsSettings();
	const licenseKey =
		nullIfEmpty(settings?.maxmindLicenseKey) ?? nullIfEmpty(env.MAXMIND_LICENSE_KEY);
	if (!licenseKey) {
		error(400, "MAXMIND_LICENSE_KEY is not configured.");
	}

	const response = await fetch(getDownloadUrl(licenseKey), { redirect: "follow" });
	if (!response.ok) {
		error(response.status, "Unable to download GeoLite2 Country. Check your license key.");
	}

	const archiveBuffer = new Uint8Array(await response.arrayBuffer());
	const tarBuffer = gunzipSync(archiveBuffer);
	const mmdb = extractTarFile(tarBuffer, (name) => name.endsWith(".mmdb"));
	if (!mmdb) {
		error(500, "GeoLite2 archive did not contain an MMDB file.");
	}

	const lastModifiedAt = parseDateHeader(response.headers.get("last-modified"));
	const etag = nullIfEmpty(response.headers.get("etag"));
	await saveGeoipCountryDb({
		mmdb,
		sourceUrl: MAXMIND_SOURCE,
		etag,
		lastModifiedAt,
	});

	const { getSettingsPageData } = await import("$lib/model/settings/queries.remote");
	getSettingsPageData().refresh();

	return { success: true };
});
