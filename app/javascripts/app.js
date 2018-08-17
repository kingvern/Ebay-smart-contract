// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";


require('bootstrap-datetime-picker')


// Import libraries we need.
import {
    default as Web3
} from 'web3';
import {
    default as contract
} from 'truffle-contract'
import ecommerce_store_artifacts from '../../build/contracts/EcommerceStore.json'

var EcommerceStore = contract(ecommerce_store_artifacts);

const ipfsAPI = require('ipfs-api');
const ethUtil = require('ethereumjs-util');

const ipfs = ipfsAPI({
    host: 'localhost',
    port: '5001',
    protocol: 'http'
});

window.App = {
    start: function() {
        var self = this;
        EcommerceStore.setProvider(web3.currentProvider);
        renderStore();
        var reader;

        // 绑定监听
        // list-item.html product-image 上传图片
        $("#product-image").change(function(event) {
            const file = event.target.files[0]
            reader = new window.FileReader()
            reader.readAsArrayBuffer(file)
        });

        // list-item.html add-item-to-store 上传产品到商店
        $("#add-item-to-store").submit(function(event) {
            console.log("In add item to store");
            const req = $("#add-item-to-store").serialize();
            let params = JSON.parse('{"' + req.replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');
            let decodedParams = {}
            Object.keys(params).forEach(function(v) {
                decodedParams[v] = decodeURIComponent(decodeURI(params[v]));
            });
            saveProduct(reader, decodedParams);
            event.preventDefault();
            console.log('add-item-to-store submit finished');
        });

        // product.html 仲裁
        $("#finalize-auction").submit(function(event) {
            $("#msg").hide();
            let productId = $("#product-id").val();
            EcommerceStore.deployed().then(function(i) {
                i.finalizeAuction(parseInt(productId), {
                    // from: web3.eth.accounts[2],
                    from: msg.sender,
                    gas: 4400000
                }).then(
                    function(f) {
                        $("#msg").show();
                        $("#msg").html("The auction has been finalized and winner declared.");
                        console.log(f)
                        location.reload();
                    }
                ).catch(function(e) {
                    console.log(e);
                    $("#msg").show();
                    $("#msg").html("The auction can not be finalized by the buyer or seller, only a third party aribiter can finalize it");
                })
            });
            event.preventDefault();
        });

        // product.html bidding 投标动作
        $("#bidding").submit(function(event) {
            $("#msg").hide();
            let amount = $("#bid-amount").val();
            let sendAmount = $("#bid-send-amount").val();
            let secretText = $("#secret-text").val();
            let sealedBid = '0x' + ethUtil.sha3(web3.toWei(amount, 'ether') + secretText).toString('hex');
            let productId = $("#product-id").val();
            let userNumber = $("#user-number").val();
            console.log(sealedBid + " for " + productId + " from user: " + userNumber);
            EcommerceStore.deployed().then(function(i) {
                i.bid(parseInt(productId), sealedBid, {
                    value: web3.toWei(sendAmount),
                    from: web3.eth.accounts[userNumber],
                    gas: 440000
                }).then(
                    function(f) {
                        $("#msg").html("Your bid has been successfully submitted!");
                        $("#msg").show();
                        console.log(f)
                    }
                )
            });
            event.preventDefault();

        });


        // let elmo = function(me) {
        //     console.log("Doing BidCast");
        //     var self = me;
        //     EcommerceStore.deployed().then(function(i) {
        //         i.bidCast().watch(function(error, result) {
        //             console.log("In bidCast response.");
        //             if (error) {
        //                 console.log(error);
        //             } else {
        //                 for (var key in result) {
        //                     if (result.hasOwnProperty(key)) {
        //                         if (key !== "args") {
        //                             // console.log(key + " : " + result[key]);
        //                         } else {
        //                             let args = result["args"];
        //                             var message = "";
        //                             for (var arg in args) {

        //                                 if (args.hasOwnProperty(arg)) {
        //                                     var outcome = args[arg];
        //                                     if (arg === 'value') {
        //                                         outcome = web3.fromWei(outcome, 'ether');
        //                                     }
        //                                     message = message + " " + arg + ": " + outcome + "   ";
        //                                     //console.log("arg.. " + arg + ": " + outcome);
        //                                 }

        //                             }
        //                             $("#msg2").show();
        //                             $("#msg2").html(message);
        //                         }

        //                     }
        //                 }
        //             }
        //         })
        //     });

        // };
        // elmo(this);

        // product.html revealing 公告动作
        $("#revealing").submit(function(event) {
            $("#msg").hide();
            let amount = $("#actual-amount").val();
            let secretText = $("#reveal-secret-text").val();
            let productId = $("#product-id").val();
            let userNumber = $("#reveal-user-number").val();
            EcommerceStore.deployed().then(function(i) {
                i.revealBid(parseInt(productId), web3.toWei(amount).toString(), secretText, {
                    from: web3.eth.accounts[userNumber],
                    gas: 440000
                }).then(
                    function(f) {
                        $("#msg").show();
                        $("#msg").html("Your bid has been successfully revealed!");
                        console.log(f)
                    }
                )
            });
            event.preventDefault();
        });

        // product.html #product-details 渲染产品细节
        if ($("#product-details").length > 0) {
            //This is product details page
            console.log("Search Params = " + new URLSearchParams(window.location))
            let productId = new URLSearchParams(window.location.search).get('Id');
            console.log('id' + productId);
            renderProductDetails(productId);
        }
        // product.html 付款
        $("#release-funds").click(function() {
            let productId = new URLSearchParams(window.location.search).get('id');
            EcommerceStore.deployed().then(function(f) {
                $("#msg").html("Your transaction has been submitted. Please wait for fewseconds for the confirmation").show();
                console.log(productId);
                f.releaseAmountToSeller(productId, {
                    // from: web3.eth.accounts[0],
                    from: msg.sender,
                    gas: 440000
                }).then(function(f) {
                    console.log(f);
                    location.reload();
                }).catch(function(e) {
                    console.log(e);
                })
            });
        });

        // product.html 退款
        $("#refund-funds").click(function() {
            let productId = new URLSearchParams(window.location.search).get('id');
            EcommerceStore.deployed().then(function(f) {
                $("#msg").html("Your transaction has been submitted. Please wait for fewseconds for the confirmation").show();
                f.refundAmountToBuyer(productId, {
                    // from: web3.eth.accounts[0],
                    from: msg.sender,
                    gas: 440000
                }).then(function(f) {
                    console.log(f);
                    location.reload();
                }).catch(function(e) {
                    console.log(e);
                })
            });
            alert("refund the funds!");
        });

        $("#product-auction-start").datetimepicker();

    },

};

window.addEventListener('load', function() {
    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof web3 !== 'undefined') {
        console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
            // Use Mist/MetaMask's provider
        window.web3 = new Web3(web3.currentProvider);
        console.log(web3);
    } else {
        console.warn("No web3 detected. Falling back to http://localhost:9545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
        // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
        window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:9545"));
    }
    // window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:9545"));

    App.start();
});

// 存图片到Ipfs
function saveImageOnIpfs(reader) {
    return new Promise(function(resolve, reject) {
        const buffer = Buffer.from(reader.result);
        ipfs.add(buffer)
            .then((response) => {
                console.log(response)
                resolve(response[0].hash);
            }).catch((err) => {
                console.error(err)
                reject(err);
            })
    })
}

// 存详细信息到Ipfs
function saveTextBlobOnIpfs(blob) {
    return new Promise(function(resolve, reject) {
        const descBuffer = Buffer.from(blob, 'utf-8');
        ipfs.add(descBuffer)
            .then((response) => {
                console.log(response)
                resolve(response[0].hash);
            }).catch((err) => {
                console.error(err)
                reject(err);
            })
    })
}

// index.html 渲染 商店
function renderStore() {
    console.log('renderStore');
    renderProducts("product-list", {});
    renderProducts("product-reveal-list", {
        productStatus: "reveal"
    });
    renderProducts("product-finalize-list", {
        productStatus: "finalize"
    });
    // categories.forEach(function(value) {
    //         $("#categories").append("<div>" + value + "");
    // })

    // console.log(EcommerceStore.deployed());
    // EcommerceStore.deployed().then(function(i) {
    //     i.numberOfItems.call().then(function(i) {
    //         console.log("Number Of Items: " + i);
    //     });
    // }).catch(function(error) {
    //     console.log(error)
    // });
    // EcommerceStore.deployed().then(function(i) {
    //     for (var id = 1; id < 20; id++) {
    //         i.getProduct.call(id).then(function(p) {
    //             $("#product-list").append(buildProduct(p, 11));
    //         });
    //     }
    // });
}

// index.html 从数据库获取并渲染产品
function renderProducts(div, filters) {
    console.log('renderProducts')
    var offchainServer = 'http://localhost:3000'
    $.ajax({
        url: offchainServer + "/products",
        type: 'get',
        contentType: "application/json; charset=utf-8",
        data: filters
    }).done(function(data) {
        console.log('ajax')
        if (data.length == 0) {
            $("#" + div).html('No products found');
        } else {
            $("#" + div).html('');
        }
        while (data.length > 0) {
            let chunks = data.splice(0, 4);
            let row = $("<div/>");
            row.addClass("row");
            chunks.forEach(function(value) {
                console.log('value:');
                console.log(value);
                let node = buildProducts(value);
                row.append(node);
                console.log('node:');
                console.log(node);
            })
            $("#" + div).append(row);
            console.log(row);
        }
    })
}

// index.html 渲染单个产品到前端代码 废弃
function buildProduct(product, id) {
    let node = $("<div/>");
    node.addClass("col-sm-3 text-center col-margin-bottom-1");
    node.append("<img src='https://ipfs.io/ipfs/" + product[3] + "' heigth='250px' />");
    node.append("<div>" + product[1] + "</div>");
    node.append("<div>" + product[2] + "</div>");
    node.append("<div>" + new Date(product[5] * 1000) + "</div>");
    node.append("<div>" + new Date(product[6] * 1000) + "</div>");
    node.append("<div>Ether " + product[7] + "</div>");
    node.append("<a href='product.html?Id=" + id + "'class='btn btn-primary'>Show</a>")
    return node;
};
// index.html 渲染单个产品到前端代码 在役
function buildProducts(value) {
    let node = $("<div/>");
    node.addClass("col-sm-6 text-center col-margin-bottom-1");
    node.append("<img src='https://ipfs.io/ipfs/" + value.ipfsImageHash + "' heigth='250px' />");
    node.append("<div>" + value.name + "</div>");
    node.append("<div>" + value.category + "</div>");
    node.append("<div>" + new Date(value.auctionStartTime * 1000) + "</div>");
    node.append("<div>" + new Date(value.auctionEndTime * 1000) + "</div>");
    node.append("<div>Ether " + value.price + "</div>");
    node.append("<a href='product.html?Id=" + value.blockchainId + "'class='btn btn-primary'>Show</a>")
    return node;
};


// list-item.html  存储产品动作
function saveProduct(reader, decodedParams) {
    let imageId, descId;
    saveImageOnIpfs(reader).then(function(id) {
        imageId = id;
        saveTextBlobOnIpfs(decodedParams["product-description"]).then(function(id) {
            descId = id;
            saveProductToBlockchain(decodedParams, imageId, descId);
        })
    })
    console.log('saveProduct finished')
}

// list-item.html 将产品存进区块链（商店）其实就是写进了智能合约
function saveProductToBlockchain(params, imageId, descId) {
    console.log(params);
    let auctionStartTime = Date.parse(params["product-auction-start"]) / 1000;
    let auctionEndTime = auctionStartTime + parseInt(params["product-auction-end"]) * 60

    EcommerceStore.deployed().then(function(i) {
        i.addProductToStore(params["product-name"], params["product-category"], imageId, descId, auctionStartTime,
            auctionEndTime, web3.toWei(params["product-price"], 'ether'), parseInt(params["product-condition"]), {
                // from: web3.eth.accounts[0],
                from: msg.sender,
                gas: 440000
            }).then(function(f) {
            console.log(f);
            $("#msg").show();
            $("#msg").html("Your product was successfully added to your store!");
        })
    });
    console.log('saveProductToBlockchain finished')
}

// product.html 单个产品页面中渲染产品细节 
function renderProductDetails(productId) {
    EcommerceStore.deployed().then(function(i) {
        i.getProduct.call(productId).then(function(p) {
            console.log('p:' + p);
            let content = "";
            ipfs.cat(p[4]).then(function(stream) {
                    console.log(typeof(stream));
                    stream.setEncoding('UTF8');
                    stream.on('data', function(chunk) {
                        // do stuff with this chunk of data
                        content += chunk.toString();
                        $("#product-desc").append("<div>" + content + "</div>");
                    })
                })
                .catch((err) => {
                    console.log('Fail: ', err)
                });

            $("#product-image").append("<img src='https://ipfs.io/ipfs/" + p[3] + "' width='50px' />");
            $("#product-price").html(displayPrice(p[7]));
            // $("#product-highest-price").html(displayPrice(p[10]+0.5));
            $("#product-name").html(p[1]);
            // $("#product-auction-end").html(displayEndHours(p[6]));
            displayEndSeconds(p[6]);
            $("#product-id").val(p[0]);
            $("#revealing, #bidding, #finalize-auction, #escrow-info").hide();
            let currentTime = getCurrentTimeInSeconds();
            if (parseInt(p[8]) == 1) {
                $("#product-status").html("Product sold");
            } else if (parseInt(p[8]) == 2) {
                $("#product-status").html("Product was not sold");
            } else if (currentTime < parseInt(p[6])) {
                $("#bidding").show();
            } else if (currentTime < (parseInt(p[6]) + 600)) {
                $("#revealing").show();
            } else {
                $("#finalize-auction").show();
            }

            if (p.productStatus == 1) {
                EcommerceStore.deployed().then(function(i) {
                    $("#escrow-info").show();
                    i.highestBidderInfo.call(productId).then(function(f) {
                        if (f[2].toLocaleString() == '0') {
                            $("#product-status").html("Auction has ended. No bids were revealed");
                        } else {
                            $("#product-status").html("Auction has ended. Product sold to " + f[0] + " for " + displayPrice(f[2]) +
                                "The money is in the escrow. Two of the three participants (Buyer, Seller and Arbiter) have to " +
                                "either release the funds to seller or refund the money to the buyer");
                        }
                    })
                    i.escrowInfo.call(productId).then(function(f) {
                        $("#buyer").html('Buyer: ' + f[0]);
                        $("#seller").html('Seller: ' + f[1]);
                        $("#arbiter").html('Arbiter: ' + f[2]);
                        if (f[3] == true) {
                            $("#release-count").html("Amount from the escrow has been released");
                        } else {
                            $("#release-count").html(f[4] + " of 3 participants have agreed to release funds");
                            $("#refund-count").html(f[5] + " of 3 participants have agreed to refund the buyer");
                        }
                    })
                })
            }


        })
    })
}

//获取 当前时间 到秒
function getCurrentTimeInSeconds() {
    return Math.round(new Date() / 1000);
}

function displayPrice(amt) {
    return 'Ξ' + web3.fromWei(amt, 'ether');
}

// 显示拍卖结束时间到分钟 废弃
function displayEndHours(seconds) {
    let current_time = getCurrentTimeInSeconds()
    let remaining_seconds = seconds - current_time;

    if (remaining_seconds <= 0) {
        return "Auction has ended";
    }

    let days = Math.trunc(remaining_seconds / (24 * 60 * 60));

    remaining_seconds -= days * 24 * 60 * 60
    let hours = Math.trunc(remaining_seconds / (60 * 60));

    remaining_seconds -= hours * 60 * 60

    let minutes = Math.trunc(remaining_seconds / 60);

    if (days > 0) {
        return "Auction ends in " + days + " days, " + hours + ", hours, " + minutes + " minutes";
    } else if (hours > 0) {
        return "Auction ends in " + hours + " hours, " + minutes + " minutes ";
    } else if (minutes > 0) {
        return "Auction ends in " + minutes + " minutes ";
    } else {
        return "Auction ends in " + remaining_seconds + " seconds";
    }
}

// 显示拍卖倒计时 在役
function displayEndSeconds(theseconds) {
    // setTimeout(displayEndSeconds(theseconds), 1000);
    let intervalTimer = setInterval(() => {

        var html = '';
        var date = new Date();
        var now = date.getTime();
        // var endDate = new Date("2017-10-01 00:00:00"); //设置截止时间
        var end = theseconds * 1000;
        // console.log(now + '-' + end)
        var leftTime = end - now; //时间差                              
        var d, h, m, s, ms;
        if (leftTime >= 0) {
            d = Math.floor(leftTime / 1000 / 60 / 60 / 24);
            h = Math.floor(leftTime / 1000 / 60 / 60 % 24);
            m = Math.floor(leftTime / 1000 / 60 % 60);
            s = Math.floor(leftTime / 1000 % 60);
            // ms = Math.floor(leftTime % 1000);

            // if (ms < 100) {
            //     ms = "0" + ms;
            // }
            if (s < 10) {
                s = "0" + s;
            }
            if (m < 10) {
                m = "0" + m;
            }
            if (h < 10) {
                h = "0" + h;
            }
        } else {
            console.log('已截止')
        }

        if (leftTime <= 0) {
            clearInterval(intervalTimer);
            // do something
            html = "Auction has ended";
        } else {

            if (d > 0) {
                html = "Auction ends in " + d + " days, " + h + " , hours, " + m + " minutes, " + s + " seconds ";
            } else if (h > 0) {
                html = "Auction ends in " + h + " hours, " + m + " minutes, " + s + " seconds ";
            } else if (m > 0) {
                html = "Auction ends in " + m + " minutes, " + s + " seconds ";
            } else {
                html = "Auction ends in " + s + " seconds ";
            } 
        }

        $("#product-auction-end").html(html);

    }, 1000)


}
// 倒计时代码 参考用
function countTime() {
    var date = new Date();
    var now = date.getTime();
    var endDate = new Date("2017-10-01 00:00:00"); //设置截止时间
    var end = endDate.getTime();
    var leftTime = end - now; //时间差                              
    var d, h, m, s, ms;
    if (leftTime >= 0) {
        d = Math.floor(leftTime / 1000 / 60 / 60 / 24);
        h = Math.floor(leftTime / 1000 / 60 / 60 % 24);
        m = Math.floor(leftTime / 1000 / 60 % 60);
        s = Math.floor(leftTime / 1000 % 60);
        ms = Math.floor(leftTime % 1000);
        if (ms < 100) {
            ms = "0" + ms;
        }
        if (s < 10) {
            s = "0" + s;
        }
        if (m < 10) {
            m = "0" + m;
        }
        if (h < 10) {
            h = "0" + h;
        }
    } else {
        console.log('已截止')
    }
    //将倒计时赋值到div中
    document.getElementById("_d").innerHTML = d + "天";
    document.getElementById("_h").innerHTML = h + "时";
    document.getElementById("_m").innerHTML = m + "分";
    document.getElementById("_s").innerHTML = s + "秒";
    document.getElementById("_ms").innerHTML = ms + "毫秒";
    //递归每秒调用countTime方法，显示动态时间效果
    // setTimeout(countTime, 50);
}

// countTime();