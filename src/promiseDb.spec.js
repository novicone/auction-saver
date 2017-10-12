/* jshint mocha: true, expr: true */
const { expect } = require("chai");
const promiseDb = require("./promiseDb");

describe("promiseDb", () => {
    let db;

    beforeEach(() => {
        db = promiseDb.create();
    });

    it("returns promises", () => {
        return db.insert({ foo: 123 })
            .then((row) => {
                expect(row).to.include({ foo: 123 });
            });
    });

    it("wraps cursor", () => {
        return db.insert([{ x: 1 }, { x: 2 }, { x: 3 }, { x: 4 }])
            .then(() => db.find({ x: { $gt: 1 } }).sort({ x: -1 }).skip(1).limit(2).exec())
            .then((rows) => {
                expect(rows).to.have.lengthOf(2);
                expect(rows[0]).to.include({ x: 3 });
                expect(rows[1]).to.include({ x: 2 });
            });
    });
});
