const { Controller } = require('./controller.js');
const { CRDTOp, OpType, WChar, WId } = require("./utils.js");

function getCharacter(i) {
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    return characters.charAt(i % characters.length);
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
        testController.tree.insert(new WChar(thisWId, getCharacter(i), true, prevWId, null), i);
        prevWId = thisWId;
    }
    testController.tick = numChars - 1;

    let numDeleted = 0;
    for (let i = 0; i < deleteChars.length; i++) {
        testController.tree.delete(deleteChars[i] - numDeleted);
        numDeleted += 1;
    }

    return testController;
}


test('Insert in new Doc', () => {
    const testController = createTestController(1, 0);
    const op = testController.generateInsert('A', 0);
    const expectedWChar = new WChar(new WId(1, 0), 'A', true, null, null);
    const expectedOp = new CRDTOp(OpType.Insert, expectedWChar);

    console.log(op);

    expect(op).toEqual(expectedOp);
    expect(testController.tree.value()).toBe('A');
});

test('Insert in between two characters', () => {
    const testController = createTestController(1, 3);
    const op = testController.generateInsert('A', 1);
    console.log("Current doc:", testController.tree.value());
    console.log("Current tree:", testController.tree.root);
    console.log("Current tree child:", testController.tree.root.children[0]);

    const expectedWChar = new WChar(new WId(1, 3), 'A', true, new WId(1, 0), new WId(1, 1));
    const expectedOp = new CRDTOp(OpType.Insert, expectedWChar);

    expect(op).toEqual(expectedOp);
    expect(testController.tree.value()).toBe('aAbc');
});


test('Insert in between two characters with deleted characters', () => {
    const testController = createTestController(1, 4, [1, 2]);
    expect(testController.tree.value()).toBe('ad');
    const op = testController.generateInsert('A', 1);

    const expectedWChar = new WChar(new WId(1, 4), 'A', true, new WId(1, 0), new WId(1, 3));
    const expectedOp = new CRDTOp(OpType.Insert, expectedWChar);

    expect(testController.tree.value()).toBe('aAd');
    expect(op).toEqual(expectedOp);
});


test('Delete characters', () => {
    const testController = createTestController(1, 4);
    const op1 = testController.generateDelete(1);
    expect(testController.tree.value()).toBe('acd');

    const expectedWChar1 = new WChar(new WId(1, 1), 'b', false, new WId(1, 0), new WId(1, 2));
    const expectedOp1 = new CRDTOp(OpType.Delete, expectedWChar1);

    expect(op1).toEqual(expectedOp1);
    // Delete one more
    const op2 = testController.generateDelete(1);
    expect(testController.tree.value()).toBe('ad');

    const expectedWChar2 = new WChar(new WId(1, 2), 'c', false, new WId(1, 1), new WId(1, 3));
    const expectedOp2 = new CRDTOp(OpType.Delete, expectedWChar2);

    expect(op2).toEqual(expectedOp2);
});


test('Mix of insert and delete', () => {
    const testController = createTestController(1, 4);

    const op1 = testController.generateInsert('A', 0);
    const expectedWChar1 = new WChar(new WId(1, 4), 'A', true, null, new WId(1, 0));
    const expectedOp1 = new CRDTOp(OpType.Insert, expectedWChar1);
    expect(op1).toEqual(expectedOp1);
    
    // Delete one
    const op2 = testController.generateDelete(1);
    const expectedWChar2 = new WChar(new WId(1, 0), 'a', false, new WId(1, 4), new WId(1, 1));
    const expectedOp2 = new CRDTOp(OpType.Delete, expectedWChar2);
    expect(op2).toEqual(expectedOp2);

    // Insert one more
    const op3 = testController.generateInsert('B', 1);
    const expectedWChar3 = new WChar(new WId(1, 5), 'B', true, new WId(1, 4), new WId(1, 1));
    const expectedOp3 = new CRDTOp(OpType.Insert, expectedWChar3);
    expect(op3).toEqual(expectedOp3);

    // Delete one more
    const op4 = testController.generateDelete(1);
    const expectedWChar4 = new WChar(new WId(1, 5), 'B', false, new WId(1, 4), new WId(1, 1));
    const expectedOp4 = new CRDTOp(OpType.Delete, expectedWChar4);
    expect(op4).toEqual(expectedOp4);
});
