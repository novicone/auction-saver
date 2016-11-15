const _ = require("lodash");
const { fromNullable } = require("data.maybe");

exports.create = function createIdParser(patterns) {
    return function parseId(input) {
        return fromNullable(_(patterns)
            .map(function(pattern) { return pattern.exec(input); })
            .filter(function(result) { return result; })
            .map(function(result) { return result[1]; })
            .head());
    };
};
