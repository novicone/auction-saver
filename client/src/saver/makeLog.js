module.exports = function makeLog() {
    const entries = [];
    return {
        entries,
        append(obj) {
            entries.unshift(obj);
        },
        clear() {
            entries.length = 0;
        }
    };
};
