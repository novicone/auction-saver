const path = require("path");
const sanitize = require("sanitize-filename");

exports.create = function createPathGenerator(basePath) {
    return function generatePath(auction, imageNumber) {
        const dirName = auction.sold ? "" : (auction.reservePrice ? "minimalna" : "niesprzedane");
        let fileName = [
            Math.round(auction.price) + " zl",
            auction.name,
            "(numer " + auction.id + ")",
            auction.seller,
            getDateString(new Date(parseInt(auction.endingTime, 10) * 1000))
        ].join(" ");
        if (auction.images.length > 1) {
            fileName += " foto_" + imageNumber;
        }
        return path.join(basePath, auction.owner, dirName, sanitize(fileName + ".jpg"));
    };
};

const DATE_RE = /(\w+), (\d+)\/(\d+)\/(\d+)/;
const WEEKDAYS = {
    Mon: "pon",
    Tue: "wto",
    Wed: "sro",
    Thu: "czw",
    Fri: "pia",
    Sat: "sob",
    Sun: "nie"
};
const MONTHS = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paz", "lis", "gru"];

function getDateString(date) {
    const native = date.toLocaleString("en-US", {
        timeZone: "Europe/Warsaw",
        year: "numeric",
        month: "numeric",
        day: "numeric",
        weekday: "short"
    });
    
    const nativeParts = DATE_RE.exec(native);
    
    return [
        WEEKDAYS[nativeParts[1]],
        nativeParts[3],
        MONTHS[parseInt(nativeParts[2], 10) - 1],
        nativeParts[4]
    ].join(" ");
}
