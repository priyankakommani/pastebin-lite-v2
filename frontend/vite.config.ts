import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        // We remove the proxy here because we want to use environment variables for the API URL
        // This makes it easier to deploy to Vercel and point to Render.
    }
})
