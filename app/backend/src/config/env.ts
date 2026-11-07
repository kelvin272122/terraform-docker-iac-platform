import { hostname } from 'node:os';

export type Environment = 'dev' | 'prod';

export interface DatabaseConfig {
  readonly host: string;
  readonly port: number;
  readonly name: string;
  readonly user: string;
  readonly password: string;
}

export interface AppConfig {
  readonly environment: Environment;
  readonly appVersion: string;
  readonly port: number;
  readonly instanceId: string;
  readonly database: DatabaseConfig;
}

const DEFAULT_PORT = 3000;
const DEFAULT_DB_PORT = 5432;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const environment = env.APP_ENV;
  if (environment !== 'dev' && environment !== 'prod') {
    throw new Error('APP_ENV debe ser "dev" o "prod".');
  }

  const appVersion = env.APP_VERSION?.trim();
  if (!appVersion) {
    throw new Error('APP_VERSION es obligatorio.');
  }

  return {
    environment,
    appVersion,
    port: parsePort(env.PORT, DEFAULT_PORT, 'PORT'),
    instanceId: hostname(),
    database: {
      host: requireValue(env.DB_HOST, 'DB_HOST'),
      port: parsePort(env.DB_PORT, DEFAULT_DB_PORT, 'DB_PORT'),
      name: requireValue(env.DB_NAME, 'DB_NAME'),
      user: requireValue(env.DB_USER, 'DB_USER'),
      password: requireValue(env.DB_PASSWORD, 'DB_PASSWORD'),
    },
  };
}

function requireValue(value: string | undefined, name: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(`${name} es obligatorio.`);
  }

  return trimmed;
}

function parsePort(value: string | undefined, defaultValue: number, name: string): number {
  if (value === undefined || value.trim() === '') {
    return defaultValue;
  }

  if (!/^\d+$/.test(value)) {
    throw new Error(`${name} debe ser un entero entre 1 y 65535.`);
  }

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${name} debe ser un entero entre 1 y 65535.`);
  }

  return port;
}
