const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");

const createContext = require("./context").create;
const initRoutes = require("./routes");

module.exports = function main(config, resolvePath) {
    const app = express();
    app.use(bodyParser.json());
    app.use(session({
        secret: "this-so-secret",
        resave: true,
        saveUninitialized: true
    }));
    app.use(express.static(resolvePath("build")));
    
    const { imagesDir } = config;
    app.use(`/${imagesDir}`, express.static(resolvePath(imagesDir)));
    
    app.locals.context = createContext(config);
    initRoutes(app);
    
    const { ip, port } = config.server;
    app.listen(port, ip, function() {
        console.log("Server listening on", ip + ":" + port);
    });
}
