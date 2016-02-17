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
        
        return promises[sessionKey] = provideApi()
            .then(function(api) {
                return api.login(credentials);
            })
            .then(function(session) {
                return sessions[sessionKey] = session;
            });
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
    
    var find = q.denodeify(db.find.bind(db));
    
    return {
        save: function(auction) {
            auction._id = auction.id;
            
            return q.denodeify(db.insert.bind(db))(auction);
        },
        findOne: function(id) {
            return find({ id: id })
                .then(function(auctions) {
                    return auctions[0];
                });
        },
        findAll: find
    };
}

