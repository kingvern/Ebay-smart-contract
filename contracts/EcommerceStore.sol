pragma solidity ^0.4.18;

import "contracts/Escrow.sol";
contract EcommerceStore {
  enum ProductStatus {
    Open,
    Sold,
    Unsold
  }
  enum ProductCondition {
    New,
    Used
  }
  uint public productIndex;

  mapping (address => mapping(uint => Product)) stores; // 卖家 产品ID 产品
  mapping (uint => address) productIdInStore; // 产品ID 卖家
  mapping (uint => address) productEscrow; // 仲裁

  struct Bid {
    address bidder;
    uint productId;
    uint value;
    bool revealed;
  }

  struct Product {
    uint id; //产品id
    string name; //产品名字
    string category; //分类
    string imageLink; //图片hash
    string descLink; //描述信息的hash
    uint auctionStartTime; //开始竞标的时间
    uint auctionEndTime; // 竞标结束时间
    uint startPrice; // 初始价格
    address highestBidder; // 最高价者地址
    uint highestBid; // 最高价
    uint secondHighestBid; // 次高价
    uint totalBids; // 参与竞标人数
    ProductStatus status; //竞标状态
    ProductCondition condition; // 新、旧条件

    mapping (address => mapping (bytes32 => Bid)) bids; // 买家 加密哈希 => 竞标
  }

  function EcommerceStore() public {
    productIndex = 0;
  }

   function numberOfItems() returns (uint) {
  return productIndex;
 }
 event bidCast(address bidder, uint productId, uint value);
 function bid2() returns (bool) {
  // bidCast(msg.sender, 1, 2);
  return true;
 }

  event NewProduct(uint _productId, string _name, string _category, string _imageLink, string _descLink,
    uint _auctionStartTime, uint _auctionEndTime, uint _startPrice, uint _productCondition);


  

  /* 投标 */
  function bid(uint _productId, bytes32 _bid) payable public returns(bool) {
    Product storage product = stores[productIdInStore[_productId]][_productId];
    require(now >= product.auctionStartTime);
    require(now <= product.auctionEndTime);
    require(msg.value > product.startPrice);
    require(product.bids[msg.sender][_bid].bidder == 0);
    product.bids[msg.sender][_bid] = Bid(msg.sender, _productId, msg.value, false);
    product.totalBids += 1;
    return true;
  }

  /* 揭标 */
  function revealBid(uint _productId, string _amount, string _secret) public {
    Product storage product = stores[productIdInStore[_productId]][_productId];
    require(now > product.auctionEndTime);
    bytes32 sealedBid = sha3(_amount, _secret);
    Bid memory bidInfo = product.bids[msg.sender][sealedBid];
    require(bidInfo.bidder > 0); //0xf55 uint160
    require(bidInfo.revealed == false);
    uint refund; // 退款
    uint amount = stringToUint(_amount);
    if (bidInfo.value < amount) { //mask  < actual
      refund = bidInfo.value;
    } else {
      if (address(product.highestBidder) == 0) {
        product.highestBidder = msg.sender;
        product.highestBid = amount;
        product.secondHighestBid = product.startPrice;
        refund = bidInfo.value - amount; // mask 20 actual 10.5
      } else {
        // 15  mask 25
        if (amount > product.highestBid) {
          product.secondHighestBid = product.highestBid;
          product.highestBidder.transfer(product.highestBid);
          product.highestBidder = msg.sender;
          product.highestBid = amount; //15
          refund = bidInfo.value - amount; // 20 - 15
        } else if (amount > product.secondHighestBid) {
          // 13   18
          product.secondHighestBid = amount; //13
          refund = amount; //
        } else {
          refund = amount;
        }
      }
      if (refund > 0) {
        msg.sender.transfer(refund);
        product.bids[msg.sender][sealedBid].revealed = true;
      }
    }
  }
  /* 通过产品ID获取最高出价者信息 最高价 次高价 */
  function highestBidderInfo(uint _productId) view public returns(address, uint, uint) {
    Product memory product = stores[productIdInStore[_productId]][_productId];
    return (product.highestBidder, product.highestBid, product.secondHighestBid);
  }
  /* 通过产品ID获取竞标总人数 */
  function totalBids(uint _productId) view public returns (uint) {
    Product memory product = stores[productIdInStore[_productId]][_productId];
    return product.totalBids;
  }
  /* 文字转数字 */
  function stringToUint(string s) pure private returns (uint) {
    bytes memory b = bytes(s);
    uint result = 0;
    for (uint i = 0; i < b.length; i++) {
      if (b[i] >= 48 && b[i] <= 57) {
        result = result * 10 + (uint(b[i]) - 48);
      }
    }
    return result;
  }
/*  添加产品到商店  */
  function addProductToStore(string _name, string _category, string _imageLink, string _descLink, uint _auctionStartTime, uint _auctionEndTime, uint _startPrice, uint _productCondition) public {
    require(_auctionStartTime < _auctionEndTime);
    productIndex += 1;
    Product memory product = Product(productIndex, _name, _category, _imageLink, _descLink, _auctionStartTime, _auctionEndTime, _startPrice, 0, 0, 0, 0, ProductStatus.Open, ProductCondition(_productCondition));
    stores[msg.sender][productIndex] = product;
    productIdInStore[productIndex] = msg.sender;

    NewProduct(productIndex, _name, _category, _imageLink, _descLink, 
      _auctionStartTime, _auctionEndTime, _startPrice, _productCondition);
  }
  /* 通过产品ID获取产品信息 */
  // function getProduct(uint _productId) returns(uint, string, string, string, 
  //   string, uint, uint, uint, ProductStatus, ProductCondition, uint) {

  //   Product memory product = stores[productIdInStore[_productId]][_productId];
  //   return (product.id, product.name, product.category, product.imageLink, product.descLink, 
  //     product.auctionStartTime, product.auctionEndTime, product.startPrice, product.status, product.condition, product.secondHighestBid);
  // }
   function getProduct(uint _productId) returns (uint, string, string, string, string, uint, uint, uint, ProductStatus, ProductCondition) {
  Product memory product = stores[productIdInStore[_productId]][_productId];
  return (product.id, product.name, product.category, product.imageLink, product.descLink, product.auctionStartTime, product.startPrice, product.secondHighestBid, product.status, product.condition);
  }
  function getHighestPrice(uint _productId) returns (uint) {
  Product memory product = stores[productIdInStore[_productId]][_productId];
  return (product.secondHighestBid);
  }

  function finalizeAuction(uint _productId) public {
    Product memory product = stores[productIdInStore[_productId]][_productId];
    require(now > product.auctionEndTime);
    require(product.status == ProductStatus.Open);
    require(product.highestBidder != msg.sender);
    require(productIdInStore[_productId] != msg.sender);
    if (product.totalBids == 0) {
      product.status = ProductStatus.Unsold;
    } else {
      Escrow escrow = (new Escrow).value(product.secondHighestBid)(_productId, product.highestBidder, productIdInStore[_productId], msg.sender);
      productEscrow[_productId] = address(escrow);
      product.status = ProductStatus.Sold;
      uint refund = product.highestBid - product.secondHighestBid;
      product.highestBidder.transfer(refund);
    }
  }

  function escrowAddressForProduct(uint _productId) view public returns (address) {
    return productEscrow[_productId];
  }

  function escrowInfo(uint _productId) view public returns (address, address, address, bool, uint, uint) {
    return Escrow(productEscrow[_productId]).escrowInfo();
  }

  // 付款
  function releaseAmountToSeller(uint _productId) public {
    Escrow(productEscrow[_productId]).releaseAmountToSeller(msg.sender);
  }
  // 退款
  function refundAmountToBuyer(uint _productId) public {
    Escrow(productEscrow[_productId]).refundAmountToBuyer(msg.sender);
  }


}
