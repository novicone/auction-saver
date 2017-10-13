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
    const idTrace = `{auction.id=${auction.id}}`;

    console.log(`Calling Marek API ${idTrace}`);

    return request({ 
            uri: apiUri,
            method: "POST",
            json: true,
            auth,
            body: {
                number: auction.id,
                name: auction.name,
                price: auction.price,
                datetime: auction.endingTime,
                photos: images.map(pathToUri),
                saler: auction.seller
            }
        })
        .then(({ status, message }) => {
            if (parseInt(status) !== 1) {
                if (message === "Aukcja o podanym numerze już istnieje.") {
                    console.warn(`Auction already there ${idTrace}`);
                } else {
                    console.error(`Marek returned (status=${status}, message=${message}) ${idTrace}`);
                    throw new Error(`Unexpected Marek status: ${status}`);
                }
            } else {
                console.log(`Marek API success ${idTrace}`);
            }
        })
        .catch((error) => {
            console.error(`Marek API call failed ${idTrace}`, error);
            throw error;
        });
};

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
