const { ethers } = require("hardhat");

async function main() {
  const newCarbonDollar = await ethers.getContract("NewCarbonDollar");
  //用另一種方式取得accounts因為要除了地址以外的東西
  const accounts = await ethers.getSigners();
  const deployer = accounts[0];
  const player = accounts[1];
  const company = accounts[2];
  const government = accounts[3];

  //全部鏈下簽名的deadline都用最大值
  const deadline = ethers.constants.MaxUint256;
  console.log(`deadline: ${deadline}`);

  //1000
  const playerWalletBalance = await newCarbonDollar.balanceOf(player.address);
  console.log("Player wallet balance:", playerWalletBalance.toString());

  const companyWalletBalance = await newCarbonDollar.balanceOf(company.address);
  console.log("Company wallet balance:", companyWalletBalance.toString());

  console.log("executing permitTransferFrom...! player to company");

  // 產生鏈下簽名的v,r,s。 目的是授權給spender可以轉移或是燒毀player的代幣
  // 產生簽名的owner是player,spender是deployer只用地址是因為不需要getChainId,value是1000代表允許轉移的代幣,deadline是MaxUint256代表最大值
  const { v, r, s } = await getPermitSignature(
    player,
    newCarbonDollar,
    deployer.address,
    1000,
    deadline
  );
  console.log(`v: ${v}`);
  console.log(`r: ${r}`);
  console.log(`s: ${s}`);

  //permitTransferFrom 將player的1000代幣轉移給company(透過deployer)
  const tx = await newCarbonDollar.permitTransferFrom(
    player.address,
    company.address,
    1000,
    deadline,
    v,
    r,
    s
  );
  await tx.wait(1);

  const playerWalletBalance2 = await newCarbonDollar.balanceOf(player.address);
  console.log("Player wallet balance:", playerWalletBalance2.toString());

  const companyWalletBalance2 = await newCarbonDollar.balanceOf(company.address);
  console.log("Company wallet balance:", companyWalletBalance2.toString());

  //permitTransferFrom 將company的1000代幣轉移給government
  console.log("executing permitTransferFrom...! company to government");

  //此時擁有者是company,spender是deployer,代替company做轉移動作
  const {
    v: v2,
    r: r2,
    s: s2,
  } = await getPermitSignature(company, newCarbonDollar, deployer.address, 1000, deadline);
  console.log(`v: ${v2}`);
  console.log(`r: ${r2}`);
  console.log(`s: ${s2}`);

  //permitTransferFrom 將player的1000代幣轉移給company(透過deployer)
  const tx2 = await newCarbonDollar.permitTransferFrom(
    company.address,
    government.address,
    1000,
    deadline,
    v2,
    r2,
    s2
  );
  await tx2.wait(1);

  const companyWalletBalance3 = await newCarbonDollar.balanceOf(company.address);
  console.log("Company wallet balance:", companyWalletBalance3.toString());

  const governmentWalletBalance = await newCarbonDollar.balanceOf(government.address);
  console.log("Government wallet balance:", governmentWalletBalance.toString());

  //permitBurn 將government的1000代幣燒毀
  console.log("executing permitBurnFrom...! instead of government");

  //government產生鏈下簽名,委託公司執行代幣燒毀
  const {
    v: v3,
    r: r3,
    s: s3,
  } = await getPermitSignature(government, newCarbonDollar, deployer.address, 1000, deadline);
  console.log(`v: ${v3}`);
  console.log(`r: ${r3}`);
  console.log(`s: ${s3}`);

  const tx3 = await newCarbonDollar.permitBurnFrom(government.address, 1000, deadline, v3, r3, s3);
  await tx3.wait(1);

  const governmentWalletBalance2 = await newCarbonDollar.balanceOf(government.address);
  console.log("Government wallet balance:", governmentWalletBalance2.toString());

  const totalSupply = await newCarbonDollar.totalSupply();
  console.log("Total supply:", totalSupply.toString());
}

//用於產生鏈下簽名的function,傳入進來的參數為signer,token,spender,value,deadline
async function getPermitSignature(signer, token, spender, value, deadline) {
  //Promise.all()方法用於將多個Promise實例，包装成一個新的Promise實例。
  //Promise.all回傳的是一個陣列物件，裡面包含了所有的Promise的結果。當所有Promise都完成時，回傳的Promise才會是完成狀態。
  //輸入的參數為一個陣列或是string，他們是可遍歷物件。
  //version先寫死為1
  const [nonce, name, version, chainId] = await Promise.all([
    token.nonces(signer.address),
    token.name(),
    "1",
    signer.getChainId(),
  ]);
  //上面這行等於下面這些
  // const nonce = await token.nonces(signer.address);
  // const name = await token.name();
  // const version = "1";
  // const chainId = await signer.getChainId();

  //splitSignature 方法用於將以太坊簽名十六進製字符串hex string拆分為單獨的部分。簽名必須採用特定格式才能使此方法起作用。
  return ethers.utils.splitSignature(
    /**
    簽署一個type data structure(類型數據結構)的type data value(類型數據值)，用於EIP-712規範的domain
    參考https://docs.ethers.org/v5/api/signer/
    
    因為我們要使用erc20的permit,而鏈下要簽署的message是permit function中的這一串
    這一串包含type data structure(_PERMIT_TYPEHASH)  和 type data value(owner,spender,value,nonce,deadline)
    bytes32 structHash = keccak256(abi.encode(_PERMIT_TYPEHASH, owner, spender, value, _useNonce(owner), deadline));
    
    PERMIT_TYPEHASH 可以找到這一串，後面是type data struct
    bytes32 private constant _PERMIT_TYPEHASH = keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");

    結論 return ethers.utils.splitSignature(await signer._signTypedData())
    這行的用意是，先產生一個簽名,最後再用splitSignature將簽名拆分成v,r,s
     */
    await signer._signTypedData(
      //domain，domain上的所有屬性都是可選的
      {
        name, //token name
        version, //token version
        chainId,
        verifyingContract: token.address,
      },
      //所有類型定義type definitions的數據結構，對應到_PERMIT_TYPEHASH
      {
        Permit: [
          {
            name: "owner",
            type: "address",
          },
          {
            name: "spender",
            type: "address",
          },
          {
            name: "value",
            type: "uint256",
          },
          {
            name: "nonce",
            type: "uint256",
          },
          {
            name: "deadline",
            type: "uint256",
          },
        ],
      },
      //(value) 要簽署的data，也就是上面寫好的type data sturcture的  ** type data value **
      {
        owner: signer.address,
        spender,
        value,
        nonce,
        deadline,
      }
    )
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
