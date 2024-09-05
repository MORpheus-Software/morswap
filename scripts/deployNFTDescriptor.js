async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    // Deploy the NFTDescriptor library
    const NFTDescriptor = await ethers.getContractFactory("NFTDescriptor");
    const nftDescriptor = await NFTDescriptor.deploy();

    console.log("NFTDescriptor deployed to:", nftDescriptor.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
