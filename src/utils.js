var q = require("q");

exports.createLazyProvider = function createLazyProvider(factory) {
    var provided;
    
    return function provide() {
        return provided || (provided = factory());
    };
};

exports.action = function action(fn) {
    var args = [].slice.call(arguments, 1);
    return function(req) {
        return q.all(args.map(function(arg) { return arg(req); }))
            .then(function(params) {
                return q.fapply(fn, params);
            });
    };
};

var ID_URL_RE = /i(\d+)\.html/;
var ID_QUERY_RE = /item=(\d+)(&|$)/;
var ID_RE = /^(\d+)$/;

exports.parseAuctionId = function parseAuctionId(url) {
    var result = ID_URL_RE.exec(url) || ID_QUERY_RE.exec(url) || ID_RE.exec(url);
    
    return result ? result[1] : null;
};
