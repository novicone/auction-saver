module.exports = angular.module("browser", [
        require("./auctions").name
    ])
    .controller("BrowserCtrl", function($scope, fetchAuctions) {
        fetchAuctions()
            .then(function(auctions) {
                $scope.auctions = auctions;
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
    });
