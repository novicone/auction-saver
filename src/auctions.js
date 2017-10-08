const { assign, identity } = require("lodash");
const q = require("q");

const { raise } = require("./utils");

exports.createSaveAuctionAction = (getValidAuctionId, fetchOwnersAuction, saveAuction, markExpired) =>
    (session, login, url) =>
        getValidAuctionId(login, url)
            .then((id) => fetchOwnersAuction(session, login, id)
                .then((maybeAuction) => maybeAuction.cata({
                    Just: identity,
                    Nothing: () => markExpired(login, id)
                        .then(() => raise(404, "NOT_FOUND"))
                }))
                .then(saveAuction));

exports.getValidAuctionId = (auctionStorage, parseId) =>
    (owner, url) =>
        parseId(url)
            .cata({
                Nothing: () => raise(400, "WRONG_ID"),
                Just: (id) =>
                    auctionStorage.findOneBy({ id, owner, finished: true })
                        .then(auction =>
                            auction
                                ? raise(409, "ALREADY_SAVED")
                                : id)
            });

exports.createAuctionSaver = function createAuctionSaver(auctionStorage, saveImages) {
    return (auction) => 
        auctionStorage.save(auction)
            .then(() => auction.finished && saveImages(auction))
            .then(() => auction);
};

exports.createOwnersAuctionFetcher = function createOwnersAuctionFetcher(fetchAuction) {
    return function fetchOwnersAuction(session, login, id) {
        return fetchAuction(session, id)
            .then(liftM(auction => assign(auction, { owner: login })));
    };
};

exports.createImagesSaver = function createImagesSaver(generatePath, download) {
    return function saveImages(auction) {
        return q.all(auction.images
            .map((imageUrl, i) => download(imageUrl, generatePath(auction.owner, auction, i + 1))));
    };
};

exports.markExpired = function markExpired(auctionStorage, owner, id) {
    return auctionStorage.update(owner, id, { expired: true });
}

function liftM(fn) {
    return m => m.map(fn);
}
