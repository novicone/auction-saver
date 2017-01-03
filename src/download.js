const q = require("q");
const fs = require("fs");
const path = require("path");
const { http, https } = require("follow-redirects");

module.exports = function download(url, path) {
    console.log("downloading %s to %s", url, path);
    const deferred = q.defer();
    
    ensureDir(path);
    const file = fs.createWriteStream(path);
    file.on("error", deferred.reject);
    
    get(url, (response) => {
            if (response.statusCode >= 400) {
                deferred.reject(new Error("Unexpected status while downloading file: " + response.statusCode));
                return;
            }

            response.pipe(file);
            
            file.on("finish", deferred.resolve);
        })
        .on("error", deferred.reject);
    
    return deferred.promise;
};

function ensureDir(filePath) {
    const dirPath = path.dirname(filePath);
    
    if (fs.existsSync(dirPath)) {
        return;
    }
    ensureDir(dirPath);
    fs.mkdirSync(dirPath);
}

function get(url, handler) {
    const protocol = url.startsWith("https") ? https : http;

    return protocol.get(url, handler);
}
