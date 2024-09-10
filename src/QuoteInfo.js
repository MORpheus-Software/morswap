import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { Token } from '@uniswap/sdk-core';
import { computePoolAddress } from '@uniswap/v3-sdk';
import QuoterV2 from '@uniswap/swap-router-contracts/artifacts/contracts/lens/QuoterV2.sol/QuoterV2.json';
import { TOKEN_DATA } from './token_data';
import { debounce } from 'lodash';

const QUOTE_CONTRACT_ADDRESS = '0x2779a0CC1c3e0E44D2542EC3e79e3864Ae93Ef0B';

export function useQuoteInfo(selectedSellToken, selectedBuyToken, sellAmount, buyAmount, activeInput) {
  const [priceInEth, setPriceInEth] = useState(null);
  const [ethPriceInUSD, setEthPriceInUSD] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [calculatedPrice, setCalculatedPrice] = useState(null);

  const fetchPrices = useCallback(async (direction) => {
    setLoading(true);
    setError(null);

    // Check if the sell amount is zero or very close to zero
    if (direction === 'sell' && (parseFloat(sellAmount) === 0 || parseFloat(sellAmount) < 1e-8)) {
      setCalculatedPrice('0');
      setLoading(false);
      return '0';
    }

    try {
      const provider = new ethers.providers.JsonRpcProvider('https://sepolia-rollup.arbitrum.io/rpc');
      const sellToken = new Token(42161, selectedSellToken.address, selectedSellToken.decimals, selectedSellToken.symbol, `${selectedSellToken.symbol} Token`);
      const buyToken = new Token(42161, selectedBuyToken.address, selectedBuyToken.decimals, selectedBuyToken.symbol, `${selectedBuyToken.symbol} Token`);

      console.log('Sell Token:', sellToken);
      console.log('Buy Token:', buyToken);

      const quoterContract = new ethers.Contract(QUOTE_CONTRACT_ADDRESS, QuoterV2.abi, provider);
      console.log('Quoter Contract Address:', QUOTE_CONTRACT_ADDRESS);
      
      if (direction === 'sell') {
        const parsedSellAmount = ethers.utils.parseUnits(sellAmount || '1', sellToken.decimals);
        console.log('Parsed Sell Amount:', parsedSellAmount.toString());
        
        const params = {
          tokenIn: sellToken.address,
          tokenOut: buyToken.address,
          fee: 3000,
          amountIn: parsedSellAmount,
          sqrtPriceLimitX96: 0
        };
        console.log('Quote Params:', params);

        try {
          const quotedAmountOut = await quoterContract.callStatic.quoteExactInputSingle(params);
          console.log('Quoted Amount Out:', quotedAmountOut.toString());

          const price = ethers.utils.formatUnits(quotedAmountOut.amountOut, buyToken.decimals);
          const roundedPrice = parseFloat(price).toFixed(8); // Round to 8 decimal places
          console.log('Calculated Price in QuoteInfo:', roundedPrice);
          setPriceInEth(parseFloat(roundedPrice));
          setCalculatedPrice(roundedPrice);
          return roundedPrice;
        } catch (quoteError) {
          console.error('Quote Error:', quoteError);
          setError(`Quote Error: ${quoteError.message}`);
          return null;
        }
      } else {
        // Handle 'buy' direction if needed
      }
    } catch (error) {
      console.error('Error fetching price:', error);
      setError(`Error fetching price: ${error.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [selectedSellToken, selectedBuyToken, sellAmount, buyAmount]);

  const debouncedFetchPrices = useCallback(
    debounce((direction) => fetchPrices(direction), 500),
    [fetchPrices]
  );

  useEffect(() => {
    if (activeInput === 'sell' && sellAmount) {
      debouncedFetchPrices('sell');
    } else if (activeInput === 'buy' && buyAmount) {
      debouncedFetchPrices('buy');
    }
  }, [sellAmount, buyAmount, selectedSellToken, selectedBuyToken, activeInput, debouncedFetchPrices]);

  const calculateUsdValue = useCallback((amount, token) => {
    if (!priceInEth || !ethPriceInUSD) return '0.00';
    const valueInEth = parseFloat(amount) * priceInEth;
    return (valueInEth * ethPriceInUSD).toFixed(2);
  }, [priceInEth, ethPriceInUSD]);

  return { priceInEth, ethPriceInUSD, loading, error, fetchPrices: debouncedFetchPrices, calculateUsdValue, calculatedPrice };
}
