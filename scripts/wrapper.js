async function main() {
    const [deployer] = await ethers.getSigners();
  
    console.log("Wrapping 0.01 ETH into WETH...");
  
    const wethMockAddress = "0x9F220B916edDcD745F9547f2D5cd5D06F40d1B6E"; // WETHMock contract address
    const wethMock = await ethers.getContractAt("WETHMock", wethMockAddress);
  
    // Wrap 0.01 ETH into WETH
    const tx = await wethMock.deposit({ value: ethers.utils.parseEther("0.01") });
    await tx.wait();
  
    console.log("0.01 ETH wrapped into WETH successfully!");
  
    // Check WETH balance
    const wethBalance = await wethMock.balanceOf(deployer.address);
    console.log(`WETH balance: ${ethers.utils.formatEther(wethBalance)}`);
  }
  
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
  