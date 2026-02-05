
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente do arquivo .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Testing Supabase Connection...');
console.log('URL:', supabaseUrl);
console.log('Key exists:', !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    try {
        console.log('Fetching profiles count...');
        const start = Date.now();

        // Timeout promise
        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout after 5s')), 5000)
        );

        // Query promise
        const query = supabase
            .from('profiles')
            .select('count', { count: 'exact', head: true });

        // Race
        const { count, error } = await Promise.race([query, timeout]);

        console.log('Time taken:', Date.now() - start, 'ms');

        if (error) {
            console.error('Supabase Error:', error);
        } else {
            console.log('Success! Count:', count);
        }
    } catch (err) {
        console.error('Connection Failed:', err.message);
    }
}

test();
