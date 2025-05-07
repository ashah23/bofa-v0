import { Pool } from 'pg';
import { neonConfig } from '@neondatabase/serverless';

// Configure Neon to use WebSocket
neonConfig.webSocketConstructor = WebSocket;

// Create a connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Test the connection
pool.on('connect', () => {
    console.log('Connected to Neon database');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

export default pool; 