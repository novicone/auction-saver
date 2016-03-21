module.exports = function makeSave($q, $http, log) {
    const NEWLINE_RE = /\r\n?/g;
    const WHITESPACE_RE = /^\s*$/;

    function saveAuction(auction) {
        return $http.post("/auctions", { url: auction })
            .then(({ data }) => log.append({ auction, result: data }))
            .catch(({ data }) => log.append({ auction, failure: data }));
    }

    return function save(auctionsText) {
        var auctions = auctionsText
            .replace(NEWLINE_RE, "\n")
            .split("\n")
            .filter(auction => !WHITESPACE_RE.test(auction));

        return $q.all(auctions.map(saveAuction));
    };
};