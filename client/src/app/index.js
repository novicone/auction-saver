require("./app.css");

const appTemplate = require("./app.tpl.html");

module.exports = angular.module("app", [])
    .directive("app", () => ({
        controller: AppCtrl,
        template: appTemplate,
        replace: true
    }))
    .directive("menu", layoutDirective(require("./menu.tpl.html")))
    .directive("page", layoutDirective(require("./page.tpl.html")));

function AppCtrl($scope, $http) {
    $scope.$on("authorized", function() {
        $scope.authorized = true;
    });

    $http.get("/verify")
        .then(({ data }) => {
            $scope.ready = true;
            $scope.authorized = data;
        })
        .catch(({ data }) => alert(data));
}

function layoutDirective(template) {
    return page => ({
        template,
        scope: { },
        replace: true,
        link(scope) {
            Object.assign(scope, page);
        }
    });
}
