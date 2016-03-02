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
    var auctionId = createAuctionIdGetter(auctionStorage.findOneBy);

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

        auctionsRouter
            .post("/", json(call, action(createAuctionSaver, session, loginParam), auctionId));
        
        router.use("/auctions", auctionsRouter);
        router.use(function(err, req, res, next) {
            res.status(err.status || 500)
                .json(err.message || err);
        });
    };
};

function action(fn) {
    var args = [].slice.call(arguments, 1);
    return function(req, res, next) {
        console.log(args);
        return q.all(args.map(function(arg) { return arg(req); }))
            .then(function(params) {
                return fn.apply(null, params);
            })
            .catch(function(cause) {
                next(cause);
                throw cause;
            });
    };
}

function json() {
    var args = arguments;
    return function(req, res, next) {
        action.apply(null, args)(req, res, next)
            .then(function(result) { res.json(result); });
    }
}

function call(fn) {
    var params = [].slice.call(arguments, 1);
    console.log(fn, params);
    return fn.apply(null, params);
}

function session(req) {
    return req.headers.session;
}

function loginParam(req) {
    return req.headers.login;
}

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
