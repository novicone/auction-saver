const _ = require("lodash");
const q = require("q");

const allegroClient = require("./allegroClient");
const { createLazyProvider, raise } = require("./utils");
const auctions = require("./auctions");
const download = require("./download");
const storage = require("./storage");

const createPathGenerator = require("./pathGenerator").create;
const createIdParser = require("./idParser").create;

const createSaveAuctionAction = auctions.createSaveAuctionAction;
const createOwnersAuctionFetcher = auctions.createOwnersAuctionFetcher;
const createAuctionSaver = auctions.createAuctionSaver;
const createImagesSaver = auctions.createImagesSaver;
const markExpired = _.curry(auctions.markExpired);

exports.create = function createContext({ allegroWebapi, idPatterns }) {
    const allegroClientProvider = createLazyProvider(
        () => allegroClient.initialize(allegroWebapi));
    const allegroClientMethod = _.partial(allegroClient.method, allegroClientProvider);
    const auctionStorage = storage.auctionStorage();
    
    const idRegExps = idPatterns.map(pattern => new RegExp(pattern));
    const fetchOwnersAuction = createOwnersAuctionFetcher(allegroClientMethod("fetchAuction"));
    const generatePath = createPathGenerator("images");
    const saveImages = createImagesSaver(generatePath, download);
    const saveAuction = createAuctionSaver(auctionStorage.save, saveImages);
    const saveAuctionAction = createSaveAuctionAction(fetchOwnersAuction, saveAuction, markExpired(auctionStorage));

    return {
        login: allegroClientMethod("login"),
        parseId: createIdParser(idRegExps),
        auctionStorage,
        generatePath,
        saveImages,
        saveAuctionAction
    };
};

function createAuctionIdGetter(findAuction, parseId) {
    return function getAuctionId(owner, url) {
        return parseId(url)
            .cata({
                Nothing: () => raise(400, "WRONG_ID"),
                Just: id =>
                    findAuction({ id, owner, finished: true })
                        .then(auction =>
                            auction
                                ? raise(406, "ALREADY_SAVED")
                                : id)
            });
    };
}
