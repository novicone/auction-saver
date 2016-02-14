var q = require("q");
var initializeApi = require("./src/api").initializeApi;
var utils = require("./src/utils");
var storage = require("./src/storage");
var auctions = require("./src/auctions");
var download = require("./src/download");

var config = require("./config");

var provideApi = utils.createLazyProvider(function() {
    return initializeApi(config.allegroWebapi.wsdl, config.allegroWebapi.key);
});

var sessionStorage = storage.createSessionStorage(provideApi);
var fetchAuction = auctions.createAuctionFetcher(provideApi, sessionStorage);

var generatePath = utils.createPathGenerator("images");

fetchAuction(config.credentials, utils.parseAuctionId("http://allegro.pl/zygmunt-iii-zestaw-trojakow-1621-i-1622-krakow-i5940055701.html"))
    .then(function(auction) {
        return q.all(auction.images.map(function(imageUrl, i) {
            return download(imageUrl, generatePath(config.credentials.login, auction, i + 1));
        }));
    })
    .catch(function(error) {
        console.error(error);
    });
