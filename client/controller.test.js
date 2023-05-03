import { Controller } from "./controller.js";
import { CRDTOp, OpType, WChar, WId } from "./utils.js";

function getRandomCharacter() {
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    return characters.charAt(Math.floor(Math.random() * characters.length));
}


/**
 * 
 * @param {number} siteId the id of this client in document
 * @param {number} numChars number of characters in the document to start with
 * @param {number[]} [deleteChars] positions of the characters to be deleted in ascending order
 * @returns {Controller} 
 */
function createTestController(siteId, numChars, deleteChars=[]) {
    const testController = new Controller(siteId);
    let prevWId = null;
    for (let i = 0; i < numChars; i++) {
        const thisWId = new WId(siteId, i);
        testController.tree.insert(null, thisWId, getRandomCharacter(), true, prevWId, null);
        prevWId = thisWId;
    }

    let numDeleted = 0;
    for (let i = 0; i < deleteChars.length; i++) {
        testController.tree.delete(deleteChars[i] - numDeleted);
        numDeleted += 1;
    }

    return testController;
}


test('Insert in new Doc', () => {
    const testController = createTestController(1, 0);
    const op = testController.generateInsert('a', 0);
    const expectedWChar = new WChar(new WId(1, 1), 'a', true, null, null);
    const expectedOp = new CRDTOp(OpType.Insert, expectedWChar);

    expect(op).toEqual(expectedOp);
});

test('Insert in between two characters', () => {
    const testController = createTestController(1, 3);
    const op = testController.generateInsert('a', 1);

    const expectedWChar = new WChar(new WId(1, 3), 'a', true, new WId(1, 0), new WId(1, 1));
    const expectedOp = new CRDTOp(OpType.Insert, expectedWChar);

    expect(op).toEqual(expectedOp);
});


test('Insert in between two characters with deleted characters', () => {
    const testController = createTestController(1, 4, [1, 2]);
    const op = testController.generateInsert('a', 1);

    const expectedWChar = new WChar(new WId(1, 4), 'a', true, new WId(1, 0), new WId(1, 3));
    const expectedOp = new CRDTOp(OpType.Insert, expectedWChar);

    expect(op).toEqual(expectedOp);
});