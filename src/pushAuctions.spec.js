/* jshint mocha: true, expr: true */
const { expect } = require("chai");
const { stub } = require("sinon");

const pushAuctions = require("./pushAuctions");
const backlog = require("./backlog");
const promiseDb = require("./promiseDb");

describe("pushAuctions job", () => {
    const allowedCategories = [1, 2, 3];
    let pushBacklog;
    let callApi;

    let job;

    beforeEach(() => {
        pushBacklog = backlog(promiseDb.create(), () => 123, 1);
        callApi = stub().resolves();
        job = pushAuctions.makeJob({ allowedCategories, pushBacklog, callApi });
    });

    it("does not call api when auction does not have allowed category", () => {
        pushBacklog.add(item(1, [4, 5, 6]));

        return job().then(() => {
            expect(callApi).to.not.have.been.called;
        });
    });
    
    it("calls api when auction has allowed category", () => {
        pushBacklog.add(item(1, [3, 4, 5]));
        
        return job().then(() => {
            expect(callApi).to.have.been.called;
        });
    });
    
    it("does not run concurrently", () => {
        pushBacklog.add(item(1, [3, 4, 5]));
        pushBacklog.add(item(2, [1, 2, 3]));
        
        return Promise.all([job(), job()]).then(() => {
            expect(callApi).to.have.been.calledOnce;
        });
    });

    it("runs when previous job has finished", () => {
        pushBacklog.add(item(1, [3, 4, 5]));
        pushBacklog.add(item(2, [1, 2, 3]));
        
        return job()
            .then(() => job())
            .then(() => {
                expect(callApi).to.have.been.calledTwice;
            });
    });

    const item = (id, categories) => ({ auction: { id: 1, categories }, images: ["a", "b"] });
});
