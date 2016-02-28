var q = require("q");

exports.saverFactory = createAuctionSaverFactory;

function createAuctionSaverFactory(fetchAuction, storeAuction, generatePath, download) {
    return function createAuctionSaver(sessionHandle, login) {
        function saveImages(auction) {
            return q.all(auction.images.map(function(imageUrl, i) {
                return download(imageUrl, generatePath(login, auction, i + 1));
            }));
        }
        
        return function saveAuction(id) {
            return fetchAuction(sessionHandle, id)
                .then(function(auction) {
                    auction.owner = login;
                    
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
                });
        };
    };
}
