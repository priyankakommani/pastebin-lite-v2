import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { z } from 'zod'
import { pool } from './db'

export const app = new Hono()

// Enable CORS for all routes
app.use('/api/*', cors())
app.use('/p/*', cors())

// FOR TESTING: Bypass SSL verification for Aiven
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

// Helper to get present time
const getNow = (c: any) => {
    const testNow = c.req.header('x-test-now-ms')
    if (process.env.TEST_MODE === '1' && testNow) {
        return new Date(parseInt(testNow))
    }
    return new Date()
}

// Health check
app.get('/api/healthz', async (c) => {
    try {
        await pool.query('SELECT 1')
        return c.json({ ok: true })
    } catch (e: any) {
        console.error('Health check failed:', e)
        return c.json({
            ok: false,
            error: e.message || 'Unknown error',
            details: e.code || undefined
        }, 500)
    }
})

// Create a paste
app.post('/api/pastes', async (c) => {
    const body = await c.req.json()

    const schema = z.object({
        content: z.string().min(1),
        ttl_seconds: z.number().int().min(1).optional(),
        max_views: z.number().int().min(1).optional(),
    })

    const result = schema.safeParse(body)
    if (!result.success) {
        return c.json({ error: result.error }, 400)
    }

    const { content, ttl_seconds, max_views } = result.data
    const now = getNow(c)

    const expiresAt = ttl_seconds ? new Date(now.getTime() + ttl_seconds * 1000) : null

    try {
        const id = Math.random().toString(36).substring(2, 10) // Simple CUID-like fallback or let DB handle
        const query = `
            INSERT INTO "Paste" (id, content, "maxViews", "remainingViews", "expiresAt", "createdAt")
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `
        const values = [id, content, max_views || null, max_views || null, expiresAt, now]
        const res = await pool.query(query, values)
        const paste = res.rows[0]

        return c.json({
            id: paste.id,
            url: `${new URL(c.req.url).origin}/p/${paste.id}`
        }, 201)
    } catch (e: any) {
        console.error('Create paste failed:', e)
        return c.json({
            error: e.message || 'Unknown error during paste creation',
            details: e.code || undefined
        }, 500)
    }
})

// Fetch a paste (API)
app.get('/api/pastes/:id', async (c) => {
    const id = c.req.param('id')
    const now = getNow(c)

    try {
        const res = await pool.query('SELECT * FROM "Paste" WHERE id = $1', [id])
        const paste = res.rows[0]

        if (!paste) {
            return c.json({ error: 'Paste not found' }, 404)
        }

        // Check Expiry
        if (paste.expiresAt && new Date(paste.expiresAt) < now) {
            return c.json({ error: 'Paste expired' }, 404)
        }

        // Check View Limit
        if (paste.maxViews !== null && (paste.remainingViews ?? 0) <= 0) {
            return c.json({ error: 'View limit exceeded' }, 404)
        }

        // Update view count
        let remainingViews = paste.remainingViews
        if (paste.maxViews !== null) {
            const updateRes = await pool.query(
                'UPDATE "Paste" SET "remainingViews" = "remainingViews" - 1 WHERE id = $1 RETURNING "remainingViews"',
                [id]
            )
            remainingViews = updateRes.rows[0].remainingViews
        }

        return c.json({
            content: paste.content,
            remaining_views: remainingViews,
            expires_at: paste.expiresAt ? new Date(paste.expiresAt).toISOString() : null
        })
    } catch (e: any) {
        console.error('Fetch paste failed:', e)
        return c.json({
            error: e.message || 'Unknown error during paste fetch',
            details: e.code || undefined
        }, 500)
    }
})

// View a paste (HTML)
app.get('/p/:id', async (c) => {
    const id = c.req.param('id')
    const now = getNow(c)

    try {
        const res = await pool.query('SELECT * FROM "Paste" WHERE id = $1', [id])
        const paste = res.rows[0]

        if (!paste ||
            (paste.expiresAt && new Date(paste.expiresAt) < now) ||
            (paste.maxViews !== null && (paste.remainingViews ?? 0) <= 0)) {
            return c.html('<h1>404 Paste Not Found</h1>', 404)
        }

        let remainingViews = paste.remainingViews
        if (paste.maxViews !== null) {
            const updateRes = await pool.query(
                'UPDATE "Paste" SET "remainingViews" = "remainingViews" - 1 WHERE id = $1 RETURNING "remainingViews"',
                [id]
            )
            remainingViews = updateRes.rows[0].remainingViews
        }

        // Safe rendering: Escape HTML
        const escapedContent = paste.content
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pastebin-Lite</title>
            <style>
                body { font-family: sans-serif; padding: 20px; line-height: 1.6; max-width: 800px; margin: 0 auto; background: #f4f4f9; }
                pre { background: #fff; padding: 15px; border-radius: 8px; border: 1px solid #ddd; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word; }
                .meta { font-size: 0.8em; color: #666; margin-top: 10px; }
            </style>
        </head>
        <body>
            <h1>Pastebin-Lite</h1>
            <pre>${escapedContent}</pre>
            <div class="meta">
                ${paste.expiresAt ? `Expires at: ${new Date(paste.expiresAt).toISOString()}` : 'No expiration'}
                ${paste.maxViews !== null ? ` | Remaining views: ${remainingViews}` : ''}
            </div>
        </body>
        </html>
      `
        return c.html(html)
    } catch (e: any) {
        console.error('View paste failed:', e)
        return c.html(`<h1>500 Internal Server Error</h1><p>${e.message || 'Unknown error'}</p>`, 500)
    }
})

const port = Number(process.env.PORT) || 3000
console.log(`Server is starting on port ${port}`)

serve({
    fetch: app.fetch,
    port
})
