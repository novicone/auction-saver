/* global angular */
/* global sha256 */
/* global btoa */
module.exports = angular.module("saver", [])
    .controller("SaverCtrl", SaverCtrl)
    .service("save", saveFactory)
    .value("log", [])
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

function SaverCtrl($scope, save, log) {
    $scope.save = function() {
        $scope.saving = true;
        
        save($scope.auctions)
            .then(function() {
                $scope.saving = false;
            });
        
        $scope.auctions = "";
    };
    
    $scope.log = log;
}

function saveFactory($q, $http, log) {
    var NEWLINE_RE = /\r\n?/g;
    var WHITESPACE_RE = /^\s*$/;

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
            .replace(NEWLINE_RE, "\n")
            .split("\n")
            .filter(function(auction) {
                return !WHITESPACE_RE.test(auction);
            });

        return $q.all(auctions.map(saveAuction));
    };
}
