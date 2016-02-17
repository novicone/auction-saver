var api = require("./api");
var utils = require("./utils");
var auctions = require("./auctions");
var download = require("./download");
var storage = require("./storage");

exports.create = function createConfigurator(config) {
    var provideApi = utils.createLazyProvider(function() {
        return api.initialize(config.allegroWebapi);
    });
    
    var generatePath = utils.createPathGenerator("images");
    
    var login = api.method(provideApi, "login");
    var getAuction = api.method(provideApi, "getAuction");
    
    var auctionStorage = storage.auctionStorage();
    var createAuctionSaver = auctions.saverFactory(getAuction, auctionStorage.save, generatePath, download);
    var getAuctionId = createAuctionIdGetter(auctionStorage.findOne);

    return function configure(router) {
        router.post("/login", wrapHandler(function(req) {
            return login(req.body);
        }));
        
        router.get("/auctions", wrapHandler(function(req) {
            return auctionStorage.findAll({ _owner: req.headers.login });
        }));
        
        router.post("/auctions", wrapHandler(function(req) {
            var saveAuction = createAuctionSaver(req.headers.session, req.headers.login);
            
            return getAuctionId(req)
                .then(function(id) {
                    return saveAuction(id);
                });
        }));
    };
};

function createAuctionIdGetter(findAuction) {
    return function getAuctionId(req) {
        var id = utils.parseAuctionId(req.body.url);
        
        return findAuction(id)
            .then(function(auction) {
                if (auction) {
                    throw new Error("Auction " + id + " is already saved");
                }
                return id;
            });
    };
}

function wrapHandler(handler) {
    return function handle(req, res, next) {
        handler(req)
            .then(function(result) {
                if (result === null || result === undefined) {
                    res.status(204).end();
                } else {
                    res.json(result);
                }
            })
            .catch(next);
    };
}
