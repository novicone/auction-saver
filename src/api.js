var q = require("q");
var soap = require("soap");

exports.initialize = initializeApi;
exports.method = createApiMethod;

function initializeApi(config) {
    var client;
    
    function call(name, params) {
        console.log(name, params);
        return q.denodeify(client[name])(params)
            .then(function(results) {
                return results[0];
            });
    }
    
    return q.denodeify(soap.createClient)(config.wsdl)
        .then(function (value) {
            client = value;
            return call("doQuerySysStatus", {
                sysvar: 1,
                countryId: 1,
                webapiKey: config.key
            });
        })
        .then(function(status) {
            return {
                login: function(credentials) {
                    var params = {
                        userLogin: credentials.login,
                        userHashPassword: credentials.password,
                        countryCode: 1,
                        webapiKey: config.key,
                        localVersion: status.verKey
                    };
                    return call("doLoginEnc", params)
                        .then(function(info) {
                            return info.sessionHandlePart;
                        });
                },
                getAuction: function(sessionHandle, id) {
                    var params = {
                        sessionHandle: sessionHandle,
                        itemId: id,
                        getDesc: 1,
                        getImageUrl: 1,
                    };
                    return call("doShowItemInfoExt", params)
                        .then(mapInfoToAuction);
                }
            };
        });
}

function mapInfoToAuction(info) {
    var item = info.itemListInfoExt;
    return {
        id: item.itId,
        name: item.itName,
        price: parseFloat(item.itPrice) || parseFloat(item.itBuyNowPrice),
        seller: item.itSellerLogin,
        endingTime: parseInt(item.itEndingTime, 10),
        finished: item.itEndingInfo !== 1,
        sold: item.itBidCount > 0 && item.itReservePrice != -1,
        images: info.itemImgList.item
            .filter(function(image) {
                return image.imageType === 3;
            })
            .map(function(image) {
                return image.imageUrl;
            })
    };
}

function createApiMethod(provideApi, name) {
    return function() {
        var args = arguments;
        return provideApi()
            .then(function(api) {
                return api[name].apply(api, args);
            });
    };
}
