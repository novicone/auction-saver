const statSync = require("fs").statSync;

const createContext = require("./context").create;

function updateImages(auctionStorage, generatePath, saveImages, owner) {
    function withImageSize(auction) {
        return {
            auction,
            imageSize: statSync(generatePath(auction.owner, auction, 1)).size
        }
    }

    return trace("findAll", () => auctionStorage.findAll(owner, { finished: true }))()
        .then(auctions => auctions
                .map(withImageSize)
                .filter(it => it.imageSize === 0)
                .map(it => it.auction))
        .then(filteredAuctions => {
            if (filteredAuctions.length === 0) {
                console.log("No auctions to update, exiting");
                return;
            }
            console.log("about to update images for %s auctions", filteredAuctions.length);
            return Promise.all(filteredAuctions
                .map(auction => saveImages(auction)
                    .catch(cause => console.warn(cause))))
        })
        .catch(cause => console.error(cause));
}

function trace(name, fn) {
    return arg => {
        console.log("Starting '%s'", name);
        return fn(arg)
            .then(res => {
                console.log("Finished '%s'", name);
                return res;
            })
            .catch(cause => {
                console.error("Failed '%s", name, cause);
                throw cause;
            });
    };
}

const owner = process.argv[2];
if (!owner) {
    console.error("Owner missing!");
    return;
}

const context = createContext({ idPatterns: [] });

updateImages(context.auctionStorage, context.generatePath, context.saveImages, owner);

