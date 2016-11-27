const _ = require("lodash");
const q = require("q");

const allegroClientModule = require("./allegroClient");
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
    const allegroClient = makeAllegroClient(allegroWebapi, "login", "fetchAuction");

    const auctionStorage = storage.auctionStorage();
    
    const idRegExps = idPatterns.map(pattern => new RegExp(pattern));
    const fetchOwnersAuction = createOwnersAuctionFetcher(allegroClient.fetchAuction);
    const generatePath = createPathGenerator("images");
    const saveImages = createImagesSaver(generatePath, download);
    const saveAuction = createAuctionSaver(auctionStorage.save, saveImages);
    const saveAuctionAction = createSaveAuctionAction(
        auctions.getValidAuctionId(auctionStorage, createIdParser(idRegExps)),
        fetchOwnersAuction,
        saveAuction,
        markExpired(auctionStorage));

    return {
        auctionStorage,
        generatePath,
        saveImages,
        saveAuctionAction,
        allegroClient
    };
};

function makeAllegroClient(allegroWebapi, ...methods) {
    const provider = createLazyProvider(
        () => allegroClientModule.initialize(allegroWebapi));
    const makeMethod = _.partial(allegroClientModule.method, provider);

    return _.mapValues(_.keyBy(methods), makeMethod);
}
