const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const DELAI = 24 * 60 * 60 * 1000; 
const lastRequests = {}; 


async function sendTokens(address) {
    
    console.log(`Tokens envoyés à ${address}`);
    return "0x123456789abcdef"; 
}

app.post('/request', async (req, res) => {
    const { address } = req.body;

   
    if (!address || !address.startsWith('0x') || address.length < 10) {
        return res.status(400).json({ error: 'Invalid wallet address' });
    }

    const now = Date.now();


    if (lastRequests[address] && (now - lastRequests[address]) < DELAI) {
        const cooldownRestant = DELAI - (now - lastRequests[address]);
        return res.status(429).json({
            error: 'Please wait before requesting again',
            cooldown: cooldownRestant
        });
    }

    try {
        const txHash = await sendTokens(address);

        lastRequests[address] = now;

        res.json({ txHash });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(3000, () => {
    console.log('🚀 Faucet backend running on http://localhost:3000');
});
