const { assign, identity } = require("lodash");

const { raise } = require("./utils");

exports.createSaveAuctionAction = (parseId, fetchAuction, auctionStorage, saveImages) =>
    (session, owner, url) =>
        parseId(url)
            .cata({
                Just: (id) => auctionStorage.findOneBy({ id, owner, finished: true })
                    .then((auction) => auction && raise(409, "ALREADY_SAVED"))
                    .then(() => id),
                Nothing: () => raise(400, "WRONG_ID")
            })
            .then((id) => fetchAuction(session, id)
                .then(liftM(auction => assign(auction, { owner })))
                .then((maybeAuction) => maybeAuction.cata({
                    Just: (auction) => auctionStorage.save(auction)
                        .then(() => auction.finished && saveImages(auction))
                        .then(() => auction),
                    Nothing: () => auctionStorage.update(owner, id, { expired: true })
                        .then(() => raise(404, "NOT_FOUND"))
                })));

exports.createImagesSaver = function createImagesSaver(generatePath, download) {
    return function saveImages(auction) {
        return Promise.all(auction.images
            .map((imageUrl, i) => download(imageUrl, generatePath(auction, i + 1))));
    };
};

function liftM(fn) {
    return m => m.map(fn);
}
