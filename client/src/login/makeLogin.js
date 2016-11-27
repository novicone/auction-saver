var sha256 = require("sha256");

module.exports = function makeLogin($http, $rootScope) {
    return function login(username, password) {
        var enc = sha256(password)
            .match(/\w{2}/g)
            .map(char => String.fromCharCode(parseInt(char, 16)))
            .join("");

        var credentials = {
            login: username,
            password: btoa(enc)
        };

        return $http.post("/login", credentials)
            .then(() => {
                $rootScope.$broadcast("authorized");
            });
    };
};
