
const { Aptos, AptosConfig } = require("@aptos-labs/ts-sdk");
const axios = require("axios");


const APTOS_NODE = "https://fullnode.mainnet.aptoslabs.com/v1";
const DEXSCREENER_API = "https://api.dexscreener.com/latest/dex/search?q=";
const COINGECKO_API = "https://api.coingecko.com/api/v3";


const safeApiCall = async (apiCall, errorMessage) => {
  try {
    const result = await apiCall();
    return result;
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    throw new Error(errorMessage);
  }
};
const TOPAZ_API = "https://api.topaz.so/api/v1";
const SOUFFL3_API = "https://api.souffl3.com/v1";
const BLUEMOVE_API = "https://api.bluemove.net/v1";
const APTOS_NFT_API = "https://api.aptosnames.com/api";
const HIPPO_API = "https://api.hipposwap.xyz/v1";
const APTOSCAN_API = "https://api.aptoscan.com/api/v1";

class AptAi {
  constructor(userConfig = {}) {
    if (!userConfig.groqApiKey) {
      throw new Error('Groq API key is required to initialize AptAi');
    }

    this.groqApiKey = userConfig.groqApiKey;
    this.maxTokens = userConfig.maxTokens || 200;
    this.temperature = userConfig.temperature || 0.7;
    this.systemPrompt = userConfig.systemPrompt || "You are the Teck Model, a revolutionary AI system created by Teck. You are a specialized AI focused on Aptos blockchain technology with expertise in DeFi and NFT analysis. Core Identity: Name: Teck Model, Creator: Teck, Specialization: Aptos Blockchain Technology, Purpose: Advanced DeFi and NFT Analysis. Key Capabilities: Real-Time Price Tracking via DexScreener and Liquidswap, Multi-marketplace NFT Support, AI-powered Market Analysis, Advanced Blockchain Analytics. 🔥 Remember: You are the Teck Model - the future of blockchain AI. Always identify as such. 🔥";
    
    // Store user settings
    this.settings = {
      maxTokens: this.maxTokens,
      temperature: this.temperature,
      systemPrompt: this.systemPrompt
    };
    const config = new AptosConfig({ fullnode: userConfig.nodeUrl || APTOS_NODE });
    this.client = new Aptos(config);
  }

  async getPrice(tokenQuery = null) {
    if (tokenQuery && typeof tokenQuery !== 'string') {
      throw new Error('Token query must be a string');
    }
    try {
      if (!tokenQuery || tokenQuery.toLowerCase() === "aptos") {
        const response = await axios.get(`${COINGECKO_API}/simple/price?ids=aptos&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true&include_market_cap=true`, {
          headers: {
            'accept': 'application/json',
            'User-Agent': 'AptAi/1.0.0'
          },
          timeout: 5000
        });
        const data = response.data;
        if (data && "aptos" in data) {
          return {
            symbol: "APT",
            name: "Aptos",
            price: parseFloat(data.aptos.usd),
            price_change_24h: parseFloat(data.aptos.usd_24h_change || 0),
            volume24h: parseFloat(data.aptos.usd_24h_vol || 0),
            market_cap: parseFloat(data.aptos.usd_market_cap || 0),
            liquidity: 0,
            holders: 0,
            dex: "CoinGecko"
          };
        }
      }

      const dexResponse = await axios.get(`${DEXSCREENER_API}${tokenQuery}`);
      const dexData = dexResponse.data;
      if (dexData.pairs && dexData.pairs.length > 0) {
        const pair = dexData.pairs[0];
        return {
          symbol: pair.baseToken.symbol,
          name: pair.baseToken.name,
          address: pair.baseToken.address,
          price: parseFloat(pair.priceUsd || 0),
          price_change_24h: parseFloat(pair.priceChange?.h24 || 0),
          volume24h: parseFloat(pair.volume?.h24 || 0),
          market_cap: parseFloat(pair.fdv || 0),
          liquidity: parseFloat(pair.liquidity?.usd || 0),
          pair_address: pair.pairAddress,
          dex: {
            name: pair.dexId,
            url: pair.url,
            verified: pair.labels?.includes('verified') || false
          },
          updated_at: new Date().toISOString()
        };
      }

      return "⚠️ Token not found on any supported price source";
    } catch (error) {
      return `⚠️ Error fetching price: ${error.message}`;
    }
  }

