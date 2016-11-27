const { assign, curry, get, partial } = require("lodash");
const express = require("express");

const { json, body, headerParam, bodyParam, context, action } = require("./web");

const sessionParam = headerParam("session");
const loginParam = headerParam("login");
const urlParam = bodyParam("url");

exports.init = function(router) {
    router.post("/login", json(action(login, context, body)));
    
    const auctionsRouter = express.Router();
    auctionsRouter.use(filterUnauthorized);

    auctionsRouter.get("/", json(userAction("auctionStorage.findAll", auctionsQuery)));
    auctionsRouter.post("/", json(userAction("saveAuctionAction", urlParam)));
        
    router.use("/auctions", auctionsRouter);

    router.use(handleError);
}

const login = ({ allegroClient: { login } }) => login;

const userAction = (fnPath, param) => action((ctx) => get(ctx, fnPath), authorizedContext, param);

const authorizedContext = (req) => {
    const ctx = context(req);
    const { auctionStorage, saveAuctionAction } = ctx;
    const { update, findAll } = auctionStorage;

    const { headers: { session, login } } = req;

    return assign({ }, ctx, {
        auctionStorage: assign({ }, auctionStorage, {
            update: partial(update, login),
            findAll: partial(findAll, login)
        }),
        saveAuctionAction: partial(saveAuctionAction, session, login)
    });
}

function auctionsQuery({ query }) {
    const makeBoolQuery = curry(boolQuery)(query);

    return assign({}, makeBoolQuery("finished"), makeBoolQuery("expired"));
}

const boolQuery = (query, name) =>
    query.hasOwnProperty(name)
        ? { [name]: query[name] === "true"
            ? true
            : { $ne: true } }
        : { };

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
