import React, { useState } from 'react';
import { ethers } from 'ethers';
import './PoolInformation.css';

const POOL_ADDRESS = "0x4701D0A787dcE3b9A63e4a9AA00d94AFEA2d7ec5";
const POOL_ABI = [
  "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
  "function liquidity() external view returns (uint128)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
  "function fee() external view returns (uint24)",
  "function tickSpacing() external view returns (int24)",
  "function maxLiquidityPerTick() external view returns (uint128)",
  "function feeGrowthGlobal0X128() external view returns (uint256)",
  "function feeGrowthGlobal1X128() external view returns (uint256)",
  "function protocolFees() external view returns (uint128 token0, uint128 token1)",
  "function ticks(int24 tick) external view returns (uint128 liquidityGross, int128 liquidityNet, uint256 feeGrowthOutside0X128, uint256 feeGrowthOutside1X128, int56 tickCumulativeOutside, uint160 secondsPerLiquidityOutsideX128, uint32 secondsOutside, bool initialized)"
];

function PoolInformation() {
  const [poolInfo, setPoolInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const fetchPoolInfo = async () => {
    setIsLoading(true);
    setError('');
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const pool = new ethers.Contract(POOL_ADDRESS, POOL_ABI, provider);
      
      const [slot0, liquidity, token0, token1, fee, tickSpacing, maxLiquidityPerTick, feeGrowthGlobal0X128, feeGrowthGlobal1X128, protocolFees] = await Promise.all([
        pool.slot0(),
        pool.liquidity(),
        pool.token0(),
        pool.token1(),
        pool.fee(),
        pool.tickSpacing(),
        pool.maxLiquidityPerTick(),
        pool.feeGrowthGlobal0X128(),
        pool.feeGrowthGlobal1X128(),
        pool.protocolFees()
      ]);

      const sqrtPriceX96 = slot0.sqrtPriceX96;
      const price = (sqrtPriceX96.pow(2).mul(ethers.BigNumber.from(10).pow(18)).div(ethers.BigNumber.from(2).pow(192))).toString() / 1e18;

      // Fetch tick information
      const tickInfo = await pool.ticks(slot0.tick);

      setPoolInfo({
        address: POOL_ADDRESS,
        currentTick: slot0.tick.toString(),
        sqrtPriceX96: sqrtPriceX96.toString(),
        liquidity: liquidity.toString(),
        token0: token0,
        token1: token1,
        fee: fee.toString(),
        tickSpacing: tickSpacing.toString(),
        maxLiquidityPerTick: maxLiquidityPerTick.toString(),
        feeGrowthGlobal0X128: feeGrowthGlobal0X128.toString(),
        feeGrowthGlobal1X128: feeGrowthGlobal1X128.toString(),
        protocolFees: {
          token0: protocolFees.token0.toString(),
          token1: protocolFees.token1.toString()
        },
        price: price.toFixed(6),
        observationIndex: slot0.observationIndex.toString(),
        observationCardinality: slot0.observationCardinality.toString(),
        observationCardinalityNext: slot0.observationCardinalityNext.toString(),
        feeProtocol: slot0.feeProtocol.toString(),
        unlocked: slot0.unlocked,
        tickInfo: {
          liquidityGross: tickInfo.liquidityGross.toString(),
          liquidityNet: tickInfo.liquidityNet.toString(),
          feeGrowthOutside0X128: tickInfo.feeGrowthOutside0X128.toString(),
          feeGrowthOutside1X128: tickInfo.feeGrowthOutside1X128.toString(),
          tickCumulativeOutside: tickInfo.tickCumulativeOutside.toString(),
          secondsPerLiquidityOutsideX128: tickInfo.secondsPerLiquidityOutsideX128.toString(),
          secondsOutside: tickInfo.secondsOutside.toString(),
          initialized: tickInfo.initialized
        }
      });
    } catch (err) {
      console.error("Error fetching pool info:", err);
      setError("Failed to fetch pool information");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDropdown = () => {
    if (!isOpen && !poolInfo) {
      fetchPoolInfo();
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="pool-information">
      <button onClick={toggleDropdown}>
        {isOpen ? 'Hide Pool Information' : 'Show Pool Information'}
      </button>
      {isOpen && (
        <div className="dropdown-content">
          {isLoading && <p>Loading pool information...</p>}
          {error && <p className="error">{error}</p>}
          {poolInfo && (
            <div>
              <h3>Pool Information</h3>
              <p>Pool Address: <span className="value">{poolInfo.address}</span></p>
              <p>Current Tick: <span className="value">{poolInfo.currentTick}</span></p>
              <p>Sqrt Price X96: <span className="value">{poolInfo.sqrtPriceX96}</span></p>
              <p>Liquidity: <span className="value">{poolInfo.liquidity}</span></p>
              <p>Token0 (WETH): <span className="value">{poolInfo.token0}</span></p>
              <p>Token1 (MOR): <span className="value">{poolInfo.token1}</span></p>
              <p>Fee: <span className="value">{poolInfo.fee}</span></p>
              <p>Tick Spacing: <span className="value">{poolInfo.tickSpacing}</span></p>
              <p>Max Liquidity Per Tick: <span className="value">{poolInfo.maxLiquidityPerTick}</span></p>
              <p>Fee Growth Global 0 X128: <span className="value">{poolInfo.feeGrowthGlobal0X128}</span></p>
              <p>Fee Growth Global 1 X128: <span className="value">{poolInfo.feeGrowthGlobal1X128}</span></p>
              <p>Protocol Fees Token0: <span className="value">{poolInfo.protocolFees.token0}</span></p>
              <p>Protocol Fees Token1: <span className="value">{poolInfo.protocolFees.token1}</span></p>
              <p>Current Price: <span className="value">{poolInfo.price}</span> MOR per WETH</p>
              <p>Observation Index: <span className="value">{poolInfo.observationIndex}</span></p>
              <p>Observation Cardinality: <span className="value">{poolInfo.observationCardinality}</span></p>
              <p>Observation Cardinality Next: <span className="value">{poolInfo.observationCardinalityNext}</span></p>
              <p>Fee Protocol: <span className="value">{poolInfo.feeProtocol}</span></p>
              <p>Unlocked: <span className="value">{poolInfo.unlocked.toString()}</span></p>
              <h4>Current Tick Information</h4>
              <p>Liquidity Gross: <span className="value">{poolInfo.tickInfo.liquidityGross}</span></p>
              <p>Liquidity Net: <span className="value">{poolInfo.tickInfo.liquidityNet}</span></p>
              <p>Fee Growth Outside 0 X128: <span className="value">{poolInfo.tickInfo.feeGrowthOutside0X128}</span></p>
              <p>Fee Growth Outside 1 X128: <span className="value">{poolInfo.tickInfo.feeGrowthOutside1X128}</span></p>
              <p>Tick Cumulative Outside: <span className="value">{poolInfo.tickInfo.tickCumulativeOutside}</span></p>
              <p>Seconds Per Liquidity Outside X128: <span className="value">{poolInfo.tickInfo.secondsPerLiquidityOutsideX128}</span></p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PoolInformation;