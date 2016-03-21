var q = require("q");
var express = require("express");

var action = require("./utils").action;
var web = require("./web");
var json = web.json;

var sessionParam = web.headerParam("session");
var loginParam = web.headerParam("login");
var urlParam = web.bodyParam("url");

exports.create = function createConfigurator(login, auctionStorage, saveAuctionAction) {
    return function configure(router) {
        router.post("/login", json(action(login, body)));
        
        var auctionsRouter = express.Router();
        auctionsRouter.use(filterUnauthorized);
        auctionsRouter.get("/", json(action(auctionStorage.findAll, loginParam, auctionsQuery)));
        auctionsRouter.post("/", json(action(saveAuctionAction, sessionParam, loginParam, urlParam)));
        router.use("/auctions", auctionsRouter);

        router.use(handleError);
    };
};

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

function handleError(err, req, res, next) {
    console.error(err.stack || err);

    res.status(err.status || 500)
        .json(err.message || err);
}
