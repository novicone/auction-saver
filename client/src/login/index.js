require("./login.css");

module.exports = angular.module("login", [])
    .service("login", require("./makeLogin"))
    .directive("login", function() {
        return {
            controller: LoginCtrl,
            template: require("./login.tpl.html")
        };
    });

function LoginCtrl($scope, login) {
    $scope.login = function() {
        $scope.authorizing = true;
        
        login($scope.username, $scope.password)
            .catch(function(error) {
                alert(error.data);
                throw error;
            })
            .finally(function() {
                $scope.authorizing = false;
            });
    };
}
