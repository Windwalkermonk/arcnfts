import { ethers } from 'hardhat';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying with:', deployer.address);

  const NFTFactory = await ethers.getContractFactory('NFTFactory');
  const factory = await NFTFactory.deploy();
  await factory.waitForDeployment();
  const addr = await factory.getAddress();

  console.log('NFTFactory deployed to:', addr);
  console.log('\nUpdate src/config/network.ts:');
  console.log(`  nftFactory: '${addr}'`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
