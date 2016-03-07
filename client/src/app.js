/* global angular */
angular.module("auctionSaver", [
        require("./login").name,
        require("./saver").name,
        require("./browser").name
    ])
    .controller("AppCtrl", function($scope) {
        $scope.$on("authorized", function() {
            $scope.authorized = true;
        });
    })
    .service("templateUrl", function() {
        return function(template) {
            return "templates/" + template + ".tpl.html";
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
    .directive("page", function(page, templateUrl) {
        return {
            templateUrl: templateUrl("page"),
            scope: { },
            replace: true,
            link: function(scope) {
                Object.assign(scope, page);
            }
        };
    });
