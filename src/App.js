import React, { useState, useEffect } from 'react';
import { ethers, Contract } from 'ethers';
import { Token } from '@uniswap/sdk-core';
import { computePoolAddress } from '@uniswap/v3-sdk';
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';
import Quoter from '@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json';
import './App.css';

import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider, ConnectButton, darkTheme } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createConfig, WagmiConfig } from 'wagmi';
import { mainnet, arbitrum } from 'wagmi/chains';
import { createPublicClient, http } from 'viem';

import { TOKEN_DATA } from './token_data'; // Import the token data

const chains = [mainnet, arbitrum];
const publicClient = createPublicClient({
  chain: arbitrum,
  transport: http(),
});

const config = getDefaultConfig({
  appName: 'MorSwap',
  projectId: 'YOUR_WALLET_CONNECT_PROJECT_ID',
  chains,
  publicClient,
});

const queryClient = new QueryClient();

function App() {
  const [sellAmount, setSellAmount] = useState('');
  const [buyAmount, setBuyAmount] = useState('');
  const [priceInEth, setPriceInEth] = useState(null);
  const [ethPriceInUSD, setEthPriceInUSD] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [selectedSellToken, setSelectedSellToken] = useState(TOKEN_DATA['MOR']); // MOR by default
  const [selectedBuyToken, setSelectedBuyToken] = useState(TOKEN_DATA['WETH']); // WETH by default
  const [activeInput, setActiveInput] = useState('sell');

  const provider = new ethers.providers.JsonRpcProvider('https://arb1.arbitrum.io/rpc');
  const QUOTE_CONTRACT_ADDRESS = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6';

  useEffect(() => {
    fetchEthPriceInUSD();
  }, [selectedBuyToken]);

  useEffect(() => {
    if (activeInput === 'sell' && sellAmount) {
      fetchPrices('sell');
    } else if (activeInput === 'buy' && buyAmount) {
      fetchPrices('buy');
    }
  }, [sellAmount, buyAmount, selectedSellToken, selectedBuyToken, activeInput]);

  const fetchEthPriceInUSD = async () => {
    try {
      const usdcToken = new Token(42161, TOKEN_DATA['USDC'].address, TOKEN_DATA['USDC'].decimals, 'USDC', 'USD Coin');
      const ethToken = new Token(42161, selectedBuyToken.address, selectedBuyToken.decimals, selectedBuyToken.symbol, 'Wrapped Ether');

      const poolAddress = computePoolAddress({
        factoryAddress: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
        tokenA: usdcToken,
        tokenB: ethToken,
        fee: 3000,
      });

      const quoterContract = new Contract(QUOTE_CONTRACT_ADDRESS, Quoter.abi, provider);
      const quotedAmountOut = await quoterContract.callStatic.quoteExactInputSingle(
        ethToken.address,
        usdcToken.address,
        3000,
        ethers.utils.parseUnits('1', ethToken.decimals),
        0
      );

      const ethToUsdPrice = parseFloat(ethers.utils.formatUnits(quotedAmountOut, usdcToken.decimals));
      setEthPriceInUSD(ethToUsdPrice);
    } catch (error) {
      console.error('Error fetching ETH price in USD:', error);
    }
  };

  const fetchPrices = async (direction) => {
    setLoading(true);
  
    try {
      const sellToken = new Token(42161, selectedSellToken.address, selectedSellToken.decimals, selectedSellToken.symbol, `${selectedSellToken.symbol} Token`);
      const buyToken = new Token(42161, selectedBuyToken.address, selectedBuyToken.decimals, selectedBuyToken.symbol, `${selectedBuyToken.symbol} Token`);
  
      const quoterContract = new Contract(QUOTE_CONTRACT_ADDRESS, Quoter.abi, provider);
      
      let quotedAmountOut;
      if (direction === 'sell') {
        const parsedSellAmount = ethers.utils.parseUnits(sellAmount || '1', sellToken.decimals);
        quotedAmountOut = await quoterContract.callStatic.quoteExactInputSingle(
          sellToken.address,
          buyToken.address,
          3000,
          parsedSellAmount,
          0
        );
        const price = parseFloat(ethers.utils.formatUnits(quotedAmountOut, buyToken.decimals));
        setPriceInEth(isNaN(price) || price === 0 ? 0 : price);
        setBuyAmount(price.toFixed(6));
      } else {
        const parsedBuyAmount = ethers.utils.parseUnits(buyAmount || '1', buyToken.decimals);
        quotedAmountOut = await quoterContract.callStatic.quoteExactOutputSingle(
          sellToken.address,
          buyToken.address,
          3000,
          parsedBuyAmount,
          ethers.constants.MaxUint256
        );
        const price = parseFloat(ethers.utils.formatUnits(quotedAmountOut, sellToken.decimals));
        setPriceInEth(isNaN(price) || price === 0 ? 0 : 1 / price);
        setSellAmount(price.toFixed(6));
      }
  
    } catch (error) {
      console.error('Error fetching price:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSellInputChange = (e) => {
    setSellAmount(e.target.value);
    setActiveInput('sell');
  };

  const handleBuyInputChange = (e) => {
    setBuyAmount(e.target.value);
    setActiveInput('buy');
  };

  const handleTokenChange = (e, type) => {
    const tokenSymbol = e.target.value;
    const tokenData = TOKEN_DATA[tokenSymbol];

    if (type === 'sell') {
      setSelectedSellToken(tokenData);
    } else {
      setSelectedBuyToken(tokenData);
    }
  };

  const calculateUsdValue = (amount, token) => {
    if (!priceInEth || !ethPriceInUSD) return '0.00';
  
    let tokenPriceInUsd;
  
    if (token.symbol === 'USDC') {
      // If selling USDC, the USD value is just the sell amount
      tokenPriceInUsd = 1; // 1 USDC = 1 USD
    } else if (token.symbol === 'WETH') {
      // If selling WETH, the USD value is sellAmount * ethPriceInUSD
      tokenPriceInUsd = ethPriceInUSD;
    } else {
      // For other tokens, convert the token price in ETH to USD
      tokenPriceInUsd = priceInEth * ethPriceInUSD;
    }
  
    return (amount * tokenPriceInUsd).toFixed(2);
  };
  

  const handleSwapTokens = () => {
    setSelectedSellToken(selectedBuyToken);
    setSelectedBuyToken(selectedSellToken);
    setSellAmount(buyAmount);
    setBuyAmount(sellAmount);
    setActiveInput(activeInput === 'sell' ? 'buy' : 'sell');
    setTimeout(() => {
      fetchPrices(activeInput === 'sell' ? 'buy' : 'sell');
    }, 0);
  };

  return (
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#387a3a', // Green accent color to match swap button
            accentColorForeground: 'white', // White text
            borderRadius: 'small',
            fontStack: 'system',
          })}
          modalSize="compact" // Compact modal size
        >
          <div className="container">
            <div className="header">
              <div className="logo">
                <button className="swap-btn">Swap</button>
                <button className="Projects">Projects: Coming Soon</button>
              </div>
              <div className="wallet-button">
                <ConnectButton />
              </div>
            </div>

            <div className="swap-container">
              <h1>MorSwap.org</h1>

              <div className="swap-section">
                <div className="input-label">Sell</div>
                <div className="swap-box">
                  <div className="token-selector">
                    <select 
                      id="sellToken" 
                      value={selectedSellToken.symbol}
                      onChange={(e) => handleTokenChange(e, 'sell')}
                    >
                      {Object.keys(TOKEN_DATA).map((tokenSymbol) => (
                        <option key={tokenSymbol} value={tokenSymbol}>
                          {TOKEN_DATA[tokenSymbol].symbol}
                        </option>
                      ))}
                    </select>
                    <span>Balance: 0.00</span>
                  </div>
                  <div className="input-container">
                    <input
                      type="number"
                      id="sellAmount"
                      placeholder="0"
                      value={sellAmount}
                      onChange={handleSellInputChange}
                    />
                    <div className={`usd-value ${loading ? 'blur-text' : ''}`}>
                      {loading ? '' : `$${calculateUsdValue(sellAmount, selectedSellToken)}`}
                    </div>
                  </div>
                </div>
              </div>

              <button className="swap-tokens-button" onClick={handleSwapTokens}>
                &#8645;
              </button>

              <div className="swap-section">
                <div className="input-label">Buy</div>
                <div className="swap-box">
                  <div className="token-selector">
                    <select 
                      id="buyToken" 
                      value={selectedBuyToken.symbol}
                      onChange={(e) => handleTokenChange(e, 'buy')}
                    >
                      {Object.keys(TOKEN_DATA).map((tokenSymbol) => (
                        <option key={tokenSymbol} value={tokenSymbol}>
                          {TOKEN_DATA[tokenSymbol].symbol}
                        </option>
                      ))}
                    </select>
                    <span>Balance: 0.00</span>
                  </div>
                  <div className="input-container">
                    <input
                      type="number"
                      id="buyAmount"
                      placeholder="0"
                      value={buyAmount}
                      onChange={handleBuyInputChange}
                    />
                    <div className={`usd-value ${loading ? 'blur-text' : ''}`}>
                      {loading ? '' : `$${calculateUsdValue(buyAmount, selectedBuyToken)}`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Below price display */}
              <div className="price-display">
                {loading
                  ? 'Loading price...'
                  : `1 ${selectedSellToken.symbol} = ${priceInEth ? parseFloat(priceInEth).toFixed(6) : 'N/A'} ${selectedBuyToken.symbol}`}
              </div>

              <button className="swap-main-button">Swap</button>
            </div>
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiConfig>
  );
}

export default App;
