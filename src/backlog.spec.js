/* jshint mocha: true, expr: true */
const { expect } = require("chai");
const { stub } = require("sinon");
const promiseDb = require("./promiseDb");
const makeBacklog = require("./backlog");

describe("backlog", () => {
    let backlog;
    let handler;

    const BATCH_SIZE = 2;

    beforeEach(() => {
        backlog = makeBacklog(promiseDb.create(), ticker(), BATCH_SIZE);
        handler = stub();
    });

    it("calls handler with added item", () => {
        handler.resolves();
        backlog.add(123);

        return backlog.process(handler).then(() => {
            expect(handler).to.have.been.calledWith(123);
        });
    });

    it("processes batches of given size in order of adding", () => {
        handler.resolves();
        backlog.add(1);
        backlog.add(2);
        backlog.add(3);

        return backlog.process(handler).then(() => {
            expect(handler).to.have.been.calledWith(1);
            expect(handler).to.have.been.calledWith(2);
            expect(handler).to.have.not.been.calledWith(3);
        });
    });

    it("reschedules failed items", () => {
        handler.rejects();
        backlog.add(1);
        backlog.add(2);

        return backlog.process(handler)
            .then(() => backlog.process(handler))
            .then(() => {
                expect(handler).to.have.been.calledWith(1);
                expect(handler).to.have.been.calledWith(2);
                expect(handler).to.have.callCount(4);
            });
    });
    
    it("failed items are scheduled last", () => {
        handler.rejects();
        backlog.add(1);
        backlog.add(2);
        backlog.add(3);
        backlog.add(4);

        return backlog.process(handler)
            .then(() => {
                handler.resolves();
                return backlog.process(handler);
            })
            .then(() => {
                expect(handler).to.have.been.calledWith(3);
                expect(handler).to.have.been.calledWith(4);
            });
    });
});

const ticker = () => {
    let time = 0;
    return () => time++;
};
