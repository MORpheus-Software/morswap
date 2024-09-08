import React, { useState } from 'react';
import { ethers } from 'ethers';

const WETH_MOCK_ADDRESS = "0x9F220B916edDcD745F9547f2D5cd5D06F40d1B6E";
const WETH_MOCK_ABI = [
  "function deposit() payable",
  "function balanceOf(address account) view returns (uint256)"
];

function WrapEth() {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleWrap = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!window.ethereum) throw new Error("No crypto wallet found. Please install it.");

      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const wethMock = new ethers.Contract(WETH_MOCK_ADDRESS, WETH_MOCK_ABI, signer);

      const tx = await wethMock.deposit({ value: ethers.utils.parseEther(amount) });
      await tx.wait();

      const wethBalance = await wethMock.balanceOf(await signer.getAddress());
      setSuccess(`Successfully wrapped ${amount} ETH. New WETH balance: ${ethers.utils.formatEther(wethBalance)} WETH`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wrap-eth">
      <h2>Wrap ETH to WETH</h2>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount of ETH to wrap"
      />
      <button onClick={handleWrap} disabled={loading || !amount}>
        {loading ? 'Wrapping...' : 'Wrap ETH'}
      </button>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
    </div>
  );
}

export default WrapEth;