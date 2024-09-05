const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenSwap", function () {
  let tokenSwap, owner, addr1;
  let MOR, WETH;

  beforeEach(async function () {
    // Deploy the TokenSwap contract
    const TokenSwap = await ethers.getContractFactory("TokenSwap");
    tokenSwap = await TokenSwap.deploy(0xE592427A0AEce92De3Edee1F18E0157C05861564);
    await tokenSwap.deployed();

    // Get the contract's owner and a test address
    [owner, addr1] = await ethers.getSigners();

    // Assume MOR and WETH are deployed ERC-20 tokens; you may mock them if needed
    MOR = 0x092bAaDB7DEf4C3981454dD9c0A0D7FF07bCFc86;
    WETH = 0x82af49447d8a07e3bd95bd0d56f35241523fbab1;
  });

  it("Should swap MOR for WETH", async function () {
    const amountIn = ethers.utils.parseUnits("1", 18); // 1 MOR

    await tokenSwap.connect(owner).swapExactInputSingle(amountIn);
    // Write assertions to check balances, etc.
  });
});
