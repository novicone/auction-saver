const inspect = require("util").inspect;
const _ = require("lodash");
const q = require("q");

exports.createSaveAuctionAction = function createSaveAuctionAction(getAuctionId, fetchOwnersAuction, saveAuction, markExpired) {
    return function saveAuctionAction(session, login, url) {
        return getAuctionId(login, url)
            .then(id => fetchOwnersAuction(session, login, id)
                .catch(error => {
                    switch(faultcode(error)) {
                        case "ERR_INVALID_ITEM_ID":
                            return markExpired(login, id)
                                .then(() => { throw error; });
                        default:
                            throw error;
                    }
                }))
            .then(saveAuction);
    };
};

function faultcode(error) {
    return _.get(error, "root.Envelope.Body.Fault.faultcode");
}

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

exports.markExpired = function markExpired(auctionStorage, owner, id) {
    return auctionStorage.update(owner, id, { expired: true });
}
