import path from 'node:path';
import { existsSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'drizzle-kit';

const root = process.cwd();
const envFiles = ['.env.local', '.env'];

for (const fileName of envFiles) {
	const filePath = path.join(root, fileName);
	if (!existsSync(filePath)) continue;

	const lines = readFileSync(filePath, 'utf-8').split(/\r?\n/);
	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;

		const equalsIndex = trimmed.indexOf('=');
		if (equalsIndex <= 0) continue;

		const key = trimmed.slice(0, equalsIndex).trim();
		if (!key || process.env[key] !== undefined) continue;

		const rawValue = trimmed.slice(equalsIndex + 1).trim();
		const unquoted =
			(rawValue.startsWith('"') && rawValue.endsWith('"')) ||
			(rawValue.startsWith("'") && rawValue.endsWith("'"))
				? rawValue.slice(1, -1)
				: rawValue;

		process.env[key] = unquoted;
	}
}

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

export default defineConfig({
	schema: './packages/db/src/schema.ts',
	dialect: 'postgresql',
	dbCredentials: { url: process.env.DATABASE_URL },
	verbose: true,
	strict: true
});
