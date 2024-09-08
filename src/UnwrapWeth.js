import React, { useState } from 'react';
import { ethers } from 'ethers';

const WETH_MOCK_ADDRESS = "0x9F220B916edDcD745F9547f2D5cd5D06F40d1B6E";
const WETH_MOCK_ABI = [
  "function withdraw(uint256 wad)",
  "function balanceOf(address account) view returns (uint256)"
];

function UnwrapWeth() {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleUnwrap = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!window.ethereum) throw new Error("No crypto wallet found. Please install it.");

      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const wethMock = new ethers.Contract(WETH_MOCK_ADDRESS, WETH_MOCK_ABI, signer);

      const wethBalance = await wethMock.balanceOf(await signer.getAddress());
      const amountToUnwrap = ethers.utils.parseEther(amount);

      if (wethBalance.lt(amountToUnwrap)) {
        throw new Error(`Insufficient WETH balance. You only have ${ethers.utils.formatEther(wethBalance)} WETH.`);
      }

      const tx = await wethMock.withdraw(amountToUnwrap);
      await tx.wait();

      const newWethBalance = await wethMock.balanceOf(await signer.getAddress());
      const ethBalance = await provider.getBalance(await signer.getAddress());

      setSuccess(`Successfully unwrapped ${amount} WETH. New WETH balance: ${ethers.utils.formatEther(newWethBalance)} WETH, ETH balance: ${ethers.utils.formatEther(ethBalance)} ETH`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="unwrap-weth">
      <h2>Unwrap WETH to ETH</h2>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount of WETH to unwrap"
      />
      <button onClick={handleUnwrap} disabled={loading || !amount}>
        {loading ? 'Unwrapping...' : 'Unwrap WETH'}
      </button>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
    </div>
  );
}

export default UnwrapWeth;