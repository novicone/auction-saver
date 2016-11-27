const reqParam = (prop) => (name) => (req) => req[prop][name];

exports.queryParam = reqParam("query");

exports.headerParam = reqParam("headers");

exports.bodyParam = reqParam("body");

exports.sessionParam = reqParam("session");

exports.body = ({ body }) => body;

// respond :: res -> A -> void
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

exports.redirect = handler((res) => (value) => res.redirect(value));

exports.context = ({ app: { locals: { context } } }) => context;

exports.action = (fn, context, param) => (req) => fn(context(req))(param(req));
