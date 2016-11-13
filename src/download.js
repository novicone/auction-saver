var q = require("q");
var fs = require("fs");
var path = require("path");
var http = require("follow-redirects").http;

module.exports = function download(url, path) {
    console.log("downloading %s to %s", url, path);
    var deferred = q.defer();
    
    ensureDir(path);
    var file = fs.createWriteStream(path);
    file.on("error", deferred.reject);
    
    http.get(url, function(response) {
        if (response.statusCode >= 400) {
            deferred.reject(new Error("Unexpected status while downloading file: " + response.statusCode));
            return;
        }

        response.pipe(file);
        
        file.on("finish", deferred.resolve);
    }).on("error", deferred.reject);
    
    return deferred.promise;
};

function ensureDir(filePath) {
    var dirPath = path.dirname(filePath);
    
    if (fs.existsSync(dirPath)) {
        return;
    }
    ensureDir(dirPath);
    fs.mkdirSync(dirPath);
}