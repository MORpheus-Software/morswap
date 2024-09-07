const { ethers } = require("hardhat");
const { abi: NonfungiblePositionManagerABI } = require('@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json');

async function main() {
  const [signer] = await ethers.getSigners();

  // Replace these with your MOR and WETH addresses
  const morAddress = "0xc1664f994Fd3991f98aE944bC16B9aED673eF5fD";
  const wethAddress = "0x9F220B916edDcD745F9547f2D5cd5D06F40d1B6E";

  const factoryAddress = "0x248AB79Bbb9bC29bB72f7Cd42F17e054Fc40188e";
  const nonfungiblePositionManagerAddress = "0x6b2937Bde17889EDCf8fbD8dE31C3C2a70Bc4d65";

  console.log("MOR address:", morAddress);
  console.log("WETH address:", wethAddress);
  console.log("Factory address:", factoryAddress);
  console.log("NonfungiblePositionManager address:", nonfungiblePositionManagerAddress);

  const factory = await ethers.getContractAt("IUniswapV3Factory", factoryAddress);
  const nonfungiblePositionManager = new ethers.Contract(nonfungiblePositionManagerAddress, NonfungiblePositionManagerABI, signer);

  const mor = await ethers.getContractAt("IERC20", morAddress);
  const weth = await ethers.getContractAt("IERC20", wethAddress);

  // Ensure tokens are in the correct order
  const [token0, token1] = morAddress.toLowerCase() < wethAddress.toLowerCase()
    ? [mor, weth]
    : [weth, mor];

  console.log("Token0:", token0.address);
  console.log("Token1:", token1.address);

  // Check if pool already exists
  const fee = 3000; // 0.3%
  let poolAddress = await factory.getPool(token0.address, token1.address, fee);
  
  if (poolAddress === ethers.constants.AddressZero) {
    console.log("Pool doesn't exist. Creating pool...");
    const createPoolTx = await factory.createPool(token0.address, token1.address, fee);
    await createPoolTx.wait();
    console.log("Pool created. Transaction hash:", createPoolTx.hash);
    
    poolAddress = await factory.getPool(token0.address, token1.address, fee);
  }
  
  console.log("Pool address:", poolAddress);

  const pool = await ethers.getContractAt("IUniswapV3Pool", poolAddress);

  // Initialize pool if not already initialized
  const slot0 = await pool.slot0();
  if (slot0.sqrtPriceX96.eq(0)) {
    console.log("Pool not initialized. Initializing...");
    const price = 1000; // 1 WETH = 1000 MOR
    const sqrtPriceX96 = ethers.BigNumber.from(
      Math.floor(Math.sqrt(price) * 2 ** 96)
    );
    const initializeTx = await pool.initialize(sqrtPriceX96);
    await initializeTx.wait();
    console.log("Pool initialized. Transaction hash:", initializeTx.hash);
  } else {
    console.log("Pool already initialized");
  }

  // Specify exact amounts to mint
  const morAmount = ethers.utils.parseEther("10");  // 10 MOR
  const wethAmount = ethers.utils.parseEther("0.01");  // 0.01 WETH

  // Determine which token is token0 and token1
  let amount0ToMint, amount1ToMint;
  if (token0.address.toLowerCase() === morAddress.toLowerCase()) {
    amount0ToMint = morAmount;
    amount1ToMint = wethAmount;
  } else {
    amount0ToMint = wethAmount;
    amount1ToMint = morAmount;
  }

  console.log("Amount of Token0 to mint:", ethers.utils.formatEther(amount0ToMint), "Token0 address:", token0.address);
  console.log("Amount of Token1 to mint:", ethers.utils.formatEther(amount1ToMint), "Token1 address:", token1.address);

  // Check balances before minting
  const token0Balance = await token0.balanceOf(signer.address);
  const token1Balance = await token1.balanceOf(signer.address);
  console.log("Token0 balance before minting:", ethers.utils.formatEther(token0Balance));
  console.log("Token1 balance before minting:", ethers.utils.formatEther(token1Balance));

  // Ensure you have enough balance
  if (token0Balance.lt(amount0ToMint) || token1Balance.lt(amount1ToMint)) {
    throw new Error("Insufficient balance for one or both tokens");
  }

  // Approve tokens
  console.log("Approving tokens...");
  await token0.approve(nonfungiblePositionManager.address, amount0ToMint);
  await token1.approve(nonfungiblePositionManager.address, amount1ToMint);

  // Prepare mint parameters
  const mintParams = {
    token0: token0.address,
    token1: token1.address,
    fee: fee,
    tickLower: -887220,
    tickUpper: 887220,
    amount0Desired: amount0ToMint,
    amount1Desired: amount1ToMint,
    amount0Min: 0,
    amount1Min: 0,
    recipient: signer.address,
    deadline: Math.floor(Date.now() / 1000) + 60 * 10
  };

  console.log("Minting with params:", mintParams);

  try {
    console.log("Attempting to mint position...");
    const estimatedGas = await nonfungiblePositionManager.estimateGas.mint(mintParams);
    console.log("Estimated gas:", estimatedGas.toString());
    
    const mintTx = await nonfungiblePositionManager.mint(mintParams, { 
      gasLimit: estimatedGas.mul(120).div(100) // Add 20% buffer
    });
    console.log("Mint transaction sent:", mintTx.hash);
    const mintReceipt = await mintTx.wait();
    console.log("Position minted. Transaction hash:", mintReceipt.transactionHash);

    // Find the Transfer event in the receipt to get the tokenId
    const transferEvent = mintReceipt.events.find(event => event.event === 'Transfer');
    const tokenId = transferEvent.args.tokenId;
    console.log("Minted token ID:", tokenId.toString());

    // Get position information
    const position = await nonfungiblePositionManager.positions(tokenId);
    console.log("Position liquidity:", position.liquidity.toString());
  } catch (error) {
    console.error("Error minting position:", error);
    if (error.error && error.error.message) {
      console.error("Detailed error:", error.error.message);
    }
    // If there's a revert reason, it might be in the error data
    if (error.data) {
      const decodedError = ethers.utils.toUtf8String(error.data);
      console.error("Decoded error:", decodedError);
    }
  }

  // Check pool balances
  const poolToken0Balance = await token0.balanceOf(poolAddress);
  const poolToken1Balance = await token1.balanceOf(poolAddress);
  console.log("Pool Token0 balance:", ethers.utils.formatEther(poolToken0Balance));
  console.log("Pool Token1 balance:", ethers.utils.formatEther(poolToken1Balance));

  // Check pool liquidity and tick
  const liquidity = await pool.liquidity();
  const updatedSlot0 = await pool.slot0();
  console.log("Pool liquidity:", liquidity.toString());
  console.log("Pool current tick:", updatedSlot0.tick);
  console.log("Pool sqrt price X96:", updatedSlot0.sqrtPriceX96.toString());

  // Calculate and log the actual price
  const price = (updatedSlot0.sqrtPriceX96.pow(2).mul(ethers.BigNumber.from(10).pow(18)).div(ethers.BigNumber.from(2).pow(192))).toString() / 1e18;
  console.log("Current price (Token1 per Token0):", price);

  // Check balances after adding liquidity
  const finalToken0Balance = await token0.balanceOf(signer.address);
  const finalToken1Balance = await token1.balanceOf(signer.address);
  console.log("Token0 balance after adding liquidity:", ethers.utils.formatEther(finalToken0Balance));
  console.log("Token1 balance after adding liquidity:", ethers.utils.formatEther(finalToken1Balance));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });