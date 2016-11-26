module.exports = angular.module("auctions", [])
    .service("fetchAuctions", fetchAuctionsFactory)
    .directive("auctionLink", auctionLink);

function fetchAuctionsFactory($http) {
    return function fetchAuctions(criteria) {
        return $http.get("/auctions", { params: criteria })
            .then(function(response) {
                return response.data;
            });
    };
}

function auctionLink() {
    return {
        template: require("./auctionLink.tpl.html"),
        replace: true,
        transclude: true,
        scope: {
            auction: "="
        }
    };
}
