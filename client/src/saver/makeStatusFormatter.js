var map = {
    WRONG_ID: "Nierozpoznawany identyfikator",
    ALREADY_SAVED: "Aukcja jest już zapisana",
    NOT_FOUND: "Nie znaleziono aukcji"
};

module.exports = function makeStatusFormatter() {
    return function formatStatus({ failure, result }) {
        return failure
            ? map[failure] || failure
            : result && !result.finished
                ? "Niezakończona"
                : "OK";
    };
};
