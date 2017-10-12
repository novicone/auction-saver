/* jshint mocha: true, expr: true */

const { format } = require("util");
const { assign, clone, find } = require("lodash");
const Maybe = require("data.maybe");

const chai = require("chai"); const { expect } = chai;
const { stub, match } = require("sinon");
chai.use(require("sinon-chai"));

const auctions = require("./auctions");

describe("auctions", () => {
    let generatePath;
    let download;
    let fetchAuction;
    let auctionsStorage;
    let notifySaved;
    let saveAuctionAction;

    beforeEach(() => {
        download = stub().resolves();
        fetchAuction = stub();
        auctionsStorage = dummyStorage();
        notifySaved = stub().resolves();
        generatePath = stub();
        saveAuctionAction = auctions.createSaveAuctionAction(
            fetchAuction,
            auctionsStorage,
            auctions.createImagesSaver(generatePath, download),
            notifySaved);
    });

    const SESSION = "session_id";
    const USER = "some_user";
    const ID = "123";

    it("saves auction for given user", () => {
        givenAuction();

        return saveAuction().then(() => {
            expect(find(auctionsStorage.auctions, { id: ID }))
                .to.include({ owner: USER });
        });
    });

    it("saves images of finished auction", () => {
        givenAuction({ finished: true, images: ["/foo", "/bar"] });

        return saveAuction().then(() => {
            expect(download).to.have.been.calledTwice;
            expect(download).to.have.been.calledWith("/foo", match.any);
            expect(download).to.have.been.calledWith("/bar", match.any);
        });
    });

    it("notifies about saved auction", () => {
        generatePath.callsFake((_, number) => `image:${number}`);
        const auction = givenAuction({ finished: true, images: ["/foo", "/bar"] });

        return saveAuction().then(() => {
            expect(notifySaved).to.have.been.calledWith({ auction, images: ["image:1", "image:2"] });
        });
    });

    it("does not save images when auction not finished", () => {
        givenAuction({ finished: false });
        
        return saveAuction().then(() => {
            expect(download).to.have.not.been.called;
        });
    });

    it("saves images on subsequent action if auction gets finished", () => {
        givenAuction({ finished: false });
        
        return saveAuction()
            .then(() => {
                givenAuction({ finished: true, images: ["/foo", "/bar"] });
                
                return saveAuction();
            })
            .then(() => {
                expect(download).to.have.been.calledTwice;
            });
    });

    it("reports conflict when finished auction already saved", () => {
        givenAuction({ finished: true });
        download.resolves();

        return saveAuction()
            .then(saveAuction)
            .then(...expectRejection((cause) => {
                expect(cause).to.include({ status: 409 });
            }));
    });

    it("reports not found when auction not found", () => {
        givenNoAuction();

        return saveAuction()
            .then(...expectRejection((cause) => {
                expect(cause).to.include({ status: 404 });
            }));
    });

    it("marks auction as expired if not found on subsequent action", () => {
        givenAuction({ finished: false });
        
        return saveAuction()
            .then(() => {
                givenNoAuction();
                
                return saveAuction();
            })
            .then(...expectRejection(() => {
                expect(find(auctionsStorage.auctions, { id: ID }))
                    .to.include({ expired: true });
            }));
    });
    
    const givenAuction = (props = { }) => {
        const auction = assign({ id: ID, endingTime: 1234567, images: [] }, props);

        fetchAuction
            .withArgs(SESSION, auction.id || ID)
            .resolves(Maybe.Just(auction));

        return auction;
    };

    const givenNoAuction = () =>
        fetchAuction
            .withArgs(SESSION, ID)
            .resolves(Maybe.Nothing());

    const saveAuction = () => saveAuctionAction(SESSION, USER, ID);
});

const expectRejection = (onRejected) => ([
    (value) => { throw new Error(format("Expected promise rejection but it resolved with %o.", value)); },
    (cause) => {
        try {
            onRejected(cause);
        } catch (error) {
            throw new Error(format("Rejection expectation failed for", cause, error));
        }
    }
]);

function dummyStorage() {
    const auctions = [];
    return {
        auctions,
        save(auction) {
            auctions.push(clone(auction));
            return Promise.resolve();
        },
        update(owner, id, update) {
            const auction = find(auctions, { owner, id });
            auction && assign(auction, update);
            return Promise.resolve();
        },
        findOneBy(spec) {
            return Promise.resolve(clone(find(auctions, spec)));
        }
    };
}
