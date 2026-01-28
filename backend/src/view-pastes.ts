import 'dotenv/config'
import { Pool } from 'pg'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
})

async function viewPastes() {
    console.log('Fetching all record from "Paste" table...')
    const client = await pool.connect()
    try {
        const res = await client.query('SELECT * FROM "Paste" ORDER BY "createdAt" DESC')
        if (res.rows.length === 0) {
            console.log('No records found in the "Paste" table.')
        } else {
            console.table(res.rows)
        }
    } catch (err) {
        console.error('Error fetching records:', err)
    } finally {
        client.release()
        await pool.end()
    }
}

viewPastes()
