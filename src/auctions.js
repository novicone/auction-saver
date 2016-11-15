const _ = require("lodash");
const q = require("q");

const { raise } = require("./utils");

exports.createSaveAuctionAction = function createSaveAuctionAction(fetchOwnersAuction, saveAuction, markExpired) {
    return function saveAuctionAction(session, login, id) {
        return fetchOwnersAuction(session, login, id)
            .then(maybeAuction => maybeAuction.cata({
                Just: _.identity,
                Nothing: () => markExpired(login, id)
                    .then(() => raise(404, "NOT_FOUND"))
            }))
            .then(saveAuction);
            /*
            .then(auction => storeAuction(auction)
                .then(() => auction.finished && saveImages(auction))
                .then(() => auction));
            */
    };
};

exports.createAuctionSaver = function createAuctionSaver(storeAuction, saveImages) {
    return function saveAuction(auction) {
        let storePromise = storeAuction(auction);

        if (auction.finished) {
            storePromise = storePromise.then(() => saveImages(auction));
        }

        return storePromise.then(() => auction);
    };
};

exports.createOwnersAuctionFetcher = function createOwnersAuctionFetcher(fetchAuction) {
    return function fetchOwnersAuction(sessionHandle, owner, id) {
        return fetchAuction(sessionHandle, id)
            .then(liftM(auction => _.assign({ }, auction, { owner })));
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
