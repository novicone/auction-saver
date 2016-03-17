var q = require("q");

exports.createAuctionSaver = createAuctionSaver;
exports.createOwnersAuctionFetcher = createOwnersAuctionFetcher;
exports.createImagesSaver = createImagesSaver;

function createAuctionSaver(storeAuction, saveImages) {
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
}

function createOwnersAuctionFetcher(fetchAuction) {
    return function fetchOwnersAuction(sessionHandle, login, id) {
        return fetchAuction(sessionHandle, id)
            .then(function(auction) {
                auction.owner = login;
                return auction;
            });
    };
}

function createImagesSaver(generatePath, download) {
    return function saveImages(auction) {
        return q.all(auction.images.map(function(imageUrl, i) {
            return download(imageUrl, generatePath(auction.owner, auction, i + 1));
        }));
    };
}
