import { Pool } from 'pg'

const databaseUrl = process.env.DATABASE_URL

function getPoolConfig() {
  if (!databaseUrl) {
    return {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'pcb_dashboard',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
  }

  try {
    const parsed = new URL(databaseUrl)
    const isLocalHost = ['localhost', '127.0.0.1'].includes(parsed.hostname)

    return {
      connectionString: databaseUrl,
      ssl: isLocalHost ? undefined : { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    }
  } catch {
    return {
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    }
  }
}

const pool = new Pool(getPoolConfig())

pool.on('connect', () => console.log('PostgreSQL connected'))
pool.on('error', (err) => console.error('DB error:', err))

export default pool
