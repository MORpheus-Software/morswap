const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();

  // Replace these with your newly deployed TT5 and TT6 addresses
  const tt5Address = "0x1Bc0330e6922DE94Ac2D1e448d675F7a2f001AAD";
  const tt6Address = "0xD8393be00FE996F518C7b768333E74F3034C746D";

  const factoryAddress = "0x248AB79Bbb9bC29bB72f7Cd42F17e054Fc40188e";
  const nonfungiblePositionManagerAddress = "0x6b2937Bde17889EDCf8fbD8dE31C3C2a70Bc4d65";

  const factory = await ethers.getContractAt("IUniswapV3Factory", factoryAddress);
  const nonfungiblePositionManager = await ethers.getContractAt("INonfungiblePositionManager", nonfungiblePositionManagerAddress);

  const tt5 = await ethers.getContractAt("TestToken", tt5Address);
  const tt6 = await ethers.getContractAt("TestToken", tt6Address);

  console.log("TT5 decimals:", await tt5.decimals());
  console.log("TT6 decimals:", await tt6.decimals());

  // Ensure tokens are in the correct order
  const [token0, token1] = tt5Address.toLowerCase() < tt6Address.toLowerCase()
    ? [tt5, tt6]
    : [tt6, tt5];

  console.log("Token0:", token0.address);
  console.log("Token1:", token1.address);

  // Check if pool already exists
  const fee = 3000; // 0.3%
  const existingPool = await factory.getPool(token0.address, token1.address, fee);
  if (existingPool !== ethers.constants.AddressZero) {
    console.log("Pool already exists at:", existingPool);
    return;
  }

  // Create pool
  console.log("Creating pool...");
  const createPoolTx = await factory.createPool(token0.address, token1.address, fee, { gasLimit: 5000000 });
  console.log("Create pool transaction hash:", createPoolTx.hash);
  await createPoolTx.wait();
  
  const poolAddress = await factory.getPool(token0.address, token1.address, fee);
  console.log("Pool created at:", poolAddress);

  const pool = await ethers.getContractAt("IUniswapV3Pool", poolAddress);

  // Initialize pool
  const sqrtPriceX96 = ethers.BigNumber.from('79228162514264337593543950336'); // 1:1 price
  await pool.initialize(sqrtPriceX96);
  console.log("Pool initialized with sqrt price:", sqrtPriceX96.toString());

  // Approve tokens
  const amount0ToMint = ethers.utils.parseEther("1000");
  const amount1ToMint = ethers.utils.parseEther("1000");
  await token0.approve(nonfungiblePositionManagerAddress, amount0ToMint);
  await token1.approve(nonfungiblePositionManagerAddress, amount1ToMint);

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

  // Mint new position
  const mintTx = await nonfungiblePositionManager.mint(mintParams);
  const mintReceipt = await mintTx.wait();
  console.log("Position minted. Transaction hash:", mintReceipt.transactionHash);

  // Find the Transfer event in the receipt to get the tokenId
  const transferEvent = mintReceipt.events.find(event => event.event === 'Transfer');
  const tokenId = transferEvent.args.tokenId;
  console.log("Minted token ID:", tokenId.toString());

  // Get position information
  const position = await nonfungiblePositionManager.positions(tokenId);
  console.log("Position liquidity:", position.liquidity.toString());

  // Check pool balances
  const poolToken0Balance = await token0.balanceOf(poolAddress);
  const poolToken1Balance = await token1.balanceOf(poolAddress);
  console.log("Pool Token0 balance:", ethers.utils.formatEther(poolToken0Balance));
  console.log("Pool Token1 balance:", ethers.utils.formatEther(poolToken1Balance));

  // Check pool liquidity and tick
  const liquidity = await pool.liquidity();
  const slot0 = await pool.slot0();
  console.log("Pool liquidity:", liquidity.toString());
  console.log("Pool current tick:", slot0.tick);
  console.log("Pool sqrt price X96:", slot0.sqrtPriceX96.toString());

  // Calculate and log the actual price
  const price = (slot0.sqrtPriceX96.pow(2).mul(ethers.BigNumber.from(10).pow(18)).div(ethers.BigNumber.from(2).pow(192))).toString() / 1e18;
  console.log("Current price (Token1 per Token0):", price);

  // Check balances after adding liquidity
  const token0Balance = await token0.balanceOf(signer.address);
  const token1Balance = await token1.balanceOf(signer.address);
  console.log("Token0 balance after adding liquidity:", ethers.utils.formatEther(token0Balance));
  console.log("Token1 balance after adding liquidity:", ethers.utils.formatEther(token1Balance));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });