module.exports = angular.module("saver", [require("../page").name, require("../auctions").name])
    .config(function(pageProvider) {
        pageProvider.add("Zapisuj aukcje", require("./saver.tpl.html"));
    })
    .controller("SaverCtrl", SaverCtrl)
    .service("save", require("./makeSave"))
    .service("log", require("./makeLog"))
    .filter("status", require("./makeStatusFormatter"));

function SaverCtrl($scope, save, fetchAuctions, log) {
    $scope.save = function() {
        $scope.saving = true;
        
        save($scope.auctions)
            .then(() => { $scope.saving = false; });
        
        $scope.auctions = "";
    };

    $scope.insertUnfinished = function() {
        fetchAuctions({ finished: false, expired: false })
            .then(auctions => {
                $scope.auctions = auctions
                    .map(auction => auction.id)
                    .join("\n");
            });
    };

    $scope.clearLog = log.clear;
    
    $scope.log = log.entries;
}
