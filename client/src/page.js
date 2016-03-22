module.exports = angular.module("page", [])
    .provider("page", createPageProvider);

function createPageProvider() {
    var entries = [];
    
    return {
        add(title, template) {
            entries.push({ title, template });
        },
        $get($templateCache) {
            entries.forEach(({ title, template }) => $templateCache.put(title, template));
            return makePage(entries.map(({ title }) => ({ title })));
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