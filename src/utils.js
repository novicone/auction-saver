var q = require("q");

exports.createLazyProvider = function createLazyProvider(factory) {
    var provided;
    
    return function provide() {
        return provided || (provided = factory());
    };
};

exports.action = function action(fn, ...args) {
    return req =>
        q.all(args.map(arg => arg(req)))
            .then(params => q.fapply(fn, params));
};

exports.raise = function raise(status, message) {
    throw { status, message };
}
