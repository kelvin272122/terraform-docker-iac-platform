import type { Pool } from 'pg';

const TEST_DATABASE_PATTERN = /^iac_test_[a-z0-9_]+$/;

interface DatabaseIdentityRow {
  readonly database: string;
  readonly role: string;
  readonly is_superuser: boolean;
}

interface MarkerRow {
  readonly token: string;
}

export async function assertDestructiveTestDatabase(
  pool: Pool,
  env: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  if (env.RUN_DB_INTEGRATION !== '1') {
    throw new Error('Destructive tests require RUN_DB_INTEGRATION=1.');
  }

  if (env.DESTRUCTIVE_DB_TESTS !== '1') {
    throw new Error('Destructive tests require DESTRUCTIVE_DB_TESTS=1.');
  }

  const databaseName = env.DB_NAME?.trim();
  if (!databaseName || !TEST_DATABASE_PATTERN.test(databaseName)) {
    throw new Error('DB_NAME must use the exclusive iac_test_ prefix.');
  }

  if (env.TEST_DB_CONFIRM !== databaseName) {
    throw new Error('TEST_DB_CONFIRM must match DB_NAME exactly.');
  }

  const markerToken = env.TEST_DB_MARKER_TOKEN?.trim();
  if (!markerToken) {
    throw new Error('TEST_DB_MARKER_TOKEN is required for destructive tests.');
  }

  const identity = await pool.query<DatabaseIdentityRow>(
    `SELECT current_database() AS database,
            current_user AS role,
            (SELECT rolsuper FROM pg_roles WHERE rolname = current_user) AS is_superuser`,
  );
  const identityRow = identity.rows[0];

  if (!identityRow || identityRow.database !== databaseName) {
    throw new Error('The connected database is not the confirmed test database.');
  }

  if (identityRow.is_superuser) {
    throw new Error('Destructive tests must not use a superuser role.');
  }

  let marker: MarkerRow | undefined;
  try {
    const result = await pool.query<MarkerRow>(
      'SELECT token FROM test_guard.marker LIMIT 1',
    );
    marker = result.rows[0];
  } catch {
    throw new Error('The administrative test marker is missing or unreadable.');
  }

  if (!marker || marker.token !== markerToken) {
    throw new Error('The administrative test marker token does not match.');
  }
}
