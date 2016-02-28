var q = require("q");
var express = require("express");

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
    var fetchAuction = api.method(provideApi, "fetchAuction");
    
    var auctionStorage = storage.auctionStorage();
    var createAuctionSaver = auctions.saverFactory(fetchAuction, auctionStorage.save, generatePath, download);
    var getAuctionId = createAuctionIdGetter(auctionStorage.findOneBy);

    return function configure(router) {
        router.post("/login", wrapHandler(function(req) {
            return login(req.body);
        }));
        
        var auctionsRouter = express.Router();
        
        auctionsRouter.use(function(req, res, next) {
            if (!req.headers.login || !req.headers.session) {
                return next({ message: "Forbidden", status: 403 });
            }
            next();
        });
        
        auctionsRouter.get("/", wrapHandler(function(req) {
            return auctionStorage.findAll({ owner: req.headers.login });
        }));

        auctionsRouter.post("/", wrapHandler(function(req) {
            var saveAuction = createAuctionSaver(req.headers.session, req.headers.login);
            
            return getAuctionId(req)
                .then(function(id) {
                    return saveAuction(id);
                });
        }));
        
        router.use("/auctions", auctionsRouter);
        router.use(function(err, req, res, next) {
            res.status(err.status || 500)
                .json(err.message || err);
        });
    };
};

function createAuctionIdGetter(findAuction) {
    return function getAuctionId(req) {
        var id = utils.parseAuctionId(req.body.url);
        
        if (!id) {
            return q.reject({ message: "WRONG_ID", status: 400 });
        }
        
        return findAuction({ id: id, owner: req.headers.login })
            .then(function(auction) {
                if (auction && auction.finished) {
                    throw { message: "ALREADY_SAVED", status: 406 };
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
