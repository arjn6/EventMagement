import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const apiUrl = process.env.API_URL ?? 'http://localhost:5129';
const isProduction = process.env.NODE_ENV === 'production';

const environmentFile = `export const environment = {\n  production: ${isProduction},\n  apiUrl: ${JSON.stringify(apiUrl)}\n} as const;\n`;

const targetDirectory = resolve('src/environments');
const targetFile = resolve(targetDirectory, 'environment.ts');

console.log('==============================');
console.log('NODE_ENV :', process.env.NODE_ENV);
console.log('API_URL  :', process.env.API_URL);
console.log('Using API:', apiUrl);
console.log('==============================');

mkdirSync(targetDirectory, { recursive: true });
writeFileSync(targetFile, environmentFile, 'utf8');

console.log(`Generated src/environments/environment.ts with API_URL=${apiUrl}`);
