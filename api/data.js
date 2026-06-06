import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Fungsi ngecek Token VIP (Login)
async function verifyUser(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log("GAK ADA HEADER AUTH");
        return null;
    }
    
    const token = authHeader.slice(7); // Ambil token setelah "Bearer "
    if (!token) {
        console.log("TOKEN KOSONG");
        return null;
    }

    console.log("Mencoba verifikasi token...");
    const { data, error } = await supabase.auth.getUser(token);
    
    // KALAU ADA ERROR DARI SUPABASE, TAMPILIN DI LOG VERCEL
    if (error) {
        console.error("ERROR VERIFIKASI SUPABASE:", error.message);
        return null;
    }
    
    if (!data?.user) {
        console.log("DATA USER TIDAK DITEMUKAN");
        return null;
    }

    console.log("User valid:", data.user.email);
    return data.user;
}

export default async function handler(req, res) {
    // CORS Settings
    res.setHeader('Access-Control-Allow-Origin', '*'); // Ganti URL Netlify lo nanti biar lebih aman
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 1. Cek Login
    const user = await verifyUser(req);
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized: Token hilang atau salah!' });
    }

    // 2. Cek mau ambil data apa
    const { endpoint } = req.query;

    // 3. Arahkan ke API External
    try {
        let apiUrl = '';
        
        if (endpoint === 'price') {
            apiUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true';
        } 
        else if (endpoint === 'mempool') {
            apiUrl = 'https://mempool.space/api/mempool';
        } 
        else if (endpoint === 'blocks') {
            apiUrl = 'https://mempool.space/api/blocks';
        } 
        else if (endpoint === 'fees') {
            apiUrl = 'https://mempool.space/api/v1/fees/recommended';
        } 
        else {
            return res.status(404).json({ error: 'Endpoint not found' });
        }

        const response = await fetch(apiUrl);
        const data = await response.json();
        
        return res.status(200).json(data);
        
    } catch (error) {
        return res.status(500).json({ error: 'Gagal ambil data dari server luar' });
    }
}