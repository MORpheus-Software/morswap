const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log('Deploying Nonfungible Position Manager with the account:', deployer.address);
  
    // Use the correct contract name
    const NonfungiblePositionManager = await ethers.getContractFactory('NonfungiblePositionManager');
    
    // You need to provide these addresses for your specific network
    const factoryAddress = '0xD27889D6a7d1B7646e45BA92907228Ef706bda3A';
    const wethAddress = '0xb6c322FA3D8e0A60AfEB17512905eb2229CE7dA5';
    const tokenDescriptorAddress = '0x6b2937Bde17889EDCf8fbD8dE31C3C2a70Bc4d65';
    
    const positionManager = await NonfungiblePositionManager.deploy(
        factoryAddress,
        wethAddress,
        tokenDescriptorAddress
    );
  
    await positionManager.deployed();
    
    console.log('Nonfungible Position Manager deployed to:', positionManager.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

