async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const NFTDescriptor = await ethers.getContractFactory("NFTDescriptor");
  const nftDescriptorAddress = "0xA6efc4aD069e0f23Cb2e802D415551990A21df82"; 

  // Link the library to the contract with fully qualified name
  const NonfungibleTokenPositionDescriptor = await ethers.getContractFactory("contracts/NonfungibleTokenPositionDescriptor.sol:NonfungibleTokenPositionDescriptor", {
      libraries: {
          NFTDescriptor: nftDescriptorAddress,
      },
  });

  // Deploy the contract with the required WETH9 address in constructor
  const tokenDescriptor = await NonfungibleTokenPositionDescriptor.deploy("0xc67dF7d26C40d897D02d91F26aF6114Fe406E796");

  console.log("NonfungibleTokenPositionDescriptor deployed to:", tokenDescriptor.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


