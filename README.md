# The Project
A clone of uniswap v1.
Simply, uniswap is a decentralized exchane that's running on the ethereum blockchain. 

More detailed, it's an algorithm that allows to make pools and fill them with liquidity to let users exchange tokens using the liquidity in the pool. Any user can deposit their funds into a liquidity pool -- and be able to benefit it by receiving Liquidity provider tokens. But for the simplicity of this project, we won't be implementing the LP tokens functionality. 

Tools:

- hardhat: development environment to compile, deploy, and test ethereum software. 
- Ethers JS:  complete ethereum wallet implementation and utilities.

Libary:
- OpenZeppelin - ERC20 token.

# Detailed Overview
Although I wasn't required to make a factory, I felt that it was very import to the functionality of the exchange. The project makes use of 3 contracts: Token, Exchange, and Factory. 

The Token contract makes use of ERC20 token contract provided by OpenZeppelin and defines its own constructor that allows us to set token name, symbol, and initial supply. The constructor mints initial supply of tokens and sends them to token creator's address.

The Exchange contract allows swap with only one token. Hence, connect an exchange with a token address. The token address is public; so, it allows users to find out what token this exchange is linked to. The exchange contract also allows for users to add liquidity because liquidity is what makes trades possible.

A factory is a registry contract that allows to create new exchanges, keeps track of all deployed exchanges, which makes exchange addresses accessible through token addresses.


## Pricing calculation
The price is calculated through the relation of reserves. When the exchange contract is deployed, we call addLiquditiy function to deposit 2000 tokens and 10000 ethers. So, the price of 1 token equals to 0.5 ethers and 1 ether equals to 2 tokens. 

For example, in the case a user comes along and decides to swap 2000 tokens for ether and the exchange receives 1000 ethers(which is everything on the contract), the exchange would be empty of tokens. To combat this, the correct price formula is   (reserve2 * amountOfTokens) / (reserve1 + amountOfTokens). Using this formula, we would get 1.998 tokens in exchange for 1 ether and 0.999 ether in exchange for 2 tokens. This way neither of the reserves is ever 0. Ultimately, making reserves infinite. 

## Token swap
there are two function for token-ether swaps: tokenEthSwap and EthTokenSwap. And another function for token-for-token swaps. 

Swapping ether for tokens would mean sending some amount of ethers -- stored in msg.value varaible -- to a payable contract function and receiving tokens in return. An important parameter for the function is the minTokens variable, which is the minimum amount of tokens the user wants to get in exchange for ethers. 

tokenEthSwap's tokensSold variable transfers tokensSold of tokens from the user's balance and in exchange, sends them ethBought of ethers in exchange. 

Swapping tokens for tokens is a little more complex than the previous swapping functions. This is also where the factory comes into play. 

Essentially, it implements the token-to-ether swap. However, instead of sending ethers to the user, it finds an exchange for the token address by the user; and if the exchange exists, sends ethers to the exchange to swap them to tokens. Then, returns swapped tokens to user. 


# Setup
Must have yarn and node installed.

`yarn add -D hardhat`

`yarn add -D @openzeppelin/contracts`

`yarn hardhat`

Follow the instructions

To run tests

`npx hardhat test`









