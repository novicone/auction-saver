/* global angular */
/* global sha256 */
/* global btoa */
angular.module("auctionSaver", [])
    .controller("AppCtrl", function($scope) {
        $scope.$on("authorized", function() {
            $scope.authorized = true;
        });
    })
    .controller("LoginCtrl", function($scope, login) {
        $scope.login = function() {
            $scope.authorizing = true;
            
            login($scope.username, $scope.password)
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
    .controller("BrowserCtrl", function($scope, $http) {
        $http.get("/auctions")
            .then(function(response) {
                $scope.auctions = response.data;
            });
    })
    .filter("price", function() {
        return function(value) {
            return value.toFixed(2) + " zł";
        };
    })
    .filter("time", function() {
        return function(timestamp) {
            return timestamp
                ? new Date(timestamp * 1000).toLocaleString()
                : "-";
        };
    })
    .directive("login", function(templateUrl) {
        return {
            templateUrl: templateUrl("login")
        };
    })
    .directive("page", function(page, templateUrl) {
        return {
            templateUrl: templateUrl("page"),
            scope: { },
            replace: true,
            link: function(scope) {
                Object.assign(scope, page);
            }
        };
    })
    .service("page", function(templateUrl) {
        var pages = [
            page("Zapisuj aukcje", "saver"),
            page("Przeglądaj aukcje", "browser")
        ];
        
        var current = { };
        
        select(pages[0]);
        
        function page(title, template) {
            return {
                title: title,
                template: templateUrl(template)
            };
        }
        
        function select(page) {
            Object.assign(current, page);
        }
        
        return {
            all: pages,
            current: current,
            select: select
        };
    })
    .service("templateUrl", function() {
        return function(template) {
            return "templates/" + template + ".tpl.html";
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
    .service("save", function($q, $http, log) {
        var WS_RE = /^\s*$/;

        function saveAuction(auction) {
            return $http.post("/auctions", {
                    url: auction
                })
                .then(function(response) {
                    log.unshift({
                        auction: auction,
                        result: response.data
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

        return function(entry) {
            var failure = entry.failure;
            var result = entry.result;
            return failure
                ? map[failure] || failure
                : result && !result.finished
                    ? "Niezakończona"
                    : "OK";
        };
    });