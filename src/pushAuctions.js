const request = require("request-promise-native");

const backlog = require("./backlog");
const promiseDb = require("./promiseDb");
const { intersection } = require("lodash");

const PUSH_INTERVAL = 60 * 1000;
const BATCH_SIZE = 16;

exports.create = ({ apiUri, auth, allowedCategories, selfUri }) => {
    const db = promiseDb.create({ filename: "push-backlog.db", autoload: true });
    const now = () => +new Date();
    const pushBacklog = backlog(db, now, BATCH_SIZE);

    if (apiUri) {
        const callApi = callMarekApi(apiUri, auth, makePathToUri(selfUri));
        setInterval(makeJob({ allowedCategories, pushBacklog, callApi }), PUSH_INTERVAL);
    }

    return { pushBacklog };
};

const makeJob = ({ allowedCategories, pushBacklog, callApi }) =>
    preventConcurrent(() =>
        pushBacklog.process(filtered(
            anyCategoryIn(allowedCategories), callApi)));
exports.makeJob = makeJob;

const filtered = (predicate, consumer) =>
    (item) =>
        predicate(item) ? consumer(item) : Promise.resolve();

const anyCategoryIn = (allowedCategories) =>
    ({ auction: { categories = [] } }) =>
        !!intersection(allowedCategories, categories).length;

const callMarekApi = (apiUri, auth, pathToUri) => ({ auction, images }) => {
    const logger = makeLogger(`[auction.id=${auction.id}]`);

    const onSuccess = ({ status, message }) => {
        if (parseInt(status) !== 1) {
            if (message === "Aukcja o podanym numerze już istnieje.") {
                logger.warn("Duplicate auction, skipping.");
            } else {
                logger.error(`Marek returned (status=${status}, message=${message})`);
                throw new Error(`Unexpected Marek status: ${status}`);
            }
        } else {
            logger.log("Marek API success");
        }
    };
    const onError = (error) => {
        logger.error("Marek API call failed", error);
        throw error;
    };

    const body = {
        number: auction.id,
        name: auction.name,
        price: auction.price,
        datetime: formatDate(auction.endingTime),
        photos: images.map(pathToUri),
        saler: auction.seller
    };
    
    logger.log("Calling Marek API", body);

    return request({ 
            uri: apiUri,
            method: "POST",
            json: true,
            auth,
            body
        })
        .then(onSuccess, onError);
};

const makeLogger = (context) => new Proxy(console, {
    get(target, name) {
        if (!console[name]) {
            return console[name];
        }
        return (...args) => console[name].apply(console, [...args, context]);
    }
});

const formatDate = (timestamp) => {
    const [month, day, year] = 
        new Date(timestamp * 1000)
            .toLocaleString("en-US", {
                timeZone: "Europe/Warsaw",
                year: "numeric",
                month: "numeric",
                day: "numeric"
            })
            .split("/");
    return [year, month, day].join("-");
};
exports.formatDate = formatDate;

const makePathToUri = (selfUri) => (path) => encodeURI(selfUri + path.replace("\\", "/"));

const preventConcurrent = (job) => {
    let running = false;

    return () => {
        if (running) {
            return Promise.resolve();
        }
        running = true;

        return job()
            .then(
                (value) => {
                    running = false;
                    return value;
                },
                (cause) => {
                    running = false;
                    throw cause;
                });
    };
};
