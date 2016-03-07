/* global angular */
angular.module("auctionSaver", [
        require("./login").name,
        require("./saver").name,
        require("./browser").name,
        require("./page").name
    ])
    .controller("AppCtrl", function($scope) {
        $scope.$on("authorized", function() {
            $scope.authorized = true;
        });
    })
    .directive("app", function() {
        return {
            template: require("./app.tpl.html"),
            replace: true
        };
    });
