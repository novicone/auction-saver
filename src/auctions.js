var q = require("q");

exports.saverFactory = createAuctionSaverFactory;

function createAuctionSaverFactory(getAuction, generatePath, download) {
    return function createAuctionSaver(sessionHandle, login) {
        return function saveAuction(id) {
            return getAuction(sessionHandle, id)
                .then(function(auction) {
                    return q.all(auction.images.map(function(imageUrl, i) {
                        return download(imageUrl, generatePath(login, auction, i + 1));
                    }));
                });
        };
    };
}