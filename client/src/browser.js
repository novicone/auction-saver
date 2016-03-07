/* global angular */
module.exports = angular.module("browser", [])
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
    });
