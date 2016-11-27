const q = require("q");
const _ = require("lodash");
const soap = require("soap");
const Maybe = require("data.maybe");

exports.initialize = initializeApi;
exports.method = createApiMethod;

function initializeApi({ key, wsdl }) {
    let call;

    function querySysStatus() {
        return call("doQuerySysStatus", {
            sysvar: 1,
            countryId: 1,
            webapiKey: key
        });
    }

    function loginEnc({ login, password }, verKey) {
        return call("doLoginEnc", {
            userLogin: login,
            userHashPassword: password,
            countryCode: 1,
            webapiKey: key,
            localVersion: verKey
        });
    }
    
    return q.denodeify(soap.createClient)(wsdl)
        .then(client => {
            call = caller(client);

            return {
                login(credentials) {
                    return querySysStatus()
                        .then(({ verKey }) => loginEnc(credentials, verKey))
                        .then(({ sessionHandlePart }) => sessionHandlePart)
                },
                getMyData(sessionHandle) {
                    return call("doGetMyData", { sessionHandle });
                },
                getUserLogin(userId) {
                    return call("doGetUserLogin", {
                        countryId: 1,
                        userId,
                        webapiKey: key
                    })
                },
                loginWithAccessToken(accessToken) {
                    return call("doLoginWithAccessToken", {
                        accessToken,
                        countryCode: 1,
                        webapiKey: key
                    });
                },
                fetchAuction(sessionHandle, id) {
                    return call("doShowItemInfoExt", {
                            sessionHandle: sessionHandle,
                            itemId: id,
                            getDesc: 1,
                            getImageUrl: 1,
                        })
                        .then(info => Maybe.Just(mapInfoToAuction(info)))
                        .catch(error => {
                            switch(error.faultcode) {
                                case "ERR_INVALID_ITEM_ID":
                                    return Maybe.Nothing();
                                default:
                                    throw error;
                            }
                        });
                }
            };
        });
}

function faultcode(error) {
    return _.get(error, "root.Envelope.Body.Fault.faultcode");
}

function faultstring(error) {
    return _.get(error, "root.Envelope.Body.Fault.faultstring");
}

function mapInfoToAuction(info) {
    const item = info.itemListInfoExt;
    const itReservePrice = parseFloat(item.itReservePrice);
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
            .filter(image => image.imageType === 3)
            .map(image => image.imageUrl)
    };
}

function createApiMethod(provideApi, name) {
    return (...args) =>
        provideApi()
            .then(api => api[name](...args));
}

function caller(client) {
    return function call(name, params) {
        console.log(name, params);
        return q.denodeify(client[name])(params)
            .then(([result]) => result)
            .catch((error) => {
                throw new AllegroError(faultcode(error), faultstring(error))
            });
    };
}

class AllegroError extends Error {
    constructor(faultcode, faultstring)  {
        super(faultcode + " - " + faultstring);
        this.faultcode = faultcode;
        this.faultstring = faultstring;
    }
}
