
# 🔥 Teck Model - Advanced Aptos Blockchain AI

A comprehensive AI-powered SDK for Aptos blockchain with advanced DeFi analytics and NFT tracking capabilities.

## 🚀 Features

- **Real-time Token Analytics**
  - Price tracking across multiple DEXes
  - Market cap and volume analysis
  - Liquidity monitoring
  - Verified pair detection

- **NFT Analytics**
  - Collection statistics
  - Floor price tracking
  - Volume analysis
  - Multi-marketplace support

- **Wallet Management**
  - Create new wallets
  - Balance checking
  - Token transfers
  - Transaction history

- **Market Analysis**
  - Holder distribution
  - Transaction patterns
  - Price predictions
  - Market sentiment

- **AI Integration**
  - Groq LLM integration
  - Market insights
  - Trading suggestions
  - Risk analysis

## 💻 Installation

```bash
npm install aptai-js
```

## 📚 Usage Guide

### 1. Basic Setup

```javascript
const { AptAi } = require('aptai');

// Initialize SDK with required configuration
const ai = new AptAi({
  groqApiKey: 'your_groq_api_key', // Required
  nodeUrl: 'https://fullnode.mainnet.aptoslabs.com/v1', // Optional: Custom node URL
  maxTokens: 200, // Optional: Customize AI response length
  temperature: 0.7 // Optional: Customize AI response creativity
});
```

### Security Note
Never hardcode or expose your private keys. Always use environment variables or secure key management systems.

### 2. Token Analysis

```javascript
// Get token price and market data
const tokenInfo = await ai.getPrice('aptos');
console.log(tokenInfo);
/*
{
  name: 'Aptos',
  symbol: 'APT',
  price: 10.50,
  price_change_24h: 2.5,
  volume24h: 1000000,
  market_cap: 50000000,
  dex: {
    name: 'PancakeSwap',
    verified: true
  }
}
*/

// Get detailed token analysis
const analysis = await ai.analyzeTokenMetrics('token_address');
console.log(analysis);
```

### 3. Wallet Operations

```javascript
// Create new wallet
const wallet = await ai.createWallet();
/*
{
  address: '0x...',
  privateKey: '0x...',
  publicKey: '0x...'
}
*/

// Check balance
const balance = await ai.getBalance('0x...');
console.log(`Balance: ${balance} APT`);

// Send tokens
const tx = await ai.sendTokens(
  'sender_private_key',
  'recipient_address',
  1.5 // amount in APT
);
```

### 4. AI Chat Features

```javascript
// Get market insights
const insight = await ai.chat('Analyze APT price trend');
console.log(insight);

// Get token analysis
const tokenInsight = await ai.getAIInsights('token_address');
console.log(tokenInsight);
```

### 5. NFT Analytics

```javascript
const nftData = await ai.getNFTData('collection_address');
console.log(nftData);
/*
{
  marketplaces: {
    topaz: { floor_price, volume },
    souffl3: { stats },
    bluemove: { collection }
  },
  analytics: {
    total_volume,
    floor_price,
    highest_sale
  }
}
*/
```

## 🤖 Telegram Bot Integration

The SDK includes a ready-to-use Telegram bot implementation. To use it:

1. Create a new bot with [@BotFather](https://t.me/BotFather) and get your bot token
2. Set up your bot:

```javascript
// bot.js
const BOT_TOKEN = '1234567890:ABCdefGHIjklMNOpqrsTUVwxyz123456789'; // Replace with your bot token
const GROQ_API_KEY = 'gsk_1234567890abcdef'; // Replace with your Groq API key
```

3. Start the bot:
```bash
node bot.js
```

Available commands:
- `/start` - Start the bot
- `/help` - Show available commands
- `/price <token>` - Get token price
- `/nft <address>` - Get NFT collection data
- `/balance <address>` - Check wallet balance
- `/analyze <token>` - Get AI analysis

## 🧪 Testing

```bash
npm test                   // Run all tests
npm run lint              // Check code style
```

## 📈 Error Handling

The SDK implements comprehensive error handling for:
- Network failures
- Invalid inputs
- API rate limits
- Transaction errors
- Blockchain issues

## 🔧 Deployment

1. Fork or clone the repository
2. Install dependencies: `npm install`
3. Set up your environment variables

## 📄 License

MIT © Teck

## 📊 Latest Aptos Price (Updated: 2025-03-17T05:39:16.845Z)
- Price: $5.34
- 24h Change: -0.06%
- Volume: $249787.41
- Market Cap: $6128673488
