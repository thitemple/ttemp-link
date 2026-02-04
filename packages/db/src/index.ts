/// <reference types="node" />
import fs from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

function ensureEnv() {
	if (process.env.DATABASE_URL) return;

	const cwd = process.cwd();
	const candidates = [
		path.join(cwd, '.env'),
		path.join(cwd, '..', '.env'),
		path.join(cwd, '..', '..', '.env')
	];

	for (const candidate of candidates) {
		if (fs.existsSync(candidate)) {
			loadEnv({ path: candidate });
			if (process.env.DATABASE_URL) return;
		}
	}
}

ensureEnv();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error('DATABASE_URL is not set');
}

const client = postgres(databaseUrl);

export const db = drizzle(client, { schema });
export { schema };
