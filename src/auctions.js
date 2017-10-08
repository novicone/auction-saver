const { assign } = require("lodash");

const { raise } = require("./utils");
                
exports.createSaveAuctionAction = (fetchAuction, auctionStorage, saveImages) =>
    (session, owner, id) => {
        const doSaveAuction = () => 
            checkNotAlreadySaved()
                .then(doFetch)
                .then(liftCata({
                    Nothing: handleNoAuction,
                    Just: (auction) => save(auction).then(() => auction)
                }));

        const checkNotAlreadySaved = () => 
            auctionStorage.findOneBy({ id, owner, finished: true })
                .then((auction) => auction && raise(409, "ALREADY_SAVED"));
        
        const doFetch = () =>
            fetchAuction(session, id)
                .then(liftM(auction => assign(auction, { owner })));

        const handleNoAuction = () =>
            auctionStorage.update(owner, id, { expired: true })
                .then(() => raise(404, "NOT_FOUND"));

        const save = (auction) => 
            auctionStorage.save(auction)
                .then(() => auction.finished && saveImages(auction));

        return doSaveAuction();
    };

exports.createImagesSaver = function createImagesSaver(generatePath, download) {
    return (auction) =>
        Promise.all(auction.images
            .map((imageUrl, i) =>
                download(imageUrl, generatePath(auction, i + 1))));
};

exports.parsedId = (parseId) => (url) => parseId(url) || raise(400, "WRONG_ID");

function liftM(fn) {
    return (m) => m.map(fn);
}

function liftCata(mapper) {
    return (foldable) => foldable.cata(mapper);
}
