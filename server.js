const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");

const createContext = require("./src/context").create;
const initRoutes = require("./src/routes").init;

const config = require("./config");

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.resolve(__dirname, "build")));

app.locals.context = createContext(config);
initRoutes(app);

const serverConfig = config.server || { };

const address = serverConfig.ip || "0.0.0.0";
const port = serverConfig.port || 3000;

app.listen(port, address, function() {
    console.log("Server listening at", address + ":" + port);
});
