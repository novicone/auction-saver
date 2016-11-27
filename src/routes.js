const { assign, curry, get, partial } = require("lodash");
const express = require("express");

const { json, body, sessionParam, bodyParam, context, action } = require("./web");

const allegroSessionIdParam = sessionParam("allegroSessionId");
const loginParam = sessionParam("login");
const urlParam = bodyParam("url");

exports.init = function(router) {
    router.post("/login", json(action(login, sessionContext, body)));
    router.get("/verify", json(action(verify, authorizedContext, allegroSessionIdParam)));
    router.get("/logout", logout);
    
    const auctionsRouter = express.Router();
    auctionsRouter.use(filterUnauthorized);

    auctionsRouter.get("/", json(userAction("auctionStorage.findAll", auctionsQuery)));
    auctionsRouter.post("/", json(userAction("saveAuctionAction", urlParam)));
        
    router.use("/auctions", auctionsRouter);

    router.use(handleError);
}

const login = ({ allegroClient, session }) => (credentials) =>
    allegroClient.login(credentials)
        .then((allegroSessionId) =>
            assign(session, {
                allegroSessionId,
                login: credentials.login
            }));

const verify = ({ allegroClient }) => (session) =>
    allegroClient.getMyData(session || "")
        .then(() => true)
        .catch((error) => {
            console.error(error);
            return false;
        });

function logout(req, res) {
    req.session.destroy();
    res.redirect("/");
};

const sessionContext = (req) => assign({ }, context(req), { session: req.session });

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
    if (!loginParam(req) || !allegroSessionIdParam(req)) {
        console.log(req.session);
        return next({ message: "Forbidden", status: 403 });
    }
    next();
}

function handleError(err, req, res, next) {
    console.error(err.stack || err);

    res.status(err.status || 500)
        .json(err.message || err);
}
