const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.json());

const DELAI = 24 * 60 * 60 * 1000; 
const DATA_FILE = path.join(__dirname, 'lastRequests.json');

let lastRequests = {};


try {
    if (fs.existsSync(DATA_FILE)) {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        lastRequests = JSON.parse(data);
        console.log('✅ lastRequests loaded from file');
    }
} catch (err) {
    console.error('❌ Error loading lastRequests:', err);
}

function saveLastRequests() {
    fs.writeFile(DATA_FILE, JSON.stringify(lastRequests, null, 2), err => {
        if (err) {
            console.error('❌ Error saving lastRequests:', err);
        } else {
            console.log('💾 lastRequests saved');
        }
    });
}

async function sendTokens(address) {
    console.log(`Tokens envoyés à ${address}`);
    return "0x123456789abcdef"; 
}

app.post('/request', async (req, res) => {
    const { address } = req.body;
    const now = Date.now();

    console.log(`Request received for address ${address} at ${new Date(now).toISOString()}`);

    if (!address || !address.startsWith('0x') || address.length < 10) {
        return res.status(400).json({ error: 'Invalid wallet address' });
    }

    if (lastRequests[address] && (now - lastRequests[address]) < DELAI) {
        const cooldownRestant = DELAI - (now - lastRequests[address]);
        console.log(`Cooldown for ${address}: ${cooldownRestant} ms left`);
        return res.status(429).json({
            error: 'Please wait before requesting again',
            cooldown: cooldownRestant
        });
    }

    try {
        const txHash = await sendTokens(address);
        lastRequests[address] = now;

        
        saveLastRequests();

        console.log(`Tokens sent to ${address} at ${new Date(now).toISOString()}`);
        res.json({ txHash });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Faucet backend running on port ${PORT}`);
});
