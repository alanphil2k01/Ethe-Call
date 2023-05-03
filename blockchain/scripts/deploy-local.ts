import { ethers } from "hardhat";
import fs from 'fs';
import path from 'path';

async function main() {
  const EtheCall = await ethers.getContractFactory("EtheCall");
  const etheCall = await EtheCall.deploy();
  const [acc1, acc2, acc3] = await ethers.getSigners();

  await etheCall.deployed();

  console.log(`EtheCall was deployed to ${etheCall.address}`);
  fs.createReadStream(path.join(__dirname, '../artifacts/contracts/Ethe-Call.sol/EtheCall.json'))
    .pipe(fs.createWriteStream(path.join(__dirname, '../../common/EtheCall.json')));

  fs.writeFile(path.join(__dirname, "../../common/contract_addr.js"), `export default '${etheCall.address}'`, function(err) {
    if(err) {
        return console.log(err);
    }

    });
    // await etheCall.newCall("call1", [acc2.address, acc3.address], []);
    await etheCall["newCall(string,address[],address[])"]("call1", [acc2.address, acc3.address], [])
    await etheCall.setNickname("name1");
    await etheCall.connect(acc2).setNickname("name2");
    await etheCall.connect(acc3).setNickname("name3");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
