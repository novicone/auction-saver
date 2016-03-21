var _ = require("lodash");
var q = require("q");

exports.createSaveAuctionAction = function createSaveAuctionAction(getAuctionId, fetchOwnersAuction, saveAuction) {
    return function saveAuctionAction(session, login, url) {
        return q(url)
            .then(_.partial(getAuctionId, login))
            .then(_.partial(fetchOwnersAuction, session, login))
            .then(saveAuction);
    };
};

exports.createAuctionSaver = function createAuctionSaver(storeAuction, saveImages) {
    return function saveAuction(auction) {
        var storePromise = auction.finished
            ? storeAuction(auction)
                .then(function() {
                    saveImages(auction);
                })
            : storeAuction(auction);

        return storePromise
            .then(function() {
                return auction;
            });
    };
};

exports.createOwnersAuctionFetcher = function createOwnersAuctionFetcher(fetchAuction) {
    return function fetchOwnersAuction(sessionHandle, owner, id) {
        return fetchAuction(sessionHandle, id)
            .then(function(auction) {
                return _.assign(auction, { owner: owner });
            });
    };
};

exports.createImagesSaver = function createImagesSaver(generatePath, download) {
    return function saveImages(auction) {
        return q.all(auction.images.map(function(imageUrl, i) {
            return download(imageUrl, generatePath(auction.owner, auction, i + 1));
        }));
    };
};
