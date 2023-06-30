# Simple erc20 permit smart conract

This is a simple of using erc20 permit smart contract.

In order to run it run these commands in different window each:

1. Install dependencies:

```
yarn install
```

2. Launch Hardhat node:

```
yarn hardhat node
```

3. Mint erc20 token:

```
yarn mintToken
```

4. Generate an off-chain signature, and use the permitTransfer and permitBurn functions to allow the token owner to trade without Gas:

```
yarn permit
```
