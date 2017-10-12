var q = require("q");
var Datastore = require("nedb");

exports.auctionStorage = createAuctionsStorage;

function createAuctionsStorage() {
    const db = new Datastore({ filename: "auctions.db", autoload: true });
    
    const update = q.nbind(db.update, db);
    
    return {
        save: function(auction) {
            return update({ id: auction.id, owner: auction.owner }, auction, { upsert: true });
        },
        update: function(owner, id, props) {
            return update({ owner, id }, { $set: props });
        },
        findOneBy: q.nbind(db.findOne, db),
        findAll: function(owner, query) {
            const cursor = db
                .find(Object.assign({ owner }, query))
                .sort({ endingTime: -1 });
            
            return q.nbind(cursor.exec, cursor)();
        }
    };
}
