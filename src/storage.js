var q = require("q");
var Datastore = require("nedb");

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

