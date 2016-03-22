var path = require("path");
var sanitize = require("sanitize-filename");

exports.create = function createPathGenerator(basePath) {
    return function generatePath(login, auction, imageNumber) {
        var dirName = auction.sold ? "" : (auction.reservePrice ? "minimalna" : "niesprzedane");
        var fileName = [
            Math.round(auction.price) + " zl",
            auction.name,
            "(numer " + auction.id + ")",
            auction.seller,
            getDateString(new Date(parseInt(auction.endingTime, 10) * 1000))
        ].join(" ");
        if (auction.images.length > 1) {
            fileName += " foto_" + imageNumber;
        }
        return path.join(basePath, login, dirName, sanitize(fileName + ".jpg"));
    };
};

var DATE_RE = /(\w+), (\d+)\/(\d+)\/(\d+)/;
var WEEKDAYS = {
    Mon: "pon",
    Tue: "wto",
    Wed: "sro",
    Thu: "czw",
    Fri: "pia",
    Sat: "sob",
    Sun: "nie"
};
var MONTHS = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paz", "lis", "gru"];

function getDateString(date) {
    var native = date.toLocaleString("en-US", {
        timeZone: "Europe/Warsaw",
        year: "numeric",
        month: "numeric",
        day: "numeric",
        weekday: "short"
    });
    
    var nativeParts = DATE_RE.exec(native);
    
    return [
        WEEKDAYS[nativeParts[1]],
        nativeParts[3],
        MONTHS[parseInt(nativeParts[2], 10) - 1],
        nativeParts[4]
    ].join(" ");
}