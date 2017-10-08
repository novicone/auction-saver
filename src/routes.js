const { assign, curry, get, partial } = require("lodash");
const { Router } = require("express");

const auth = require("./auth/routes"); const { allegroSessionIdParam } = auth;
const { json, sessionParam, bodyParam, context, action } = require("./web");

const loginParam = sessionParam("login");

module.exports = (app) => {
    install(app, "/", auth);
    install(app, "/auctions", auctions);
    app.use(handleError);
};

const install = (app, path, configurer) => {
    const router = Router();
    configurer(router);
    app.use(path, router);
};

const auctions = (router) => {
    router.use(filterUnauthorized);
    router.post("/", json(userAction("saveAuctionAction", userAction("parsedId", bodyParam("url")))));
    router.get("/", json(userAction("auctionStorage.findAll", auctionsQuery)));
};

const userAction = (fnPath, param) => action((ctx) => get(ctx, fnPath), authorizedContext, param);

const authorizedContext = (req) => {
    const ctx = context(req);
    const { auctionStorage, saveAuctionAction } = ctx;
    const { update, findAll } = auctionStorage;

    const session = allegroSessionIdParam(req);
    const login = loginParam(req);

    return assign({ }, ctx, {
        auctionStorage: assign({ }, auctionStorage, {
            update: partial(update, login),
            findAll: partial(findAll, login)
        }),
        saveAuctionAction: partial(saveAuctionAction, session, login)
    });
};

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
    if (!loginParam(req) || !allegroSessionIdParam(req)) {
        console.log(req.session);
        return next({ message: "Forbidden", status: 403 });
    }
    next();
}

function handleError(err, req, res, next) {
    void next;
    console.error(err.stack || err);

    res.status(err.status || 500)
        .json(err.message || err);
}
