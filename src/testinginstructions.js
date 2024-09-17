import React from 'react';
import { Link } from 'react-router-dom';
import './TestingInstructions.css';
import WrapEth from './WrapEth';
import UnwrapWeth from './UnwrapWeth';
import AddLiquidity from './AddLiquidity';
import PoolInformation from './PoolInformation';

function TestingInstructions() {
  return (
    <div className="testing-instructions">
      <h1>Testing Instructions</h1>
      <p>Welcome to the MorSwap testing page. Follow these instructions to test the swap functionality:</p>
      <ul>
        <li>Thank you so much for testing. Please note that this is testing site, I have done everything I can to make sure 
            you are unable to connect to any Main networks. Please take a moment to ensure you are using the Arbitrum Sepolia network.
            You can check this by clicking the network name on MetaMask. And although this is a testing site, please be aware that
            there are still risks involved with loss of testnet funds. <b>*Please double check every transaction through metamask and the browser console*</b>.

        </li>
        <li>Connect your wallet using the "Connect Wallet" button on the top right corner.</li>
        <li>Ensure you have some testnet (MOR, ETH) in your wallet. If you don't, saMOR can be found at <a href="https://morfaucet.xyz/" target="_blank" rel="noreferrer noopener"> MorFaucet.xyz </a>  and saETH can 
        be found at <a href="https://faucets.chain.link/sepolia" target="_blank" rel="noreferrer noopener"> faucets.chain.link/sepolia </a> This is my favorite faucet.</li>
        <li> <b>Before you Swap:</b> For right now, you must first wrap your ETH into the mockWETH that I created. You can do this with the buttons <b>Wrap</b> and <b>Unwrap</b> below. This will Wrap/Unwrap any desired amount of ETH/WETH at a time, Uniswap does take care of this though Multi-Hop Swaps which I plan to incorporate very soon. The address for my mockWETH is <b>0x9F220B916edDcD745F9547f2D5cd5D06F40d1B6E</b> Please add this token to your wallet</li>
        <li><b>Please be aware due to a lack of funds the pool has very low liquidity, so please try and swap small amounts such as 0.0001 MOR and 0.000001 WETH</b>. Alternitively if you would like to donate some funds to the pool After wrapping some ETH below, you can do so by clicking add Liqudity. This will add a fixed 1000 MOR to 1 WETH ratio to the pool </li> 
        <li>Enter the amount you want to swap Within the Top input field.</li> 
        <li>Click the "Swap" button to execute the swap.</li>
        <li>Review the transaction and Sign.</li>
        <li>Confirm the transaction in your wallet.</li>
        <li>Wait for the transaction to be processed and check your wallet for the swapped tokens.</li>
      </ul>
      <p>If you encounter any issues or have questions, please do so through Github</p>
      
      <div className="token-tools">
        <WrapEth />
        <UnwrapWeth />
        <AddLiquidity />
      </div>
      
      <Link to="/" className="back-to-swap">Back to Swap</Link>
      <PoolInformation />
      
    </div>
  );
}

export default TestingInstructions;