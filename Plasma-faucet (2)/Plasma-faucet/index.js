const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public")); // Sert les fichiers HTML/CSS/JS depuis le dossier "public"

const PRIVATE_KEY = process.env.PRIVATE_KEY;
console.log("PRIVATE_KEY chargé ?", !!PRIVATE_KEY);
if (!PRIVATE_KEY) {
  console.error("⚠️ PRIVATE_KEY non défini !");
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider("https://wandering-methodical-valley.plasma-testnet.quiknode.pro/44e9db55e0e3a2d838df22a049ebf9cffbbde096");
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

app.post("/request", async (req, res) => {
  const { address } = req.body;
  if (!address) return res.status(400).json({ error: "Address required" });

  // Validate address format
  if (!ethers.isAddress(address)) {
    return res.status(400).json({ error: "Invalid address format" });
  }

  try {
    // Check wallet balance first
    const balance = await wallet.provider.getBalance(wallet.address);
    const requiredAmount = ethers.parseEther("0.01");

    if (balance < requiredAmount) {
      return res.status(500).json({ error: "Faucet wallet has insufficient funds" });
    }

    // Send transaction
    const tx = await wallet.sendTransaction({
      to: address,
      value: requiredAmount,
      gasLimit: 21000 // Standard ETH transfer gas limit
    });

    // Don't wait for confirmation to avoid rate limits
    res.json({ 
      txHash: tx.hash,
      message: "Transaction sent! It may take a few minutes to confirm."
    });

  } catch (err) {
    console.error("❌ Erreur lors de l'envoi :", err);

    // Handle specific error cases
    let errorMessage = "Transaction failed";
    if (err.message.includes("rate limit")) {
      errorMessage = "Rate limit exceeded. Please try again in a few minutes.";
    } else if (err.message.includes("insufficient funds")) {
      errorMessage = "Insufficient funds in faucet wallet";
    } else if (err.message.includes("nonce")) {
      errorMessage = "Transaction nonce error. Please try again.";
    }

    res.status(500).json({ error: errorMessage });
  }
});

// Sert index.html à la racine /
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Faucet prêt sur le port ${PORT}`);
});