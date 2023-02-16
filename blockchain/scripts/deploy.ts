import { ethers } from "hardhat";
import fs from 'fs';
import path from 'path';

async function main() {
  const EtheCall = await ethers.getContractFactory("EtheCall");
  const etheCall = await EtheCall.deploy();

  await etheCall.deployed();

  console.log(`EtheCall was deployed to ${etheCall.address}`);
  fs.createReadStream(path.join(__dirname, '../artifacts/contracts/Ethe-Call.sol/EtheCall.json'))
    .pipe(fs.createWriteStream(path.join(__dirname, '../../common/EtheCall.json')));

  fs.writeFile(path.join(__dirname, "../../common/contract_addr.js"), `export default '${etheCall.address}'`, function(err) {
    if(err) {
        return console.log(err);
    }
});

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
