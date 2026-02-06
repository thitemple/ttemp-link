/// <reference types="node" />
import fs from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

const envFileNames = ['.env.local', '.env'];

const getEnvCandidatePaths = (cwd: string) =>
	[cwd, path.resolve(cwd, '..'), path.resolve(cwd, '..', '..')].flatMap((directory) =>
		envFileNames.map((fileName) => path.join(directory, fileName))
	);

function ensureEnv() {
	if (process.env.DATABASE_URL) return;

	for (const candidate of getEnvCandidatePaths(process.cwd())) {
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
