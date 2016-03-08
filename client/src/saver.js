/* jshint esnext: true */
module.exports = angular.module("saver", [
        require("./auctions").name
    ])
    .controller("SaverCtrl", SaverCtrl)
    .service("save", saveFactory)
    .value("log", [])
    .filter("status", function() {
        var map = {
            WRONG_ID: "Nierozpoznawany identyfikator",
            ALREADY_SAVED: "Aukcja jest już zapisana"
        };

        return function({ failure, result }) {
            return failure
                ? map[failure] || failure
                : result && !result.finished
                    ? "Niezakończona"
                    : "OK";
        };
    });

function SaverCtrl($scope, save, fetchAuctions, log) {
    $scope.save = function() {
        $scope.saving = true;
        
        save($scope.auctions)
            .then(() => { $scope.saving = false; });
        
        $scope.auctions = "";
    };

    $scope.insertUnfinished = function() {
        fetchAuctions({ finished: false })
            .then(auctions => {
                $scope.auctions = auctions
                    .map(auction => auction.id)
                    .join("\n");
            });
    };

    $scope.clearLog = function() {
        log.length = 0;
    };
    
    $scope.log = log;
}

function saveFactory($q, $http, log) {
    const NEWLINE_RE = /\r\n?/g;
    const WHITESPACE_RE = /^\s*$/;

    function saveAuction(auction) {
        function append(obj) {
            log.unshift(Object.assign({ auction }, obj));
        }

        return $http.post("/auctions", { url: auction })
            .then(({ data }) => append({ result: data }))
            .catch(({ data }) => append({ failure: data }));
    }

    return function save(auctionsText) {
        var auctions = auctionsText
            .replace(NEWLINE_RE, "\n")
            .split("\n")
            .filter(auction => !WHITESPACE_RE.test(auction));

        return $q.all(auctions.map(saveAuction));
    };
}
