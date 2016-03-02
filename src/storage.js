var q = require("q");
var Datastore = require("nedb");

var utils = require("./utils");

exports.createSessionStorage = createSessionStorage;
exports.auctionStorage = createAuctionsStorage;

function createSessionStorage(provideApi) {
    var sessions = { };
    var promises = { };
    
    function get(credentials) {
        var sessionKey = key(credentials);
        
        if (sessions[sessionKey]) {
            return q(sessions[sessionKey]);
        }
        if (promises[sessionKey]) {
            return promises[sessionKey];
        }
        
        return (promises[sessionKey] = provideApi()
            .then(function(api) {
                return api.login(credentials);
            })
            .then(function(session) {
                return (sessions[sessionKey] = session);
            }));
    }
    
    return {
        get: get,
        invalidateAndGet: function(credentials) {
            delete sessions[key(credentials)];
            
            return get(credentials);
        }
    };
}

function key(obj) {
    return JSON.stringify(obj);
}

function createAuctionsStorage() {
    var db = new Datastore({ filename: "auctions.db", autoload: true });
    
    var find = q.nbind(db.find, db);
    var update = q.nbind(db.update, db);
    var insert = q.nbind(db.insert, db);
    var findOneBy = function(criteria) {
        return find(criteria)
            .then(function(auctions) {
                return auctions[0];
            });
    };
    
    return {
        save: function(auction) {
            return findOneBy({ id: auction.id, owner: auction.owner })
                .then(function(saved) {
                    if (saved) {
                        return update({ _id: saved._id }, auction, { });
                    } else {
                        return insert(auction);
                    }
                });
        },
        findOne: function(id) {
            return findOneBy({ _id: id });
        },
        findOneBy: findOneBy,
        findAll: function(owner) {
            var cursor = db.find({ owner: owner }).sort({ endingTime: -1 });
            return q.nbind(cursor.exec, cursor)();
        }
    };
}

