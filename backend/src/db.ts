import 'dotenv/config'
import { Pool } from 'pg'

console.log('Initializing Pool...')
if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not defined!')
}

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
})

// Optional: Test connection on startup
pool.connect().then(() => console.log('Successfully connected to Postgres')).catch((err: any) => console.error('Postgres connection error:', err))
