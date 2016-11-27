exports.headerParam = function headerParam(name) {
    return function(req) {
        return req.headers[name];
    };
};

exports.bodyParam = function bodyParam(name) {
    return function(req) {
        return req.body[name];
    };
};

exports.json = function json(handler) {
    return function(req, res, next) {
        handler(req)
            .then(function(result) {
                res.json(result);
            })
            .catch(function(error) {
                next(error);
                throw error;
            });
    };
};

exports.body = function body(req) {
    return req.body;
}

exports.context = ({ app: { locals: { context } } }) => context;

exports.action = (fn, context, param) => (req) => fn(context(req))(param(req));