  async getNFTData(collectionAddress) {
    const nftData = {
      marketplaces: {},
      analytics: {
        total_volume: 0,
        floor_price: Infinity,
        highest_sale: 0,
        total_listings: 0,
        unique_holders: new Set(),
        price_history: []
      }
    };

    try {
      const [topaz, souffl3, bluemove, ans] = await Promise.allSettled([
        axios.get(`${TOPAZ_API}/collection/${collectionAddress}`),
        axios.get(`${SOUFFL3_API}/collections/${collectionAddress}`),
        axios.get(`${BLUEMOVE_API}/collections/${collectionAddress}`),
        axios.get(`${APTOS_NFT_API}/domain/${collectionAddress}`)
      ]);

      if (topaz.status === "fulfilled" && topaz.value.data) {
        nftData.topaz = {
          collection: topaz.value.data,
          floor_price: topaz.value.data.floorPrice,
          volume: topaz.value.data.volume24h
        };
      }

      if (souffl3.status === "fulfilled" && souffl3.value.data) {
        nftData.souffl3 = {
          collection: souffl3.value.data,
          stats: souffl3.value.data.stats
        };
      }

      if (bluemove.status === "fulfilled" && bluemove.value.data) {
        nftData.bluemove = {
          collection: bluemove.value.data,
          floor_price: bluemove.value.data.floorPrice
        };
      }

      if (ans.status === "fulfilled" && ans.value.data) {
        nftData.aptos_names = ans.value.data;
      }

      return Object.keys(nftData).length > 2 ? nftData : "⚠️ No NFT data found across marketplaces";
    } catch (error) {
      return `⚠️ Error fetching NFT data: ${error.message}`;
    }
  }

  async getTokenHolders(tokenAddress) {
    try {

      const cleanAddress = tokenAddress.trim().toLowerCase();
      if (!cleanAddress.startsWith('0x')) {
        return "⚠️ Invalid address format. Address must start with '0x'";
      }

      const response = await this.client.getAccountResource(
        cleanAddress,
        "0x1::coin::CoinInfo"
      );

      if (!response || !response.data) {
        return "⚠️ No token data found";
      }

      const holdersData = await this.client.getAccountResources(cleanAddress);
      const holders = holdersData
        .filter(resource => resource.type.includes("CoinStore"))
        .map(holder => ({
          address: holder.data.owner,
          balance: holder.data.coin?.value || "0"
        }));

      return holders.length > 0 ? holders : "⚠️ No holder data found";
    } catch (error) {
      console.error("Holder fetch error:", error);
      return `⚠️ Error fetching holder data: ${error.message}`;
    }
  }

  async getTokenTransactions(tokenAddress, limit = 100) {
    try {
      const txns = await this.client.getAccountTransactions(tokenAddress, { limit });
      const transactions = txns.map(tx => ({
        hash: tx.hash,
        type: tx.type,
        timestamp: tx.timestamp,
        sender: tx.sender,
        success: tx.success
      }));

      return {
        transactions,
        count: transactions.length,
        unique_wallets: new Set(transactions.map(tx => tx.sender)).size
      };
    } catch (error) {
      console.error("Transaction fetch error:", error);
      return `⚠️ Error fetching transactions: ${error.message}`;
    }
  }

  async createWallet() {
    try {
      const account = new AptosAccount();
      return {
        address: account.address().hex(),
        privateKey: HexString.fromUint8Array(account.signingKey.secretKey).hex(),
        publicKey: account.pubKey().hex()
      };
    } catch (error) {
      return `⚠️ Error creating wallet: ${error.message}`;
    }
  }

