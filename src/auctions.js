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

exports.getValidAuctionId = ({ findOneBy }, parseId) =>
    (owner, url) =>
        parseId(url)
            .cata({
                Nothing: () => raise(400, "WRONG_ID"),
                Just: id =>
                    findOneBy({ id, owner, finished: true })
                        .then(auction =>
                            auction
                                ? raise(406, "ALREADY_SAVED")
                                : id)
            });

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
            .then(liftM(auction => assign({ }, auction, { owner })));
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
