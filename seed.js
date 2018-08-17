Eutil = require('ethereumjs-util');
EcommerceStore = artifacts.require("./EcommerceStore.sol");
module.exports = function(callback) {
 current_time = Math.round(new Date() / 1000);
 amt_1 = web3.toWei(1, 'ether');
 EcommerceStore.deployed().then(function(i) {i.addProductToStore('ipad', 'Cell Phones & Accessories', 'QmWwhhNmvtAkqD4aZhHaA4VFqE3ii5GJGFEmcMSkyBnnE8', 'QmbLRFj5U6UGTy3o9Zt8jEnVDuAw2GKzvrrv3RED9wyGRk', current_time, current_time + 86400, 2*amt_1, 0).then(function(f) {console.log(f)})});
 EcommerceStore.deployed().then(function(i) {i.addProductToStore('ipad pro', 'Cell Phones & Accessories', 'QmavgpCy9YCVJY835e6tAy2h2sAzqiSbBNDqnAibpBEVjB', 'QmbLRFj5U6UGTy3o9Zt8jEnVDuAw2GKzvrrv3RED9wyGRk', current_time, current_time + 86400, 3*amt_1, 1).then(function(f) {console.log(f)})});
 EcommerceStore.deployed().then(function(i) {i.addProductToStore('iphone 6', 'Cell Phones & Accessories', 'QmNUHKztLVxH8FLt6Dixs8yfQpLxF9fRuvSsuLtMiVaQ2D', 'QmbLRFj5U6UGTy3o9Zt8jEnVDuAw2GKzvrrv3RED9wyGRk', current_time, current_time + 86400, amt_1, 0).then(function(f) {console.log(f)})}); 
 EcommerceStore.deployed().then(function(i) {i.addProductToStore('iphone 7', 'Cell Phones & Accessories', 'QmNUHKztLVxH8FLt6Dixs8yfQpLxF9fRuvSsuLtMiVaQ2D', 'QmbLRFj5U6UGTy3o9Zt8jEnVDuAw2GKzvrrv3RED9wyGRk', current_time, current_time + 86400, 4*amt_1, 1).then(function(f) {console.log(f)})});
 EcommerceStore.deployed().then(function(i) {i.addProductToStore('iphone 8', 'Cell Phones & Accessories', 'QmNUHKztLVxH8FLt6Dixs8yfQpLxF9fRuvSsuLtMiVaQ2D', 'QmbLRFj5U6UGTy3o9Zt8jEnVDuAw2GKzvrrv3RED9wyGRk', current_time, current_time + 86400, 5*amt_1, 1).then(function(f) {console.log(f)})});
 EcommerceStore.deployed().then(function(i) {i.addProductToStore('iphone X', 'Cell Phones & Accessories', 'QmaTL3Vr9QY3APR2uVuFPv8iRnsRsFNyVpJhwNWRaB1T1c', 'QmbLRFj5U6UGTy3o9Zt8jEnVDuAw2GKzvrrv3RED9wyGRk', current_time, current_time + 86400, 5*amt_1, 1).then(function(f) {console.log(f)})});
 EcommerceStore.deployed().then(function(i) {i.addProductToStore('iphone SE', 'Cell Phones & Accessories', 'Qmc5evPwGzPWGykGzHNLUXaFwbnPftFrHDGmFJ6b7a5VQH', 'QmbLRFj5U6UGTy3o9Zt8jEnVDuAw2GKzvrrv3RED9wyGRk', current_time, current_time + 86400, 5*amt_1, 1).then(function(f) {console.log(f)})});
 EcommerceStore.deployed().then(function(i) {i.addProductToStore('iphone Accessories', 'Cell Phones & Accessories', 'QmduZra1D96u3ezJ1WqaAAMU3Na7U8TcnjKrTRu9f8sAxe', 'QmbLRFj5U6UGTy3o9Zt8jEnVDuAw2GKzvrrv3RED9wyGRk', current_time, current_time + 86400, amt_1, 1).then(function(f) {console.log(f)})});
 EcommerceStore.deployed().then(function(i) {i.productIndex.call().then(function(f){console.log(f)})});
 amt_2 = web3.toWei(80, 'ether');
 web3.eth.sendTransaction({from:web3.eth.accounts[0] , to:'0x7adad9786e7435c4901fccb2d3090795453b7daa' , value:amt_2})
}