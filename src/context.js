const { partial, mapValues, keyBy } = require("lodash");

const allegroClientModule = require("./allegroClient");
const { createLazyProvider } = require("./utils");
const auctions = require("./auctions");
const download = require("./download");
const storage = require("./storage");
const AllegroOAuthRequests = require("./auth/AllegroOAuthRequests");

const createPathGenerator = require("./pathGenerator").create;
const createIdParser = require("./idParser").create;

const pushAuctions = require("./pushAuctions");

const createSaveAuctionAction = auctions.createSaveAuctionAction;
const createImagesSaver = auctions.createImagesSaver;

exports.create = function createContext(config) {
    const { oAuth, allegroWebapi, idPatterns, imagesDir, push } = config;
    
    const { pushBacklog } = pushAuctions.create(push);

    const allegroClient = makeAllegroClient(allegroWebapi, "login", "getMyData", "fetchAuction", "getUserLogin", "loginWithAccessToken");
    const auctionStorage = storage.auctionStorage();
    
    const idRegExps = idPatterns.map(pattern => new RegExp(pattern));
    const generatePath = createPathGenerator(imagesDir);
    const saveImages = createImagesSaver(generatePath, download);
    const saveAuctionAction = createSaveAuctionAction(
        allegroClient.fetchAuction,
        auctionStorage,
        saveImages,
        (data) => pushBacklog.add(data));

    return {
        allegroClient,
        auctionStorage,
        generatePath,
        saveImages,
        parsedId: auctions.parsedId(createIdParser(idRegExps)),
        saveAuctionAction,
        oAuthRequests: new AllegroOAuthRequests(oAuth)
    };
};

function makeAllegroClient(allegroWebapi, ...methods) {
    const provider = createLazyProvider(
        () => allegroClientModule.initialize(allegroWebapi));
    const makeMethod = partial(allegroClientModule.method, provider);

    return mapValues(keyBy(methods), makeMethod);
}
