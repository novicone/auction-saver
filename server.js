const path = require("path");

const { defaultsDeep } = require("lodash");

const CONFIG_DEFAULTS = {
	server: {
		ip: "0.0.0.0",
		port: 3000
	},
	imagesDir: "images"
};

const config = defaultsDeep(require("./config"), CONFIG_DEFAULTS);
const resolvePath = (...segments) => path.resolve(__dirname, ...segments);
require("./src/main")(config, resolvePath);
