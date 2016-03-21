require("angular/angular.min");
require("bootstrap/dist/css/bootstrap.min.css");

angular.module("auctionSaver", [
    require("./app").name,
    require("./login").name,
    require("./saver").name,
    require("./browser").name,
    require("./page").name,
    require("./auctions").name
]);
