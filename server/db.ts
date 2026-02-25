import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function query(text: string, params?: unknown[]) {
  const res = await pool.query(text, params);
  return res;
}

export async function getClient() {
  return pool.connect();
}

export default pool;
