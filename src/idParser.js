const _ = require("lodash");

exports.create = function createIdParser(patterns) {
    return (input) =>
        _(patterns)
            .map((pattern) => pattern.exec(input))
            .filter(_.identity)
            .map(([match, group]) => group)
            .head();
};
