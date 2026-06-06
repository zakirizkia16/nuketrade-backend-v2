import { createClient } from '@supabase/supabase-js';

// Inisialisasi Supabase dengan kunci Admin (Service Role)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Fungsi ngecek Gelang VIP (Token) user
async function verifyUser(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    
    const token = authHeader.split(' ')[1]; // Bearer <token>
    if (!token) return null;

    const { data: { user } } = await supabase.auth.getUser(token);
    return user;
}

export default async function handler(req, res) {
    // Set CORS (Izin akses)
    res.setHeader('Access-Control-Allow-Origin', '*'); // Nanti ganti URL Netlify lo
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 1. Cek apakah user bawa Token yang valid
    const user = await verifyUser(req);
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized: Lo nggak punya akses!' });
    }

    // 2. Cek mau ambil data apa
    const { endpoint } = req.query;

    // 3. Ambil data dari API luar (CoinGecko / Mempool)
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
        return res.status(500).json({ error: 'Gagal ambil data dari server luar' });
    }
}