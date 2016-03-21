var sha256 = require("sha256");

module.exports = function makeLogin($http, $rootScope) {
    return function login(username, password) {
        var hex = sha256(password);
        var bin = hex
            .match(/\w{2}/g)
            .map(function(char) {
                return String.fromCharCode(parseInt(char, 16));
            })
            .join("");
        var based = btoa(bin);

        var credentials = {
            login: username,
            password: based
        };

        return $http.post("/login", credentials)
            .then(function(response) {
                Object.assign($http.defaults.headers.common, {
                    session: response.data,
                    login: username
                });
                $rootScope.$broadcast("authorized");
            });
    };
};
