const _ = require("lodash");
const q = require("q");

const allegroClientModule = require("./allegroClient");
const { createLazyProvider, raise } = require("./utils");
const auctions = require("./auctions");
const download = require("./download");
const storage = require("./storage");
const AllegroOAuthRequests = require("./auth/AllegroOAuthRequests");

const createPathGenerator = require("./pathGenerator").create;
const createIdParser = require("./idParser").create;

const createSaveAuctionAction = auctions.createSaveAuctionAction;
const createOwnersAuctionFetcher = auctions.createOwnersAuctionFetcher;
const createAuctionSaver = auctions.createAuctionSaver;
const createImagesSaver = auctions.createImagesSaver;
const markExpired = _.curry(auctions.markExpired);

exports.create = function createContext({ oAuth, allegroWebapi, idPatterns }) {
    const allegroClient = makeAllegroClient(allegroWebapi, "login", "getMyData", "fetchAuction", "getUserLogin", "loginWithAccessToken");

    const auctionStorage = storage.auctionStorage();
    
    const idRegExps = idPatterns.map(pattern => new RegExp(pattern));
    const fetchOwnersAuction = createOwnersAuctionFetcher(allegroClient.fetchAuction);
    const generatePath = createPathGenerator("images");
    const saveImages = createImagesSaver(generatePath, download);
    const saveAuction = createAuctionSaver(auctionStorage, saveImages);
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
        allegroClient,
        oAuthRequests: new AllegroOAuthRequests(oAuth)
    };
};

function makeAllegroClient(allegroWebapi, ...methods) {
    const provider = createLazyProvider(
        () => allegroClientModule.initialize(allegroWebapi));
    const makeMethod = _.partial(allegroClientModule.method, provider);

    return _.mapValues(_.keyBy(methods), makeMethod);
}
