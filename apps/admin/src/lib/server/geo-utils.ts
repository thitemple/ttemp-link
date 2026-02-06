export const ONE_DAY_MS = 24 * 60 * 60 * 1000;
export const MAXMIND_SOURCE = "https://dev.maxmind.com/geoip/geolite2-free-geolocation-data";

export const nullIfEmpty = (value: string | null | undefined) => {
	if (!value) return null;
	const trimmed = value.trim();
	return trimmed === "" ? null : trimmed;
};

export const parseDateHeader = (value: string | null) => {
	const parsed = nullIfEmpty(value);
	if (!parsed) return null;
	const date = new Date(parsed);
	return Number.isNaN(date.getTime()) ? null : date;
};

export const getDownloadUrl = (licenseKey: string) =>
	`https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-Country&license_key=${encodeURIComponent(licenseKey)}&suffix=tar.gz`;

export const extractTarFile = (archive: Uint8Array, matcher: (name: string) => boolean) => {
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

export const checkLatestGeoLiteVersion = async (licenseKey: string) => {
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
