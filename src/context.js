var _ = require("lodash");
var q = require("q");

var api = require("./api");
var utils = require("./utils");
var auctions = require("./auctions");
var download = require("./download");
var storage = require("./storage");

var createPathGenerator = require("./pathGenerator").create;
var createIdParser = require("./idParser").create;

var createSaveAuctionAction = auctions.createSaveAuctionAction;
var createOwnersAuctionFetcher = auctions.createOwnersAuctionFetcher;
var createAuctionSaver = auctions.createAuctionSaver;
var createImagesSaver = auctions.createImagesSaver;

exports.create = function createContext(config) {
    var apiProvider = utils.createLazyProvider(function() {
        return api.initialize(config.allegroWebapi);
    });
    var apiMethod = _.partial(api.method, apiProvider);
    var auctionStorage = storage.auctionStorage();
    
    var idPatterns = config.idPatterns.map(function(pattern) { return new RegExp(pattern); });
    var getAuctionId = createAuctionIdGetter(auctionStorage.findOneBy, createIdParser(idPatterns));
    var fetchOwnersAuction = createOwnersAuctionFetcher(apiMethod("fetchAuction"));
    var generatePath = createPathGenerator("images");
    var saveImages = createImagesSaver(generatePath, download);
    var saveAuction = createAuctionSaver(auctionStorage.save, saveImages);
    var saveAuctionAction = createSaveAuctionAction(getAuctionId, fetchOwnersAuction, saveAuction);

    return {
        login: apiMethod("login"),
        auctionStorage,
        generatePath,
        saveImages,
        saveAuctionAction
    };
};

function createAuctionIdGetter(findAuction, parseId) {
    return function getAuctionId(login, url) {
        var id = parseId(url);
        
        if (!id) {
            throw { message: "WRONG_ID", status: 400 };
        }
        
        return findAuction({ id: id, owner: login })
            .then(function(auction) {
                if (auction && auction.finished) {
                    throw { message: "ALREADY_SAVED", status: 406 };
                }
                return id;
            });
    };
}
