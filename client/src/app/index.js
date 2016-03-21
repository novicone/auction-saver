require("./app.css");

module.exports = angular.module("app", [])
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
