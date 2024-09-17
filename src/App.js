import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import { Token } from '@uniswap/sdk-core';
import { computePoolAddress } from '@uniswap/v3-sdk';
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';
import Quoter from '@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json';
import './App.css';
import { performSwap } from './SwapService';
import { useAddRecentTransaction } from '@rainbow-me/rainbowkit';
import { RainbowKitProvider, darkTheme, Theme } from '@rainbow-me/rainbowkit';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Link, Routes, Route, useLocation } from 'react-router-dom';
import TestingInstructions from './testinginstructions'; 
import { TOKEN_DATA } from './token_data';
import { useQuoteInfo } from './QuoteInfo';
import { infinity } from 'ldrs';

infinity.register();

function LoadingAnimation({ onAnimationComplete }) {
  const loaderRef = useRef(null);

  useEffect(() => {
    const loader = loaderRef.current;
    if (!loader) return;

    const animationDuration = 2000; // 2 seconds total
    const startTime = Date.now();

    const animate = () => {
      const elapsedTime = Date.now() - startTime;
      const progress = Math.min(elapsedTime / animationDuration, 1);

      if (progress < 0.4) {
        // Keep stroke length at 0.15 for the first 40% of the animation
        loader.setAttribute('stroke-length', '0.15');
      } else if (progress < 0.5) {
        // Expand stroke length from 0.15 to 1 over 10% of the animation
        const strokeLength = 0.15 + (1 - 0.15) * ((progress - 0.4) / 0.1);
        loader.setAttribute('stroke-length', strokeLength.toString());
      } else if (progress < 0.6) {
        // Keep stroke length at 1 and color at white for a shorter time
        loader.setAttribute('stroke-length', '1');
        loader.setAttribute('color', 'white');
      } else if (progress < 0.7) {
        // Change color from white to the specific green over 10% of the animation
        const colorProgress = (progress - 0.6) / 0.1; // Normalize to 0-1 range
        const r = Math.round(255 - (255 - 98) * colorProgress);
        const g = Math.round(255 - (255 - 255) * colorProgress);
        const b = Math.round(108 * colorProgress);
        loader.setAttribute('color', `rgb(${r}, ${g}, ${b})`);
      } else {
        // Keep color at the specific green for the rest of the animation
        loader.setAttribute('color', 'rgb(98, 255, 108)');
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        onAnimationComplete();
      }
    };

    requestAnimationFrame(animate);
  }, [onAnimationComplete]);

  return (
    <div className="loader-container">
      <l-infinity
        ref={loaderRef}
        size="65"
        stroke="6"
        stroke-length="0.15"
        bg-opacity="0.1"
        speed="0.6" 
        color="white" 
      ></l-infinity>
    </div>
  );
}

function App() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [sellAmount, setSellAmount] = useState('');
  const [buyAmount, setBuyAmount] = useState('');
  const [calculatedBuyAmount, setCalculatedBuyAmount] = useState('');
  const [selectedSellToken, setSelectedSellToken] = useState(TOKEN_DATA['MOR']);
  const [selectedBuyToken, setSelectedBuyToken] = useState(TOKEN_DATA['WETH']);
  const [activeInput, setActiveInput] = useState('sell');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const addRecentTransaction = useAddRecentTransaction();

  const { priceInEth, ethPriceInUSD, quoteLoading, error: quoteError, fetchPrices, calculateUsdValue, calculatedPrice } = useQuoteInfo(
    selectedSellToken,
    selectedBuyToken,
    sellAmount,
    buyAmount,
    activeInput
  );

  const handleAnimationComplete = useCallback(() => {
    setInitialLoading(false);
  }, []);

  useEffect(() => {
    if (calculatedPrice && !isNaN(parseFloat(calculatedPrice))) {
      setCalculatedBuyAmount(calculatedPrice);
      setError(null);
    } else if (calculatedPrice === null) {
      setError('Failed to fetch price: Invalid price returned');
      setCalculatedBuyAmount('');
    }
  }, [calculatedPrice]);

  const handleSellInputChange = useCallback((e) => {
    const newSellAmount = e.target.value;
    setSellAmount(newSellAmount);
    setActiveInput('sell');
    if (newSellAmount && parseFloat(newSellAmount) > 0) {
      fetchPrices('sell');
    } else {
      setCalculatedBuyAmount('0');
    }
  }, [fetchPrices]);

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

  const handleSwapTokens = () => {
    setSelectedSellToken(selectedBuyToken);
    setSelectedBuyToken(selectedSellToken);
    setSellAmount(buyAmount);
    setBuyAmount(sellAmount);
    setActiveInput(activeInput === 'sell' ? 'buy' : 'sell');
  };

  const handleSwap = async () => {
    if (!address || !walletClient) {
      alert('Please connect your wallet');
      return;
    }

    try {
      setLoading(true);
      console.log(`Swapping ${sellAmount} ${selectedSellToken.symbol} for ${selectedBuyToken.symbol}`);
      const receipt = await performSwap(
        walletClient, 
        sellAmount,
        selectedSellToken.address, 
        selectedBuyToken.address
      );

      addRecentTransaction({
        hash: receipt.transactionHash,
        description: `Swap ${sellAmount} ${selectedSellToken.symbol} for ${buyAmount} ${selectedBuyToken.symbol}`,
        confirmations: 1
      });

      alert('Swap successful!');
      fetchPrices(activeInput);
    } catch (error) {
      console.error('Swap failed:', error);
      alert(`Swap failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderSwapInterface = () => (
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
              value={activeInput === 'sell' ? (parseFloat(sellAmount) > 0 ? calculatedBuyAmount : '0') : buyAmount}
              onChange={handleBuyInputChange}
              readOnly={activeInput === 'sell'}
            />
            <div className={`usd-value ${loading ? 'blur-text' : ''}`}>
              {loading ? '' : `$${calculateUsdValue(buyAmount, selectedBuyToken)}`}
            </div>
          </div>
        </div>
      </div>

      <div className="price-display">
        {loading || quoteLoading
          ? 'Loading price...'
          : error
          ? `Error: ${error}`
          : sellAmount && parseFloat(sellAmount) > 0 && calculatedBuyAmount && !isNaN(parseFloat(calculatedBuyAmount))
          ? `${sellAmount} ${selectedSellToken.symbol} = ${parseFloat(calculatedBuyAmount).toFixed(8)} ${selectedBuyToken.symbol}`
          : 'Enter an amount to see the conversion'}
      </div>

      <div className="button-container">
        <button onClick={handleSwap} disabled={!address || loading || quoteLoading}>
          {loading ? 'Swapping...' : 'Swap'}
        </button>
        <Link to="/testing-instructions" className="testing-link">
          <button className="testing-button">Testing Instructions</button>
        </Link>
      </div>
    </div>
  );

  if (initialLoading) {
    return <LoadingAnimation onAnimationComplete={handleAnimationComplete} />;
  }

  return (
    <div className="container">
      <div className="header">
        <div className="logo">
          <Link to="/">
            <button className="swap-btn">Swap</button>
          </Link>
          <button className="Projects">Projects: Coming Soon</button>
        </div>
        <div className="wallet-button">
          <ConnectButton />
        </div>
      </div>

      <Routes>
        <Route path="/" element={renderSwapInterface()} />
        <Route path="/testing-instructions" element={<TestingInstructions />} />
      </Routes>
    </div>
  );
}

export default App;
