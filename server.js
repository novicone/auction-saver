const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");

const createContext = require("./src/context").create;
const initRoutes = require("./src/routes").init;
const attachAuthRoutes = require("./src/auth/routes").attach;

const config = require("./config");

const app = express();
app.use(bodyParser.json());
app.use(session({
	secret: "this-so-secret",
	resave: true,
	saveUninitialized: true
}));
app.use(express.static(path.resolve(__dirname, "build")));

app.locals.context = createContext(config);
initRoutes(app);
attachAuthRoutes(app);

const serverConfig = config.server || { };

const address = serverConfig.ip || "0.0.0.0";
const port = serverConfig.port || 3000;

app.listen(port, address, function() {
    console.log("Server listening at", address + ":" + port);
});
