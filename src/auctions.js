var q = require("q");

exports.saverFactory = createAuctionSaverFactory;

function createAuctionSaverFactory(getAuction, storeAuction, generatePath, download) {
    return function createAuctionSaver(sessionHandle, login) {
        function saveImages(auction) {
            return q.all(auction.images.map(function(imageUrl, i) {
                return download(imageUrl, generatePath(login, auction, i + 1));
            }));
        }
        
        return function saveAuction(id) {
            return getAuction(sessionHandle, id)
                .then(function(auction) {
                    auction.owner = login;
                    
                    return storeAuction(auction)
                        .then(function() {
                            saveImages(auction);
                        });
                });
        };
    };
}