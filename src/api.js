var q = require("q");
var soap = require("soap");

exports.initialize = initializeApi;
exports.method = createApiMethod;

function initializeApi(config) {
    var call;

    function querySysStatus() {
        return call("doQuerySysStatus", {
            sysvar: 1,
            countryId: 1,
            webapiKey: config.key
        });
    }

    function loginEnc(credentials, verKey) {
        return call("doLoginEnc", {
            userLogin: credentials.login,
            userHashPassword: credentials.password,
            countryCode: 1,
            webapiKey: config.key,
            localVersion: verKey
        });
    }
    
    return q.denodeify(soap.createClient)(config.wsdl)
        .then(function (client) {
            call = caller(client);

            return {
                login: function(credentials) {
                    return querySysStatus()
                        .then(function(status) {
                            return loginEnc(credentials, status.verKey);
                        }) 
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
    var itReservePrice = parseFloat(item.itReservePrice);
    return {
        id: item.itId,
        name: item.itName,
        price: parseFloat(item.itPrice) || parseFloat(item.itBuyNowPrice),
        seller: item.itSellerLogin,
        endingTime: parseInt(item.itEndingTime, 10),
        finished: item.itEndingInfo !== 1,
        sold: item.itBidCount > 0 && itReservePrice !== -1,
        reservePrice: itReservePrice < 0,
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

function caller(client) {
    return function call(name, params) {
        console.log(name, params);
        return q.denodeify(client[name])(params)
            .then(function(results) {
                return results[0];
            });
    };
}
