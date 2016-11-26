const _ = require("lodash");
const { fromNullable } = require("data.maybe");

exports.create = function createIdParser(patterns) {
    return input => fromNullable(
        _(patterns)
            .map(pattern => pattern.exec(input))
            .filter(_.identity)
            .map(([match, group]) => group)
            .head());
};
