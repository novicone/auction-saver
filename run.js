var api = require("./src/api");
var utils = require("./src/utils");
var auctions = require("./src/auctions");
var download = require("./src/download");

var config = require("./config");

var provideApi = utils.createLazyProvider(function() {
    return api.initialize(config.allegroWebapi);
});

var generatePath = utils.createPathGenerator("images");

var login = api.method(provideApi, "login");
var getAuction = api.method(provideApi, "getAuction");

var createAuctionSaver = auctions.saverFactory(getAuction, generatePath, download);


login(config.credentials)
    .then(function(sessionHandle) {
        var saveAuction = createAuctionSaver(
            sessionHandle,
            config.credentials.login);
        
        var id = utils.parseAuctionId("http://allegro.pl/zygmunt-iii-zestaw-trojakow-1621-i-1622-krakow-i5940055701.html");
        
        return saveAuction(id);
    })
    .catch(function(error) {
        console.error(error.message);
    });
