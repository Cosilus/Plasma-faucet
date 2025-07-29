
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Mémoire temporaire pour limiter par IP
const rateLimit = {};

// Middleware
app.use(bodyParser.json());
app.set('trust proxy', true); // nécessaire pour récupérer la vraie IP sur Render

// Servir les fichiers frontend (si dans dossier "public")
app.use(express.static(path.join(__dirname, 'public')));

function hasRequestedToday(ip) {
    const now = new Date();
    const last = rateLimit[ip];

    if (!last) return false;

    return new Date(last).toDateString() === now.toDateString();
}

function recordRequest(ip) {
    rateLimit[ip] = new Date();
}

// Simule une requête réseau (à remplacer par envoi réel sur Plasma)
async function sendTokens(address) {
    return {
        txHash: `0x${Math.random().toString(16).slice(2)}abcd`
    };
}

// Route API
app.post('/request', async (req, res) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
    const address = req.body.address;

    console.log('Request from IP:', ip); // Pour debug

    if (!address || !address.startsWith('0x') || address.length !== 42) {
        return res.status(400).json({ error: 'Invalid wallet address' });
    }

    if (hasRequestedToday(ip)) {
        return res.status(429).json({ error: 'You can only request tokens once per day.' });
    }

    try {
        const tx = await sendTokens(address);
        recordRequest(ip);
        res.json({ txHash: tx.txHash });
    } catch (e) {
        res.status(500).json({ error: 'Token transfer failed' });
    }
});

// Démarrage
app.listen(PORT, () => {
    console.log(`✅ Faucet server running at http://localhost:${PORT}`);
});
