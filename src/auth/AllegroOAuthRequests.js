const url = require("url");
const btoa = require("btoa");

class AllegroOAuthRequests {
    constructor(config) {
        this._config = config;
    }
    authRedirectUri() {
        const { clientID, apiKey, callback } = this._config;

        return url.format({
            protocol: "https",
            host: "ssl.allegro.pl",
            pathname: "/auth/oauth/authorize",
            query: {
                response_type: "code",
                client_id: clientID,
                "api-key": apiKey,
                redirect_uri: callback
            }
        });
    }
    tokenRequestOptions(code) {
        const { clientID, clientSecret, apiKey, callback } = this._config;

        return {
            uri: url.format({
                protocol: "https",
                host: "ssl.allegro.pl",
                pathname: "/auth/oauth/token",
                query: {
                    grant_type: "authorization_code",
                    code: code,
                    "api-key": apiKey,
                    redirect_uri: callback
                }
            }),
            headers: {
                Authorization: "Basic " + btoa(clientID + ":" + clientSecret)
            },
            json: true
        };
    }
}

module.exports = AllegroOAuthRequests;
