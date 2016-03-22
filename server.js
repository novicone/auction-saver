var path = require("path");
var express = require("express");
var bodyParser = require("body-parser");

var createContext = require("./src/context").create;
var createConfigurator = require("./src/configurator").create;

var app = express();
app.use(bodyParser.json());

var context = createContext(require("./config"));
var configure = createConfigurator(context.login, context.auctionStorage, context.saveAuctionAction);
configure(app);

app.use(express.static(path.resolve(__dirname, "build")));

var address = process.env.IP || "0.0.0.0";
var port = process.env.PORT || 3000;

app.listen(port, address, function() {
    console.log("Server listening at", address + ":" + port);
});
