const { assign } = require("lodash");
const { context, redirect, action, queryParam } = require("../web");
const request = require("request-promise-native");

exports.attach = function attach(router) {
    router.get("/auth", (req, res) => {
        res.redirect(authRedirect(context(req)));
    });
    router.get("/auth/callback", redirect(action(authInit, sessionContext, queryParam("code"))));
    router.get("/logout", logout);
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

const sessionContext = (req) => assign({ }, context(req), { session: req.session });
