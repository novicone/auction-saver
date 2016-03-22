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
