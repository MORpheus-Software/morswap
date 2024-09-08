import React, { useState } from 'react';
import { ethers } from 'ethers';

const MOR_ADDRESS = "0xc1664f994Fd3991f98aE944bC16B9aED673eF5fD";
const WETH_ADDRESS = "0x9F220B916edDcD745F9547f2D5cd5D06F40d1B6E";
const POOL_ADDRESS = "0x4701D0A787dcE3b9A63e4a9AA00d94AFEA2d7ec5";
const NONFUNGIBLE_POSITION_MANAGER_ADDRESS = "0x6b2937Bde17889EDCf8fbD8dE31C3C2a70Bc4d65";

const ERC20_ABI = ["function approve(address spender, uint256 amount) public returns (bool)", "function balanceOf(address account) public view returns (uint256)"];
const POOL_ABI = ["function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)"];
const NONFUNGIBLE_POSITION_MANAGER_ABI = ["function mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256)) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)"];

function AddLiquidity() {
  const [wethAmount, setWethAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAddLiquidity = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!window.ethereum) throw new Error("No crypto wallet found. Please install it.");

      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const weth = new ethers.Contract(WETH_ADDRESS, ERC20_ABI, signer);
      const mor = new ethers.Contract(MOR_ADDRESS, ERC20_ABI, signer);
      const pool = new ethers.Contract(POOL_ADDRESS, POOL_ABI, signer);
      const nonfungiblePositionManager = new ethers.Contract(NONFUNGIBLE_POSITION_MANAGER_ADDRESS, NONFUNGIBLE_POSITION_MANAGER_ABI, signer);

      const wethAmountWei = ethers.utils.parseEther(wethAmount);
      const morAmountWei = wethAmountWei.mul(1000);

      // Check balances
      const wethBalance = await weth.balanceOf(await signer.getAddress());
      const morBalance = await mor.balanceOf(await signer.getAddress());

      if (wethBalance.lt(wethAmountWei) || morBalance.lt(morAmountWei)) {
        throw new Error("Insufficient balance for one or both tokens");
      }

      // Approve tokens
      await weth.approve(NONFUNGIBLE_POSITION_MANAGER_ADDRESS, wethAmountWei);
      await mor.approve(NONFUNGIBLE_POSITION_MANAGER_ADDRESS, morAmountWei);

      // Prepare mint parameters
      const mintParams = {
        token0: WETH_ADDRESS,
        token1: MOR_ADDRESS,
        fee: 3000, // 0.3%
        tickLower: -887220,
        tickUpper: 887220,
        amount0Desired: wethAmountWei,
        amount1Desired: morAmountWei,
        amount0Min: 0,
        amount1Min: 0,
        recipient: await signer.getAddress(),
        deadline: Math.floor(Date.now() / 1000) + 60 * 10 // 10 minutes from now
      };

      // Mint new position
      const mintTx = await nonfungiblePositionManager.mint(mintParams);
      const receipt = await mintTx.wait();

      setSuccess(`Liquidity added successfully. Transaction hash: ${receipt.transactionHash}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-liquidity">
      <h2>Add Liquidity (1 WETH : 1000 MOR)</h2>
      <input
        type="number"
        value={wethAmount}
        onChange={(e) => setWethAmount(e.target.value)}
        placeholder="Amount of WETH to add"
      />
      <p>You will add {wethAmount || 0} WETH and {(parseFloat(wethAmount) * 1000) || 0} MOR</p>
      <button onClick={handleAddLiquidity} disabled={loading || !wethAmount}>
        {loading ? 'Adding Liquidity...' : 'Add Liquidity'}
      </button>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
    </div>
  );
}

export default AddLiquidity;