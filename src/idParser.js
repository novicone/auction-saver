var _ = require("lodash");

exports.create = function createIdParser(patterns) {
    return function parseId(input) {
        return _(patterns)
            .map(function(pattern) { return pattern.exec(input); })
            .filter(function(result) { return result; })
            .map(function(result) { return result[1]; })
            .head();
    };
};
