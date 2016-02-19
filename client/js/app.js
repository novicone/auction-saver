/* global angular */
/* global sha256 */
/* global btoa */
angular.module("auctionSaver", [])
    .controller("AppCtrl", function($scope, page) {
        $scope.page = page;
        page.login();
    })
    .controller("LoginCtrl", function($scope, login, page) {
        $scope.login = function() {
            $scope.authorizing = true;
            
            login($scope.username, $scope.password)
                .then(function() {
                    page.saver();
                })
                .finally(function() {
                    $scope.authorizing = false;
                });
        };
    })
    .controller("SaverCtrl", function($scope, save, log) {
        $scope.save = function() {
            $scope.saving = true;
            
            save($scope.auctions)
                .then(function() {
                    $scope.saving = false;
                });
            
            $scope.auctions = "";
        };
        
        $scope.log = log;
    })
    .directive("page", function() {
        return {
            templateUrl: "templates/page.tpl.html",
            scope: {
                def: "<"
            },
            replace: true
        };
    })
    .service("page", function() {
        function pageChanger(title, template) {
            return function() {
                Object.assign(page, {
                    title: title,
                    template: "templates/" + template + ".tpl.html"
                });
            };
        }
        
        var page = {
            login: pageChanger("Zaloguj się", "login"),
            saver: pageChanger("Zapisuj aukcje", "saver")
        };
        
        return page;
    })
    .service("login", function($http) {
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
                });
        };
    })
    .service("save", function($q, $http, log) {
        var WS_RE = /^\s*$/;

        function saveAuction(auction) {
            return $http.post("/auctions", {
                    url: auction
                })
                .then(function() {
                    log.unshift({
                        auction: auction
                    });
                })
                .catch(function(failure) {
                    log.unshift({
                        auction: auction,
                        failure: failure.data
                    });
                });
        }

        return function save(auctionsText) {
            var auctions = auctionsText
                .replace(/\r\n?/g, "\n")
                .split("\n")
                .filter(function(auction) {
                    return !WS_RE.test(auction);
                });

            return $q.all(auctions.map(saveAuction));
        };
    })
    .service("log", function() {
        return [];
    })
    .filter("status", function() {
        var map = {
            WRONG_ID: "Nierozpoznawany identyfikator",
            ALREADY_SAVED: "Aukcja jest już zapisana"
        };

        return function(status) {
            return status ? (map[status] || status) : "OK";
        };
    });