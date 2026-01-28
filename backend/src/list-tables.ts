import 'dotenv/config'
import { Pool } from 'pg'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
})

async function listTables() {
    console.log('Fetching all tables from the database...')
    const client = await pool.connect()
    try {
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `)
        if (res.rows.length === 0) {
            console.log('No tables found in the "public" schema.')
        } else {
            console.log('Tables in "public" schema:')
            console.table(res.rows)
        }
    } catch (err) {
        console.error('Error fetching tables:', err)
    } finally {
        client.release()
        await pool.end()
    }
}

listTables()
