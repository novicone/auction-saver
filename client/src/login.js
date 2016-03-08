/* global sha256 */
/* global btoa */
module.exports = angular.module("login", [])
    .service("login", loginFactory)
    .directive("login", function() {
        return {
            controller: LoginCtrl,
            template: require("./login.tpl.html")
        };
    });

function LoginCtrl($scope, login) {
    $scope.login = function() {
        $scope.authorizing = true;
        
        login($scope.username, $scope.password)
            .catch(function(error) {
                alert(error.data);
                throw error;
            })
            .finally(function() {
                $scope.authorizing = false;
            });
    };
}

function loginFactory($http, $rootScope) {
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
}
