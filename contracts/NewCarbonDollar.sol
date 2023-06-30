// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

//New carbon dollar

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

//New carbon dollar
contract NewCarbonDollar is ERC20, ERC20Burnable, AccessControl, ERC20Permit, Pausable {
  //暫停function,當合約處於暫停狀態時,禁止轉移代幣
  function pause() public onlyRole(DEFAULT_ADMIN_ROLE) {
    _pause();
  }

  function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
    _unpause();
  }

  //event
  event AddedBlackList(address indexed evilUser);
  event RemovedBlackList(address indexed clearedUser);

  bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

  //一個mapping用於對應地址是否處於黑名單
  mapping(address => bool) public isBlackListed;

  constructor() ERC20("NewCarbonDollar", "NCD") ERC20Permit("NewCarbonDollar") {
    //grantRole只有DEFAULT_ADMIN_ROLE才能使用
    //_grantRole沒有access control, 所以只能在constructor中使用
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(MINTER_ROLE, msg.sender); //deployer就是官方
  }

  //只有MINTER_ROLE可以mint,並轉給用戶
  function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
    _mint(to, amount);
  }

  //當token owner要轉移代幣給to時,此function由第三方呼叫
  //此時owner是代幣持有人,to是轉移代幣的對象,amount是owner授權及轉移代幣的數量,dealine是owner授權的截止時間,v,r,s是owner授權的鏈下簽名
  //由於是第三方呼叫此function，所以Gas由第三方支付，而不是token owner
  function permitTransferFrom(
    address owner,
    address to,
    uint256 amount,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) public {
    permit(owner, msg.sender, amount, deadline, v, r, s);
    transferFrom(owner, to, amount);
  }

  function permitBurnFrom(
    address owner,
    uint256 amount,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) public {
    permit(owner, msg.sender, amount, deadline, v, r, s);
    burnFrom(owner, amount);
  }

  //將地址加入黑名單
  function addBlackList(address _evilUser) public onlyRole(DEFAULT_ADMIN_ROLE) {
    isBlackListed[_evilUser] = true;
    //emit event
    emit AddedBlackList(_evilUser);
  }

  //將地址從黑名單中移除
  function removeBlackList(address _clearedUser) public onlyRole(DEFAULT_ADMIN_ROLE) {
    isBlackListed[_clearedUser] = false;
    emit RemovedBlackList(_clearedUser);
  }

  //在轉移代幣前,先檢查地址是否處於黑名單中,影響的function有transfer,transferFrom,mint,burn
  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 amount
  ) internal override whenNotPaused {
    //檢查地址是否處於黑名單中
    require(!isBlackListed[from]);
    require(!isBlackListed[to]);
    super._beforeTokenTransfer(from, to, amount);
  }

  //檢查地址是否是黑名單地址
  function getBlackListStatus(address _maker) public view returns (bool) {
    return isBlackListed[_maker];
  }

}
