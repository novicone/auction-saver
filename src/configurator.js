const _ = require("lodash");
const q = require("q");
const express = require("express");

const { action, raise } = require("./utils");

const { json, body, headerParam, bodyParam } = require("./web");

const sessionParam = headerParam("session");
const loginParam = headerParam("login");
const urlParam = bodyParam("url");

exports.create = function createConfigurator({ login, auctionStorage, parseId, saveAuctionAction }) {
    return function configure(router) {
        router.post("/login", json(action(login, body)));
        
        const auctionsRouter = express.Router();
        auctionsRouter.use(filterUnauthorized);

        auctionsRouter.get("/",
            json(action(
                auctionStorage.findAll,
                loginParam,
                auctionsQuery)));

        auctionsRouter
            .post("/", 
                json(action(
                    saveAuctionAction,
                    sessionParam,
                    loginParam,
                    action(
                        auctionIdParam(auctionStorage, parseId),
                        loginParam,
                        urlParam))));
        
        router.use("/auctions", auctionsRouter);

        router.use(handleError);
    };
};

function auctionsQuery(req) {
    const makeBoolQuery = _.curry(boolQuery)(req.query);

    return _.assign({}, makeBoolQuery("finished"), makeBoolQuery("expired"));
}

function auctionIdParam({ findOneBy }, parseId) {
    return function getAuctionId(owner, url) {
        return parseId(url)
            .cata({
                Nothing: () => raise(400, "WRONG_ID"),
                Just: id =>
                    findOneBy({ id, owner, finished: true })
                        .then(auction =>
                            auction
                                ? raise(406, "ALREADY_SAVED")
                                : id)
            });
    };
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
