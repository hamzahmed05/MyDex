// contracts/Exchange.sol
// SPDX-License-Identifier: GPL-3.0-or-later
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

pragma solidity >= 0.8.0;

interface TheFactory {
  function getExchange(address _tokenAddress) external returns (address);
}
interface TheExchange {
    function ethToTokenSwap(uint256 _minTokens) external payable;

    function ethToTokenTransfer(uint256 _minTokens, address _recipient)
        external
        payable;
}

contract Exchange is ERC20 {
    address public tokenAddress;
    address public factoryAddress;

    constructor(address _token) ERC20("DexSwap-v1", "Dex-v1") {
        require(_token != address(0), "invalid token address");

        tokenAddress = _token;
        factoryAddress = msg.sender;

    }
    function ethToTokenTransfer(uint256 minTokens, address recipient) public payable {
        ethToToken(minTokens, recipient);
    }
    function ethToToken(uint256 minTokens, address recipient) private {
        uint256 tokenReserve = getReserve();
        uint256 tokensBought = getReserveAmount(msg.value, address(this).balance - msg.value, tokenReserve);
        require(tokensBought >= minTokens, "insufficient output amount");
        IERC20(tokenAddress).transfer(recipient, tokensBought);

    }
    function tokenForTokenSwap(uint256 tokensSold, uint256 minTokensBought, address _tokenAddress) public {
        address exchangeAddress = TheFactory(factoryAddress).getExchange(_tokenAddress);  
        require(exchangeAddress != address(this) && exchangeAddress != address(0), "invalid exchange address");
        uint256 tokenReserve = getReserve();
        uint256 ethBought = getReserveAmount(tokensSold, tokenReserve, address(this).balance);


        IERC20(tokenAddress).transferFrom(msg.sender,address(this),tokensSold);
        TheExchange(exchangeAddress).ethToTokenTransfer{value: ethBought}(minTokensBought, msg.sender);
        
    }

    function addLiquidity(uint256 tokenAdded) public payable {
        if (getReserve() == 0) {
            IERC20 token = IERC20(tokenAddress);
            token.transferFrom(msg.sender, address(this), tokenAdded);
        }
        else {
            uint256 ethReserve = address(this).balance - msg.value;
            uint256 tokenReserve = getReserve();
            uint256 tokenAmount = (msg.value * tokenReserve) / ethReserve;
            require(tokenAdded >= tokenAmount, "insufficient token amount");

            IERC20 token = IERC20(tokenAddress);
            token.transferFrom(msg.sender, address(this), tokenAmount);
        }
    }

    function getReserve() public view returns (uint256) {
        return IERC20(tokenAddress).balanceOf(address(this));
    }

    function getPrice(uint256 reserve1, uint256 reserve2) public pure returns(uint256) {
        require(reserve1 > 0 && reserve2 > 0, "not enough balance in reserves");
        return (reserve1 * 1000) / reserve2;

    }

    function getReserveAmount(uint256 _amount, uint256 reserve1, uint256 reserve2) private pure returns(uint256) {
        require(reserve1 > 0 && reserve2 > 0, "reserve amount must be greater");
        return (reserve2 * _amount) / (reserve1 + _amount);
    }

    function getTokenAmount(uint256 ethSold) public view returns(uint256) {
        require(ethSold > 0, "ethSold is too small");
        uint256 tokenReserve = getReserve();
        return getReserveAmount(ethSold, address(this).balance, tokenReserve);
    }

    function getEthAmount(uint256 _tokenSold) public view returns(uint256) {
        require(_tokenSold > 0, "tokenSold is too small");
        uint256 tokenReserve = getReserve();
        return getReserveAmount(_tokenSold, tokenReserve, address(this).balance);
    }

    function ethTokenSwap(uint256 minTokens) public payable {
        uint256 tokenReserve = getReserve();
        uint256 tokensBought = getReserveAmount(msg.value,address(this).balance - msg.value,tokenReserve);
        require(tokensBought >= minTokens, "insufficient output amount");
        IERC20(tokenAddress).transfer(msg.sender, tokensBought);
    }

    function tokenEthSWap(uint256 tokensSold, uint256 minEth) public {
        uint256 tokenReserve = getReserve();
        uint256 ethBought = getReserveAmount(tokensSold, tokenReserve, address(this).balance);
        require(ethBought >= minEth, "insufficient output amount");
        IERC20(tokenAddress).transferFrom(msg.sender, address(this), tokensSold);
        payable(msg.sender).transfer(ethBought);
    }


}