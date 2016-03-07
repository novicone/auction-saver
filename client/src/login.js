/* global angular */
module.exports = angular.module("login", [])
    .controller("LoginCtrl", function($scope, login) {
        $scope.login = function() {
            $scope.authorizing = true;
            
            login($scope.username, $scope.password)
                .finally(function() {
                    $scope.authorizing = false;
                });
        };
    })
    .service("login", function($http, $rootScope) {
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
    })
    .directive("login", function() {
        return {
            template: require("./login.tpl.html")
        };
    });