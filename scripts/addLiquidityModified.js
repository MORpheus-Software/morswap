const { ethers } = require("hardhat");

async function main() {
  try {
    const [deployer] = await ethers.getSigners();
    console.log("Adding liquidity with the account:", deployer.address);

    const nonfungiblePositionManagerAddress = "0x6b2937Bde17889EDCf8fbD8dE31C3C2a70Bc4d65";
    const positionManager = await ethers.getContractAt("INonfungiblePositionManager", nonfungiblePositionManagerAddress);

    const wethAddress = "0xb6c322FA3D8e0A60AfEB17512905eb2229CE7dA5";
    const morAddress = "0xc1664f994Fd3991f98aE944bC16B9aED673eF5fD";
    const poolFee = 3000; // 0.3%

    // Check token balances
    const weth = await ethers.getContractAt("IERC20", wethAddress);
    const mor = await ethers.getContractAt("IERC20", morAddress);
    const wethBalance = await weth.balanceOf(deployer.address);
    const morBalance = await mor.balanceOf(deployer.address);
    console.log("WETH balance:", ethers.utils.formatUnits(wethBalance, 18));
    console.log("MOR balance:", ethers.utils.formatUnits(morBalance, 18));

    // Check if pool exists
    const factoryAddress = "0xD27889D6a7d1B7646e45BA92907228Ef706bda3A";
    const factory = await ethers.getContractAt("IUniswapV3Factory", factoryAddress);
    const poolAddress = await factory.getPool(wethAddress, morAddress, poolFee);
    console.log("Pool address:", poolAddress);

    // Get current pool state
    const poolAbi = [
      "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
      "function token0() external view returns (address)",
      "function token1() external view returns (address)"
    ];
    const pool = new ethers.Contract(poolAddress, poolAbi, deployer);
    const { sqrtPriceX96, tick } = await pool.slot0();
    console.log("Current tick:", tick);

    const token0Address = await pool.token0();
    const price = (sqrtPriceX96 * sqrtPriceX96 * (10**18) / (2**192)).toString();
    console.log(`Current price: ${price} ${token0Address === wethAddress ? "MOR per WETH" : "WETH per MOR"}`);

    // Adjust the tick range based on the current tick
    const tickSpacing = 60;
    const tickLower = Math.floor(tick / tickSpacing) * tickSpacing - (tickSpacing * 100);
    const tickUpper = Math.ceil(tick / tickSpacing) * tickSpacing + (tickSpacing * 100);
    console.log("Using tick range:", tickLower, "-", tickUpper);

    // Calculate amounts based on the current price
    const wethToAdd = ethers.utils.parseUnits("0.01", 18); // 0.01 WETH
    const priceAdjusted = ethers.BigNumber.from(Math.floor(parseFloat(price) * 1e18).toString());
    const morToAdd = wethToAdd.mul(priceAdjusted).div(ethers.constants.WeiPerEther);

    console.log("WETH to add:", ethers.utils.formatUnits(wethToAdd, 18));
    console.log("MOR to add:", ethers.utils.formatUnits(morToAdd, 18));

    console.log("Approving tokens for transfer...");
    await weth.approve(nonfungiblePositionManagerAddress, ethers.constants.MaxUint256);
    await mor.approve(nonfungiblePositionManagerAddress, ethers.constants.MaxUint256);
    console.log("Tokens approved with maximum allowance.");

    const mintParams = {
      token0: wethAddress,
      token1: morAddress,
      fee: poolFee,
      tickLower: tickLower,
      tickUpper: tickUpper,
      amount0Desired: wethToAdd,
      amount1Desired: morToAdd,
      amount0Min: 0,
      amount1Min: 0,
      recipient: deployer.address,
      deadline: Math.floor(Date.now() / 1000) + 60 * 20
    };

    console.log("Mint params:", JSON.stringify(mintParams, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    , 2));

    console.log("Adding liquidity...");
    const tx = await positionManager.mint(mintParams, { gasLimit: 10000000 });
    console.log("Transaction sent. Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log("Liquidity added successfully. Transaction hash:", receipt.transactionHash);
    
    for (const event of receipt.events) {
      console.log("Event:", event.event);
      if (event.args) {
        console.log("Event args:", event.args.map(arg => arg.toString()));
      }
    }
  } catch (error) {
    console.error("An error occurred:", error);
    if (error.reason) console.error("Error reason:", error.reason);
    if (error.code) console.error("Error code:", error.code);
    if (error.argument) console.error("Error argument:", error.argument);
    if (error.value) console.error("Error value:", error.value);
    if (error.transaction) console.error("Error transaction:", error.transaction);
    if (error.receipt) console.error("Error receipt:", error.receipt);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });