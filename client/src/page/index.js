/* global angular */
module.exports = angular.module("page", [])
    .provider("page", createPageProvider)
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

function createPageProvider() {
    var entries = [];
    
    return {
        add: function(title, template) {
            entries.push({ title: title, template: template });
        },
        $get: function($templateCache) {
            entries
                .forEach(function(entry) {
                    $templateCache.put(entry.title, entry.template);
                });
            var pages = entries.map(function(entry) { return { title: entry.title }; });
            return makePage(pages);
        }
    };
}

function makePage(pages) {
    var current = { };
    
    select(pages[0]);
    
    function select(page) {
        Object.assign(current, page);
    }
    
    return {
        all: pages,
        current: current,
        select: select
    };
}
