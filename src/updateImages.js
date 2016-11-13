const statSync = require("fs").statSync;
const Maybe = require("data.maybe");

const createContext = require("./context").create;

function updateImages(auctionStorage, generatePath, saveImages, owner) {
    function withImageSize(auction) {
        return {
            auction,
            imageSize:
                maybeStat(generatePath(auction.owner, auction, 1))
                    .map(it => it.size)
                    .getOrElse(-1)
        }
    }

    return auctionStorage.findAll(owner, { finished: true })
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
            return sequence(filteredAuctions
                .map(auction => () => saveImages(auction)
                    .then(() => console.log("Downloaded images for auction %s", auction.id))
                    .catch(cause => console.warn(cause))))
        })
        .catch(cause => console.error(cause));
}

function maybeStat(path) {
    try {
        return Maybe.Just(statSync(path));
    } catch(error) {
        console.warn(error.message);
        return Maybe.Nothing();
    }
}

function sequence(providers) {
    return providers.reduce((promise, provider) => promise.then(provider), Promise.resolve());
}

const owner = process.argv[2];
if (!owner) {
    console.error("Owner missing!");
    return;
}

const context = createContext({ idPatterns: [] });

updateImages(context.auctionStorage, context.generatePath, context.saveImages, owner);

