async function main() {
    const [deployer] = await ethers.getSigners();

    console.log('Wrapping ETH to WETH with the account:', deployer.address);

    // WETH contract address on Arbitrum
    const wethAddress = '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73'; // WETH on Arbitrum Testnet

    // Get the WETH contract
    const weth = await ethers.getContractAt("IWETH", wethAddress);

    // Amount of ETH to wrap (e.g., 1 ETH)
    const amountToWrap = ethers.utils.parseEther("1"); // 1 ETH

    // Wrap ETH to WETH by sending ETH to the WETH contract
    const tx = await weth.deposit({ value: amountToWrap });
    await tx.wait();

    console.log(`Successfully wrapped 1 ETH to WETH!`);

    // Check WETH balance
    const wethBalance = await weth.balanceOf(deployer.address);
    console.log(`WETH balance: ${ethers.utils.formatEther(wethBalance)} WETH`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
