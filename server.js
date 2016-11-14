const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");

const createContext = require("./src/context").create;
const createConfigurator = require("./src/configurator").create;

const app = express();
app.use(bodyParser.json());

const config = require("./config");
const context = createContext(config);
const configure = createConfigurator(context.login, context.auctionStorage, context.saveAuctionAction);
configure(app);

app.use(express.static(path.resolve(__dirname, "build")));

const serverConfig = config.server || { };

const address = serverConfig.ip || "0.0.0.0";
const port = serverConfig.port || 3000;

app.listen(port, address, function() {
    console.log("Server listening at", address + ":" + port);
});
