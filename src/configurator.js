var api = require("./api");
var utils = require("./utils");
var auctions = require("./auctions");
var download = require("./download");

exports.create = function createConfigurator(config) {
    var provideApi = utils.createLazyProvider(function() {
        return api.initialize(config.allegroWebapi);
    });
    
    var generatePath = utils.createPathGenerator("images");
    
    var login = api.method(provideApi, "login");
    var getAuction = api.method(provideApi, "getAuction");
    
    var createAuctionSaver = auctions.saverFactory(getAuction, generatePath, download);

    return function configure(router) {
        router.post("/login", wrapHandler(function(req, res) {
            return login(req.body);
        }));
        
        router.post("/auctions", wrapHandler(function(req, res) {
            var saveAuction = createAuctionSaver(req.headers.session, req.headers.login);
            
            return saveAuction(utils.parseAuctionId(req.body.url))
                .then(function() {});
        }));
    };
};

function wrapHandler(handler) {
    return function handle(req, res, next) {
        handler(req)
            .then(function(result) {
                if (result === null || result === undefined) {
                    res.status(204).end();
                } else {
                    res.json(result);
                }
            })
            .catch(next);
    };
}
