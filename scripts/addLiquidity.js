const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();

  // Contract addresses
  const morAddress = "0xc1664f994Fd3991f98aE944bC16B9aED673eF5fD";
  const wethAddress = "0x9F220B916edDcD745F9547f2D5cd5D06F40d1B6E";
  const poolAddress = "0x4701D0A787dcE3b9A63e4a9AA00d94AFEA2d7ec5";
  const nonfungiblePositionManagerAddress = "0x6b2937Bde17889EDCf8fbD8dE31C3C2a70Bc4d65";

  console.log("MOR address:", morAddress);
  console.log("WETH address:", wethAddress);
  console.log("Pool address:", poolAddress);
  console.log("NonfungiblePositionManager address:", nonfungiblePositionManagerAddress);

  // Connect to contracts
  const mor = await ethers.getContractAt("IERC20", morAddress);
  const weth = await ethers.getContractAt("IERC20", wethAddress);
  const pool = await ethers.getContractAt("IUniswapV3Pool", poolAddress);
  const nonfungiblePositionManager = await ethers.getContractAt("INonfungiblePositionManager", nonfungiblePositionManagerAddress);

  // Check if pool is initialized
  const slot0 = await pool.slot0();
  if (slot0.sqrtPriceX96.eq(0)) {
    console.log("Pool not initialized. Initializing...");
    const price = 1000; // 1 WETH = 1000 MOR
    const sqrtPriceX96 = ethers.BigNumber.from(2).pow(96).mul(Math.floor(Math.sqrt(price) * 2**32)).div(2**32);
    console.log("Initializing with sqrtPriceX96:", sqrtPriceX96.toString());
    const initializeTx = await pool.initialize(sqrtPriceX96);
    await initializeTx.wait();
    console.log("Pool initialized. Transaction hash:", initializeTx.hash);
  } else {
    console.log("Pool already initialized");
  }

  // Specify amounts to add as liquidity
  const wethAmount = ethers.utils.parseEther("0.01");  // 0.01 WETH
  const morAmount = ethers.utils.parseEther("1");  // 1 MOR

  console.log("Adding liquidity:");
  console.log("WETH amount:", ethers.utils.formatEther(wethAmount), "WETH");
  console.log("MOR amount:", ethers.utils.formatEther(morAmount), "MOR");

  // Check balances
  const wethBalance = await weth.balanceOf(signer.address);
  const morBalance = await mor.balanceOf(signer.address);
  console.log("WETH balance:", ethers.utils.formatEther(wethBalance), "WETH");
  console.log("MOR balance:", ethers.utils.formatEther(morBalance), "MOR");

  if (wethBalance.lt(wethAmount) || morBalance.lt(morAmount)) {
    throw new Error("Insufficient balance for one or both tokens");
  }

  // Approve tokens
  console.log("Approving tokens...");
  await weth.approve(nonfungiblePositionManager.address, wethAmount);
  await mor.approve(nonfungiblePositionManager.address, morAmount);

  // Prepare mint parameters
  const mintParams = {
    token0: wethAddress,
    token1: morAddress,
    fee: 3000, // 0.3%
    tickLower: -887220,  // Represents a price range of about -90% from the current price
    tickUpper: 887220,   // Represents a price range of about +900% from the current price
    amount0Desired: wethAmount,
    amount1Desired: morAmount,
    amount0Min: 0,
    amount1Min: 0,
    recipient: signer.address,
    deadline: Math.floor(Date.now() / 1000) + 60 * 10 // 10 minutes from now
  };

  console.log("Adding liquidity with parameters:", mintParams);

  try {
    // Mint new position
    const mintTx = await nonfungiblePositionManager.mint(mintParams);
    console.log("Transaction sent. Waiting for confirmation...");
    const receipt = await mintTx.wait();
    console.log("Liquidity added. Transaction hash:", receipt.transactionHash);

    // Find the Transfer event in the receipt to get the tokenId
    const transferEvent = receipt.events.find(event => event.event === 'Transfer');
    const tokenId = transferEvent.args.tokenId;
    console.log("Minted NFT token ID:", tokenId.toString());

    // Get position information
    const position = await nonfungiblePositionManager.positions(tokenId);
    console.log("Position liquidity:", position.liquidity.toString());
  } catch (error) {
    console.error("Error adding liquidity:", error);
    if (error.error && error.error.message) {
      console.error("Detailed error:", error.error.message);
    }
  }

  // Check new pool state
  const liquidity = await pool.liquidity();
  const updatedSlot0 = await pool.slot0();
  console.log("Pool liquidity:", liquidity.toString());
  console.log("Pool current tick:", updatedSlot0.tick);
  console.log("Pool sqrt price X96:", updatedSlot0.sqrtPriceX96.toString());

  // Calculate and log the actual price
  const price = (updatedSlot0.sqrtPriceX96.pow(2).mul(ethers.BigNumber.from(10).pow(18)).div(ethers.BigNumber.from(2).pow(192))).toString() / 1e18;
  console.log("Current price:", price, "MOR per WETH");

  // Check final balances
  const finalWethBalance = await weth.balanceOf(signer.address);
  const finalMorBalance = await mor.balanceOf(signer.address);
  console.log("Final WETH balance:", ethers.utils.formatEther(finalWethBalance), "WETH");
  console.log("Final MOR balance:", ethers.utils.formatEther(finalMorBalance), "MOR");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });