angular.module("auctionSaver", [
        require("./login").name,
        require("./saver").name,
        require("./browser").name,
        require("./page").name
    ])
    .directive("app", function() {
        return {
            controller: AppCtrl,
            template: require("./app.tpl.html"),
            replace: true
        };
    });

function AppCtrl($scope) {
    $scope.$on("authorized", function() {
        $scope.authorized = true;
    });
}
