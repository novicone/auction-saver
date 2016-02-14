var q = require("q");

exports.createAuctionFetcher = createAuctionFetcher;

function createAuctionSaver(fetchAuction, storeAuction, generatePath, download) {
    function saveImages(auction) {
        q.all(auction.images.map(function(imageUrl, i) {
            return download(imageUrl, generatePath(auction, i));
        }));
    }
    
    return function saveAuction(auctionId) {
        fetchAuction(auctionId)
            .then(function(auction) {
                return storeAuction(auction)
                    .then(function() {
                        return saveImages(auction.images);
                    });
            });
    };
}

function createAuctionFetcher(provideApi, sessionStore) {
    function getAuction(session, id) {
        return provideApi()
            .then(function(api) {
                return api.getAuction(session, id);
            });
    }
    
    return function fetchAuction(credentials, id) {
        return sessionStore.get(credentials)
            .then(function(session) {
                return getAuction(session, id);
            })
            .catch(function(error) {
                if (error.code === "ERR_SESSION_EXPIRED") {
                    return sessionStore.invalidateAndGet(credentials)
                        .then(function(session) {
                            return getAuction(session, id);
                        });
                }
                throw error;
            });
    };
}
