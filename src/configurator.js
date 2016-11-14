const _ = require("lodash");
const q = require("q");
const express = require("express");

const action = require("./utils").action;
const web = require("./web");
const json = web.json;

const sessionParam = web.headerParam("session");
const loginParam = web.headerParam("login");
const urlParam = web.bodyParam("url");

exports.create = function createConfigurator(login, auctionStorage, saveAuctionAction) {
    return function configure(router) {
        router.post("/login", json(action(login, body)));
        
        const auctionsRouter = express.Router();
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
    const makeBoolQuery = _.curry(boolQuery)(req.query);

    return _.assign({}, makeBoolQuery("finished"), makeBoolQuery("expired"));
}

function boolQuery(query, name) {
    return query.hasOwnProperty(name)
        ? { [name]: query[name] === "true"
            ? true
            : { $ne: true } }
        : { };
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
