var _ = require("lodash");
var q = require("q");

var api = require("./api");
var utils = require("./utils");
var auctions = require("./auctions");
var download = require("./download");
var storage = require("./storage");
var createPathGenerator = require("./pathGenerator").create;

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

    return {
        login: apiMethod("login"),
        auctionStorage: auctionStorage,
        saveAuctionAction: createSaveAuctionAction(createAuctionIdGetter(auctionStorage.findOneBy),
                                                   createOwnersAuctionFetcher(apiMethod("fetchAuction")),
                                                   createAuctionSaver(auctionStorage.save,
                                                                      createImagesSaver(createPathGenerator("images"),
                                                                                        download)))
    };
};

function createAuctionIdGetter(findAuction) {
    return function getAuctionId(login, url) {
        var id = utils.parseAuctionId(url);
        
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
