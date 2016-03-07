/* global angular */
module.exports = angular.module("page", [])
    .service("page", function($templateCache) {
        var pages = [
            page("Zapisuj aukcje", require("./saver.tpl.html")),
            page("Przeglądaj aukcje", require("./browser.tpl.html"))
        ];
        
        var current = { };
        
        select(pages[0]);
        
        function page(title, template) {
            $templateCache.put(title, template);
            return { title: title };
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
    .directive("page", function(page) {
        return {
            template: require("./page.tpl.html"),
            scope: { },
            replace: true,
            link: function(scope) {
                Object.assign(scope, page);
            }
        };
    });
