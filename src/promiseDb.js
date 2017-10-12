const q = require("q");
const Datastore = require("nedb");

const promiseDb = (db) => ({
    insert: q.nbind(db.insert, db),
    find: bindWrapper(db.find, db),
    findOne: bindWrapper(db.findOne, db),
    count: bindWrapper(db.count, db),
    update: q.nbind(db.update, db),
    remove: q.nbind(db.remove, db)
});

const wrapCursor = (cursor) => new Proxy(cursor, {
    get(target, name) {
        return name === "exec"
            ? q.nbind(cursor.exec, cursor)
            : bindWrapper(cursor[name], cursor);
    }
});

const bindWrapper = (fn, target) => (...args) => wrapCursor(fn.apply(target, args));

module.exports = promiseDb;
promiseDb.create = (...args) => promiseDb(new Datastore(...args));
