const { ethers, getNamedAccounts } = require("hardhat");

async function main() {
  const newCarbonDollar = await ethers.getContract("NewCarbonDollar");
  console.log("NewCarbonDollar deployed to:", newCarbonDollar.address);

  const { deployer, player, company, government } = await getNamedAccounts();
  console.log("Deployer address:", deployer);
  console.log("Player address:", player);
  console.log("Company address:", company);
  console.log("Government address:", government);

  console.log("----------------------");

  const playerWalletBalance = await newCarbonDollar.balanceOf(player);
  console.log("Player wallet balance:", playerWalletBalance.toString());

  console.log("Minting 1000 NCD tokens to player...");
  const mintTokenToUser = await newCarbonDollar.mint(player, 1000);
  await mintTokenToUser.wait(1);

  const playerWalletBalance2 = await newCarbonDollar.balanceOf(player);
  console.log("Player wallet balance:", playerWalletBalance2.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
