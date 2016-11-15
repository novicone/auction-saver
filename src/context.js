const _ = require("lodash");
const q = require("q");

const allegroClient = require("./allegroClient");
const utils = require("./utils");
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
    const allegroClientProvider = utils.createLazyProvider(
        () => allegroClient.initialize(allegroWebapi));
    const allegroClientMethod = _.partial(allegroClient.method, allegroClientProvider);
    const auctionStorage = storage.auctionStorage();
    
    const idRegExps = idPatterns.map(pattern => new RegExp(pattern));
    const getAuctionId = createAuctionIdGetter(auctionStorage.findOneBy, createIdParser(idRegExps));
    const fetchOwnersAuction = createOwnersAuctionFetcher(allegroClientMethod("fetchAuction"));
    const generatePath = createPathGenerator("images");
    const saveImages = createImagesSaver(generatePath, download);
    const saveAuction = createAuctionSaver(auctionStorage.save, saveImages);
    const saveAuctionAction = createSaveAuctionAction(getAuctionId, fetchOwnersAuction, saveAuction, markExpired(auctionStorage));

    return {
        login: allegroClientMethod("login"),
        auctionStorage,
        generatePath,
        saveImages,
        saveAuctionAction
    };
};

function createAuctionIdGetter(findAuction, parseId) {
    return function getAuctionId(login, url) {
        const id = parseId(url);
        
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
