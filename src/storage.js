var q = require("q");
var Datastore = require("nedb");

exports.auctionStorage = createAuctionsStorage;

function createAuctionsStorage() {
    var db = new Datastore({ filename: "auctions.db", autoload: true });
    
    var find = q.nbind(db.find, db);
    var update = q.nbind(db.update, db);
    var findOneBy = function(criteria) {
        return find(criteria)
            .then(function(auctions) {
                return auctions[0];
            });
    };
    
    return {
        save: function(auction) {
            return update({ id: auction.id, owner: auction.owner }, auction, { upsert: true });
        },
        update: function(owner, id, props) {
            return update({ owner, id }, { $set: props });
        },
        findOne: function(id) {
            return findOneBy({ _id: id });
        },
        findOneBy: findOneBy,
        findAll: function(owner, query) {
            var cursor = db
                .find(Object.assign({ owner }, query))
                .sort({ endingTime: -1 });
            
            return q.nbind(cursor.exec, cursor)();
        }
    };
}