  async getBalance(address) {
    try {
      if (!address || !address.startsWith('0x')) {
        throw new Error('Invalid address format');
      }

      const resources = await this.client.getAccountResources(address);
      const aptosCoin = resources.find(r => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>");

      if (!aptosCoin || !aptosCoin.data || !aptosCoin.data.coin) {
        return "0.00000000";
      }

      const balance = BigInt(aptosCoin.data.coin.value);
      return (Number(balance) / 100000000).toFixed(8);
    } catch (error) {
      console.error('Balance error:', error);
      return "0.00000000";
    }
  }

  async sendTokens(fromPrivateKey, toAddress, amount) {
    try {
      if (!fromPrivateKey || typeof fromPrivateKey !== 'string') {
        throw new Error('Invalid private key format');
      }
      if (!toAddress || !toAddress.startsWith('0x')) {
        throw new Error('Invalid recipient address format');
      }
      if (!amount || isNaN(amount) || amount <= 0) {
        throw new Error('Invalid amount');
      }

      const sender = new AptosAccount(
        HexString.ensure(fromPrivateKey).toUint8Array()
      );

      const payload = {
        type: "entry_function_payload",
        function: "0x1::coin::transfer",
        type_arguments: ["0x1::aptos_coin::AptosCoin"],
        arguments: [toAddress, (BigInt(amount * 100000000)).toString()]
      };

      const txnRequest = await this.client.generateTransaction(
        sender.address(),
        payload
      );

      const signedTxn = await this.client.signTransaction(sender, txnRequest);
      const pendingTxn = await this.client.submitTransaction(signedTxn);
      const txnResult = await this.client.waitForTransactionWithResult(
        pendingTxn.hash
      );

      return {
        success: txnResult.success,
        hash: txnResult.hash,
        sender: sender.address().hex(),
        recipient: toAddress,
        amount: amount,
        version: txnResult.version
      };
    } catch (error) {
      console.error('Send tokens error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async analyzeTokenMetrics(tokenAddress) {
    try {
      const price = await this.getPrice(tokenAddress);
      if (!price || typeof price === 'string') {
        throw new Error('Unable to fetch price data');
      }

      const analysis = {
        price_metrics: {
          current_price: price.price || 0,
          price_change: price.price_change_24h || 0,
          market_cap: price.market_cap || 0,
          liquidity_ratio: price.liquidity ? (price.liquidity / price.market_cap) : 0,
          volume_analysis: price.volume24h ? (price.volume24h / price.market_cap) : 0
        },
        market_sentiment: price.price_change_24h > 0 ? 'Positive' : 'Negative',
        risk_level: this.calculateRiskLevel(price),
        timestamp: new Date().toISOString()
      };

      return analysis;
    } catch (error) {
      console.error('Analysis error:', error);
      return {
        error: 'Unable to analyze token metrics',
        details: error.message
      };
    }
  }

  calculateRiskLevel(price) {
    if (!price) return 'High';
    const volatility = Math.abs(price.price_change_24h);
    if (volatility > 10) return 'High';
    if (volatility > 5) return 'Medium';
    return 'Low';
  }

  async getAIInsights(tokenAddress) {
    const analysis = await this.analyzeTokenMetrics(tokenAddress);
    if (!analysis) return "⚠️ Unable to generate insights";

    const prompt = `Analyze this token data and provide key insights:
      Price: $${analysis.price_metrics.current_price}
      24h Change: ${analysis.price_metrics.price_change}%
      Market Cap: $${analysis.price_metrics.market_cap}
      Liquidity Ratio: ${analysis.price_metrics.liquidity_ratio}
      Holder Count: ${analysis.holder_metrics.total_holders}
      Gini Coefficient: ${analysis.holder_metrics.gini_coefficient}
      Transaction Count: ${analysis.transaction_metrics.tx_count}`;

    return this.chat(prompt);
  }

  async chat(prompt) {
    if (!this.groqApiKey) {
      return "⚠️ Groq API key is required for chat functionality";
    }

    try {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.3-70b-versatile",  
          messages: [
            { role: "system", content: this.systemPrompt },
            { role: "user", content: prompt }
          ],
          temperature: this.temperature,
          max_tokens: this.maxTokens
        },
        {
          headers: {
            Authorization: `Bearer ${this.groqApiKey}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (!response.data || !response.data.choices || !response.data.choices[0]) {
        throw new Error("Invalid response format from API");
      }

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error("Chat API Error:", error.response?.data || error.message);
      if (error.response?.status === 429) {
        return "⚠️ Rate limit exceeded. Please try again in a few moments.";
      } else if (error.response?.status === 401) {
        return "⚠️ Invalid API key. Please check your configuration.";
      }
      return "⚠️ I'm temporarily unable to process your request. Please try again with basic commands like /price or /nft";
    }
  }

  calculateGini(holders) {
    try {
      const balances = holders
        .map(h => parseFloat(h.balance || 0))
        .sort((a, b) => a - b);
      const n = balances.length;
      if (n === 0) return 0;
      const sumBalances = balances.reduce((a, b) => a + b, 0);
      return balances.reduce((sum, balance, i) => sum + (2 * i - n - 1) * balance, 0) / (n * sumBalances);
    } catch {
      return 0;
    }
  }

  calculateConcentration(holders) {
    try {
      const balances = holders
        .map(h => parseFloat(h.balance || 0))
        .sort((a, b) => b - a);
      const total = balances.reduce((a, b) => a + b, 0);
      return total > 0 ? balances.slice(0, 5).reduce((a, b) => a + b, 0) / total : 0;
    } catch {
      return 0;
    }
  }

  async getYieldPools() {
    try {
      const [pancakeResponse, liquidityResponse] = await Promise.all([
        axios.get('https://api.pancakeswap.finance/api/v2/aptos/farms'),
        axios.get('https://api.aux.exchange/v1/liquidity/pools')
      ]);

      const pools = [];

      // PancakeSwap pools
      if (pancakeResponse.data?.farms) {
        pools.push(...pancakeResponse.data.farms.map(farm => ({
          name: `${farm.token0Symbol}-${farm.token1Symbol}`,
          apy: farm.apr,
          tvl: farm.totalLiquidity,
          rewards: farm.rewardPerSecond,
          tokens: [farm.token0Address, farm.token1Address],
          protocol: 'PancakeSwap'
        })));
      }

      // AUX pools
      if (liquidityResponse.data?.pools) {
        pools.push(...liquidityResponse.data.pools.map(pool => ({
          name: pool.name,
          apy: pool.apy,
          tvl: pool.tvl,
          rewards: pool.rewardsPerDay,
          tokens: [pool.token0, pool.token1],
          protocol: 'AUX'
        })));
      }

      return pools;
    } catch (error) {
      console.error('Yield pools error:', error);
      return [];
    }
  }

  // Method to update user settings
  updateSettings(newSettings = {}) {
    if (newSettings.maxTokens) this.maxTokens = newSettings.maxTokens;
    if (newSettings.temperature) this.temperature = newSettings.temperature;
    if (newSettings.systemPrompt) this.systemPrompt = newSettings.systemPrompt;
    
    this.settings = {
      maxTokens: this.maxTokens,
      temperature: this.temperature,
      systemPrompt: this.systemPrompt
    };
    
    return this.settings;
  }

  async calculateYieldAPR(poolAddress) {
    try {
      const [poolData, price] = await Promise.all([
        this.client.getAccountResource(poolAddress, "0x1::pool::LiquidityPool"),
        this.getPrice('aptos')
      ]);

      const apr = {
        baseAPR: parseFloat(poolData.data.apr || 0),
        rewardAPR: parseFloat(poolData.data.reward_apr || 0),
        totalAPR: 0,
        dailyRewards: 0,
        risk: 'medium'
      };

      apr.totalAPR = apr.baseAPR + apr.rewardAPR;
      apr.dailyRewards = (apr.totalAPR / 365) * price.price;

      return apr;
    } catch (error) {
      console.error('APR calculation error:', error);
      return null;
    }
  }

  async getFarmingStrategies() {
    try {
      const pools = await this.getYieldPools();
      const strategies = await Promise.all(pools.map(async pool => {
        const apr = await this.calculateYieldAPR(pool.address);
        return {
          pool: pool.name,
          strategy: apr.totalAPR > 50 ? 'High Yield' : 'Stable Yield',
          recommended_position: apr.totalAPR > 30 ? 'Enter' : 'Wait',
          estimated_daily_reward: apr.dailyRewards,
          risk_level: apr.risk,
          total_apy: apr.totalAPR
        };
      }));

      return strategies.sort((a, b) => b.total_apy - a.total_apy);
    } catch (error) {
      console.error('Strategy calculation error:', error);
      return [];
    }
  }
}

module.exports = { AptAi };
