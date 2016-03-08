module.exports = angular.module("auctions", [])
    .service("fetchAuctions", fetchAuctionsFactory);

function fetchAuctionsFactory($http) {
    return function fetchAuctions(criteria) {
        return $http.get("/auctions", { params: criteria })
            .then(function(response) {
                return response.data;
            });
    };
}
