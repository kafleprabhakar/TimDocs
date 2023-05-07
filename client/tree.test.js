const { CRDTOp, OpType, WChar, WId } = require("./utils.js");
const { Tree, TreeNode } = require("./tree.js");

function getCharacter(i) {
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    return characters.charAt(i % characters.length);
}

/**
 * Gets the prevID and nextID of all the nodes in tree.
 * @param {Tree} tree 
 */
function getIDSequence(tree) {
    const sequence = [];
    for (let node of tree.preOrderTraversal()) {
        toPush = "";
        if (node.wChar.idPrev != null) {
            toPush += node.wChar.idPrev.numTick;
        }
        toPush += ",";
        toPush += node.wChar.id.numTick;
        toPush += ",";
        if (node.wChar.idNew != null) {
            toPush += node.wChar.idNew.numTick;
        }
        sequence.push(toPush);
    }
    return sequence;
}

/**
 * Generates the correct order of idPrev and idNew given some sequence.
 * @param {[number]} correctOrder 
 * @returns 
 */
function correctIDSequence(correctOrder) {
    const sequence = [];
    for (let i = 0; i < correctOrder.length; i++) {
        id = correctOrder[i];
        toPush = "";
        if (i > 0) {
            toPush += correctOrder[i-1];
        }
        toPush += ",";
        toPush += id;
        toPush += ",";
        if (i < correctOrder.length - 1) {
            toPush += correctOrder[i+1];
        }
        sequence.push(toPush);
    }
    return sequence;
}

/**
 * Note: numSite will always be 1
 * @param {number} numChars 
 */
function createTestTree(numChars, toDel = []) {
    const testTree = new Tree();
    for (let i = 0; i < numChars; i++) {
        if (i != 0) {
            testTree.insert(new WChar(new WId(1, i), getCharacter(i), true, new WId(1, i-1)), i);
        } else {
            testTree.insert(new WChar(new WId(1, i), getCharacter(i), true), i);
        }
    }
    for (let i of toDel) {
        testTree.delete(i);
    }
    return testTree;
}

test('Insert into an empty tree', () => {
    const testTree = new Tree();
    testTree.insert(new WChar(new WId(1, 0), getCharacter(0), true), 0);
    expect(testTree.value()).toBe("a");
    expect(testTree.root.wChar.c).toBe("a");
    expect(testTree.root.parent).toBe(null);
})

test('Insert at the beginning of the tree', () => {
    const testTree = createTestTree(3);
    expect(testTree.value()).toBe("abc");
    testTree.insert(new WChar(new WId(1, 3), "A", true, null, new WId(1, 0)), 0);
    // expect(getIDSequence(testTree)).toBe(correctIDSequence([3, 0, 1, 2]));
    expect(testTree.value()).toBe("Aabc");
    expect(testTree.find(new WId(1, 3))).toBeInstanceOf(WChar);
    expect(testTree.find(new WId(1, 3)).c).toBe("A");
})

test('Insert in the middle of the tree', () => {
    const testTree = createTestTree(3);
    const c = new WChar(new WId(1, 3), "A", true, new WId(1, 0), new WId(1, 1));
    expect(testTree.value()).toBe("abc");
    testTree.insert(c, 1);
    expect(testTree.value()).toBe("aAbc");
    expect(testTree.pos(c)).toBe(1);
})

test('Insert at the end of the tree', () => {
    const testTree = createTestTree(3);
    expect(testTree.value()).toBe("abc");
    testTree.insert(new WChar(new WId(1, 3), "A", true, new WId(1, 2), null), 3);
    expect(testTree.value()).toBe("abcA");
})

test('Delete 2 chars from the tree, insert in beginning', () => {
    const testTree = createTestTree(5, [1, 2]);
    expect(testTree.value()).toBe("ace");
    const c = new WChar(new WId(1, 3), "A", true, null, new WId(1, 0))
    testTree.insert(c, 0);
    expect(testTree.value()).toBe("Aace");
}) 

test('Delete 2 chars from the tree, insert in middle', () => {
    const testTree = createTestTree(5, [1, 2]);
    expect(testTree.value()).toBe("ace");
    const c = new WChar(new WId(1, 3), "A", true, new WId(1, 0), new WId(1, 1));
    testTree.insert(c, 1);
    expect(testTree.value()).toBe("aAce");
}) 

test('Delete 2 chars from the tree, insert in end', () => {
    const testTree = createTestTree(5, [1, 2]);
    expect(testTree.value()).toBe("ace");
    const c = new WChar(new WId(1, 3), "A", true, new WId(1, 4), null);
    testTree.insert(c, 5);
    expect(testTree.value()).toBe("aceA");
})