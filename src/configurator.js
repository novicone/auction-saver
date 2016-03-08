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
        router.post("/login", json(login, body));
        
        var auctionsRouter = express.Router();
        
        auctionsRouter.use(filterUnauthorized);
        
        auctionsRouter.get("/", json(auctionStorage.findAll, loginParam, auctionsQuery));

        var validAuctionId = action(auctionId, urlParam, loginParam);
        var auctionSaver = action(createAuctionSaver, sessionParam, loginParam);
        auctionsRouter.post("/", json(call, auctionSaver, validAuctionId));
        
        router.use("/auctions", auctionsRouter);
        router.use(function(err, req, res, next) {
            console.error(err.stack || err);

            res.status(err.status || 500)
                .json(err.message || err);
        });
    };
};

function action(fn) {
    var args = [].slice.call(arguments, 1);
    return function(req, res, next) {
        return q.all(args.map(function(arg) { return arg(req, res, next); }))
            .then(function(params) {
                return q.fapply(fn, params);
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
    };
}

function call(fn) {
    var params = [].slice.call(arguments, 1);
    return fn.apply(null, params);
}

function sessionParam(req) {
    return req.headers.session;
}

function loginParam(req) {
    return req.headers.login;
}

function urlParam(req) {
    return req.body.url;
}

function body(req) {
    return req.body;
}

function auctionsQuery(req) {
    var query = { };
    if (req.query.hasOwnProperty("finished")) {
        query.finished = req.query.finished === "true";
    }

    return query;
}

function filterUnauthorized(req, res, next) {
    if (!loginParam(req) || !sessionParam(req)) {
        return next({ message: "Forbidden", status: 403 });
    }
    next();
}

function createAuctionIdGetter(findAuction) {
    return function getAuctionId(url, login) {
        var id = utils.parseAuctionId(url);
        
        if (!id) {
            throw { message: "WRONG_ID", status: 400 };
        }
        
        return findAuction({ id: id, owner: login })
            .then(function(auction) {
                if (auction && auction.finished) {
                    throw { message: "ALREADY_SAVED", status: 406 };
                }
                return id;
            });
    };
}
