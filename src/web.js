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

exports.sessionParam = (name) => ({ session }) => session[name];

exports.body = ({ body }) => body;

const handler = (respond) => (perform) =>
    (req, res, next) =>
        perform(req)
            .then(respond(res))
            .catch((error) => {
                next(error);
                throw error;
            });
exports.handler = handler;

exports.json = handler((res) => (value) => res.json(value));

exports.context = ({ app: { locals: { context } } }) => context;

exports.action = (fn, context, param) => (req) => fn(context(req))(param(req));
