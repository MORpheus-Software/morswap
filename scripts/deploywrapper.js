async function main() {
    const [deployer] = await ethers.getSigners();
  
    console.log("Deploying WETHMock contract with the account:", deployer.address);
  
    // Get the contract factory
    const WETHMock = await ethers.getContractFactory("WETHMock");
  
    // Deploy the contract
    const wethMock = await WETHMock.deploy();
    await wethMock.deployed();
  
    console.log("WETHMock contract deployed to:", wethMock.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
  