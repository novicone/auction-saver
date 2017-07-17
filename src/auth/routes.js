const { assign } = require("lodash");
const request = require("request-promise-native");
const { action, body, context, json, queryParam, redirect, sessionParam } = require("../web");

exports = module.exports = (router) => {
    router.post("/login", json(action(login, sessionContext, body)));
    router.get("/auth", (req, res) => {
        res.redirect(authRedirect(context(req)));
    });
    router.get("/auth/callback", redirect(action(authInit, sessionContext, queryParam("code"))));
    router.get("/logout", logout);

    router.get("/verify", json(action(verify, context, allegroSessionIdParam)));
};

const allegroSessionIdParam = exports.allegroSessionIdParam = sessionParam("allegroSessionId");

function login({ allegroClient, session }) {
    return (credentials) =>
        allegroClient.login(credentials)
            .then((allegroSessionId) =>
                assign(session, {
                    allegroSessionId,
                    login: credentials.login
                }));
}

function authRedirect({ oAuthRequests }) {
    return oAuthRequests.authRedirectUri();
}

const authInit = ({ oAuthRequests, allegroClient, session }) => (code)  =>
    request(oAuthRequests.tokenRequestOptions(code))
        .then(({ access_token }) => allegroClient.loginWithAccessToken(access_token))
        .then(({ sessionHandlePart, userId }) => allegroClient.getUserLogin(userId)
            .then(({ userLogin }) => {
                assign(session, {
                    login: userLogin,
                    allegroSessionId: sessionHandlePart
                });
                return "/";
            }));

function logout(req, res) {
    req.session.destroy();
    res.redirect("/");
};

const verify = ({ allegroClient }) => (sessionId) =>
    allegroClient.getMyData(sessionId || "")
        .then(() => true)
        .catch((error) => {
            if (error.faultcode !== "ERR_NO_SESSION") {
                console.error("getMyData failed: ", error);
            }
            return false;
        });

const sessionContext = (req) => assign({ }, context(req), { session: req.session });
