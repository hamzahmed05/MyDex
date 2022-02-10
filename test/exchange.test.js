require("@nomiclabs/hardhat-waffle");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const toWei = (value) => ethers.utils.parseEther(value.toString());
const getBalance = ethers.provider.getBalance;
const fromWei = (value) => ethers.utils.formatEther(typeof value === "string" ? value : value.toString());
const NewExchange = async (factory, tokenAddress, sender) => {
    const exchangeAddress = await factory
      .connect(sender)
      .callStatic.NewExchange(tokenAddress);
  
    await factory.connect(sender).NewExchange(tokenAddress);
  
    const Exchange = await ethers.getContractFactory("Exchange");
  
    return await Exchange.attach(exchangeAddress);
  };


describe("Exchange", () => {
    let exchange;
    let owner;
    let user;

    beforeEach(async() => {
        [owner, user] = await ethers.getSigners();
        const Token = await ethers.getContractFactory("Token");
        token = await Token.deploy("Token", "TKN", toWei(1000000));
        await token.deployed();

        const Exchange = await ethers.getContractFactory("Exchange");
        exchange = await Exchange.deploy(token.address);
        await exchange.deployed();
    })
    describe("addLiquidity", async() => {

        it("adds liquidity", async () => {
            await token.approve(exchange.address, toWei(200));
            await exchange.addLiquidity(toWei(200), {value: toWei(100)});

            expect (await getBalance(exchange.address)).to.equal(toWei(100));
            expect(await exchange.getReserve()).to.equal(toWei(200));
        });
    });

    describe("getPrice", async () => {
        it("returns the correct price", async() => {
            await token.approve(exchange.address, toWei(200));
            await exchange.addLiquidity(toWei(200), {value: toWei(100)});

            const tokenReserve = await exchange.getReserve();
            const ethReserve = await getBalance(exchange.address);

            expect(
                (await exchange.getPrice(ethReserve, tokenReserve))
                .toString()).to.equal("500");

            expect((await exchange.getPrice(tokenReserve, ethReserve))
            .toString()).to.eq("2000");
        });
    });
    describe("getTokenAmount", async () => {
        it("returns correct token amount", async () => {
            await token.approve(exchange.address, toWei(2000));
            await exchange.addLiquidity(toWei(2000), {value: toWei(1000)});

            // const tokenReserve = await exchange.getReserve();
            // const ethReserve = await getBalance(exchange.address);

            let tokensOut = await exchange.getTokenAmount(toWei(1));
            expect(fromWei(tokensOut)).to.equal("1.998001998001998001")

            tokensOut = await exchange.getTokenAmount(toWei(100));
            expect(fromWei(tokensOut)).to.equal("181.818181818181818181")

            tokensOut = await exchange.getTokenAmount(toWei(1000));
            expect(fromWei(tokensOut)).to.equal("1000.0")
        });
        describe("get Ether Amount", async () => {
            it("returns correct ether amount", async () => {
                await token.approve(exchange.address, toWei(2000));
                await exchange.addLiquidity(toWei(2000), {value: toWei(1000)});

                // const tokenReserve = await exchange.getReserve();
                // const ethReserve = await getBalance(exchange.address);

                let EthOut = await exchange.getEthAmount(toWei(2));
                expect(fromWei(EthOut)).to.equal("0.999000999000999")
          
                ethOut = await exchange.getEthAmount(toWei(100));
                expect(fromWei(ethOut)).to.equal("47.619047619047619047");
            
                ethOut = await exchange.getEthAmount(toWei(2000));
                expect(fromWei(ethOut)).to.equal("500.0");
            });
        });
    });

    describe("eth To Token Swap", async () => {
        beforeEach(async () => {
          await token.approve(exchange.address, toWei(2000));
          await exchange.addLiquidity(toWei(2000), { value: toWei(1000) });
        });
    
        it("transfers at least min amount of tokens", async () => {
          const userBalanceBefore = await getBalance(user.address);
    
          await exchange
            .connect(user)
            .ethTokenSwap(toWei(1.99), { value: toWei(1) });
    
          const userBalanceAfter = await getBalance(user.address);
          expect(fromWei(userBalanceAfter.sub(userBalanceBefore))).to.equal(
            "-1.000065217521100748"
          );
    
          const userTokenBalance = await token.balanceOf(user.address);
          expect(fromWei(userTokenBalance)).to.equal("1.998001998001998001");
    
          const exchangeEthBalance = await getBalance(exchange.address);
          expect(fromWei(exchangeEthBalance)).to.equal("1001.0");
    
          const exchangeTokenBalance = await token.balanceOf(exchange.address);
          expect(fromWei(exchangeTokenBalance)).to.equal("1998.001998001998001999");
        });
    
        it("fails when output amount is less than min amount", async () => {
          await expect(
            exchange.connect(user).ethTokenSwap(toWei(2), { value: toWei(1) })
          ).to.be.revertedWith("insufficient output amount");
        });
    
        it("allows zero swaps", async () => {
          await exchange
            .connect(user)
            .ethTokenSwap(toWei(0), { value: toWei(0) });
    
          const userTokenBalance = await token.balanceOf(user.address);
          expect(fromWei(userTokenBalance)).to.equal("0.0");
    
          const exchangeEthBalance = await getBalance(exchange.address);
          expect(fromWei(exchangeEthBalance)).to.equal("1000.0");
    
          const exchangeTokenBalance = await token.balanceOf(exchange.address);
          expect(fromWei(exchangeTokenBalance)).to.equal("2000.0");
        });
      });
    
      describe("token To EthSwap", async () => {
        beforeEach(async () => {
          await token.transfer(user.address, toWei(2));
          await token.connect(user).approve(exchange.address, toWei(2));
    
          await token.approve(exchange.address, toWei(2000));
          await exchange.addLiquidity(toWei(2000), { value: toWei(1000) });
        });
    
        it("transfers at least min amount of tokens", async () => {
          const userBalanceBefore = await getBalance(user.address);
    
          await exchange.connect(user).tokenEthSWap(toWei(2), toWei(0.9));
    
          const userBalanceAfter = await getBalance(user.address);
          expect(fromWei(userBalanceAfter - userBalanceBefore)).to.equal(
            "0.9989514240668467"
          );
    
          const userTokenBalance = await token.balanceOf(user.address);
          expect(fromWei(userTokenBalance)).to.equal("0.0");
    
          const exchangeEthBalance = await getBalance(exchange.address);
          expect(fromWei(exchangeEthBalance)).to.equal("999.000999000999001");
    
          const exchangeTokenBalance = await token.balanceOf(exchange.address);
          expect(fromWei(exchangeTokenBalance)).to.equal("2002.0");
        });
    
        it("fails when output amount is less than min amount", async () => {
          await expect(
            exchange.connect(user).tokenEthSWap(toWei(2), toWei(1.0))
          ).to.be.revertedWith("insufficient output amount");
        });
    
        it("allows zero swaps", async () => {
          await exchange.connect(user).tokenEthSWap(toWei(0), toWei(0));
    
          const userBalance = await getBalance(user.address);
          expect(fromWei(userBalance)).to.equal("9999.998598101129231095");
    
          const userTokenBalance = await token.balanceOf(user.address);
          expect(fromWei(userTokenBalance)).to.equal("2.0");
    
          const exchangeEthBalance = await getBalance(exchange.address);
          expect(fromWei(exchangeEthBalance)).to.equal("1000.0");
    
          const exchangeTokenBalance = await token.balanceOf(exchange.address);
          expect(fromWei(exchangeTokenBalance)).to.equal("2000.0");
        });
    });
    describe("token for Token Swap", async () => {
        it("swaps token for token", async () => {
          const Factory = await ethers.getContractFactory("Factory");
          const Token = await ethers.getContractFactory("Token");
    
          const factory = await Factory.deploy();
          const token = await Token.deploy("TokenA", "AAA", toWei(1000000));
          const token2 = await Token.connect(user).deploy(
            "TokenB",
            "BBBB",
            toWei(1000000)
          );
    
          await factory.deployed();
          await token.deployed();
          await token2.deployed();
    
          const exchange = await NewExchange(factory, token.address, owner);
          const exchange2 = await NewExchange(factory, token2.address, user);
    
          await token.approve(exchange.address, toWei(2000));
          await exchange.addLiquidity(toWei(2000), { value: toWei(1000) });
    
          await token2.connect(user).approve(exchange2.address, toWei(1000));
          await exchange2
            .connect(user)
            .addLiquidity(toWei(1000), { value: toWei(1000) });
    
          expect(await token2.balanceOf(owner.address)).to.equal(0);
    
          await token.approve(exchange.address, toWei(10));
          await exchange.tokenForTokenSwap(toWei(10), toWei(4.8), token2.address);
    
          expect(fromWei(await token2.balanceOf(owner.address))).to.equal(
            "4.950495049504950494"
          );
    
          expect(await token.balanceOf(user.address)).to.equal(0);
    
          await token2.connect(user).approve(exchange2.address, toWei(10));
          await exchange2
            .connect(user)
            .tokenForTokenSwap(toWei(10), toWei(19.6), token.address);
    
          expect(fromWei(await token.balanceOf(user.address))).to.equal(
            "19.998039600078415995"
          );
        });
      });
    
});