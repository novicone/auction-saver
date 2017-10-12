module.exports = (db, now, batchSize) => ({
    add: (item) => db.insert({ item, created: now() }),
    process(handler) {
        const processItem = ({ _id, item }) =>
            handler(item).then(
                () => db.remove({ _id }),
                () => db.update({ _id }, { $set: { created: now() } }));

        return db.find({ }).sort({ created: 1 }).limit(batchSize).exec()
            .then((rows) => Promise.all(rows.map(processItem)));
    }
});
