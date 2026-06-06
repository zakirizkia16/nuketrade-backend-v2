import { createClient } from '@supabase/supabase-js';

// Inisialisasi Supabase Admin
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Fungsi untuk verifikasi token user
async function verifyUser(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    
    const token = authHeader.split(' ')[1]; // Bearer <token>
    if (!token) return null;

    const { data: { user } } = await supabase.auth.getUser(token);
    return user;
}

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*'); // Ganti dengan URL Netlify lo nanti
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    // Tangani Preflight CORS
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 1. Verifikasi User
    const user = await verifyUser(req);
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // 2. Ambil parameter rute (contoh: /api/data?endpoint=price)
    const { endpoint } = req.query;

    // 3. Proxy ke API External
    try {
        let apiUrl = '';
        if (endpoint === 'price') apiUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true';
        else if (endpoint === 'mempool') apiUrl = 'https://mempool.space/api/mempool';
        else if (endpoint === 'blocks') apiUrl = 'https://mempool.space/api/blocks';
        else if (endpoint === 'fees') apiUrl = 'https://mempool.space/api/v1/fees/recommended';
        else return res.status(404).json({ error: 'Endpoint not found' });

        const response = await fetch(apiUrl);
        const data = await response.json();
        return res.status(200).json(data);
        
    } catch (error) {
        return res.status(500).json({ error: 'Gagal ambil data' });
    }
}