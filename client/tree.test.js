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
    let toPush = "";
    for (let node of tree.preOrderTraversal()) {
        toPush = "";
        if (node.wChar.idPrev != null) {
            toPush += node.wChar.idPrev.numTick;
        }
        toPush += "," + node.wChar.id.numTick + ",";
        if (node.wChar.idNew != null) {
            toPush += node.wChar.idNew.numTick;
        }
        sequence.push(toPush);
    }
    return sequence;
}

/**
 * Generates the correct order of idPrev and idNew given some sequence.
 * @param {[[string, string, string]]} correctOrder 
 * @returns 
 */
function correctIDSequence(correctOrder) {
    const sequence = [];
    let toPush = "";
    for (let i = 0; i < correctOrder.length; i++) {
        let prev = correctOrder[i][0];
        let me = correctOrder[i][1];
        let next = correctOrder[i][2];
        toPush = prev + "," + me + "," + next;
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
    expect(getIDSequence(testTree)).toStrictEqual(correctIDSequence([["", "0", ""]]));
})

test('Insert at the beginning of the tree', () => {
    const testTree = createTestTree(3);
    expect(testTree.value()).toBe("abc");
    testTree.insert(new WChar(new WId(1, 3), "A", true, null, new WId(1, 0)), 0);
    // expect(getIDSequence(testTree)).toBe(correctIDSequence([3, 0, 1, 2]));
    expect(testTree.value()).toBe("Aabc");
    expect(testTree.find(new WId(1, 3))).toBeInstanceOf(WChar);
    expect(testTree.find(new WId(1, 3)).c).toBe("A");
    expect(getIDSequence(testTree)).toStrictEqual(correctIDSequence([["", "3", "0"], ["", "0", ""], ["0", "1", ""], ["1", "2", ""]]));
})

test('Insert in the middle of the tree', () => {
    const testTree = createTestTree(3);
    const c = new WChar(new WId(1, 3), "A", true, new WId(1, 0), new WId(1, 1));
    expect(testTree.value()).toBe("abc");
    testTree.insert(c, 1);
    expect(testTree.value()).toBe("aAbc");
    expect(testTree.pos(c)).toBe(1);
    expect(getIDSequence(testTree)).toStrictEqual(correctIDSequence([["", "0", ""], ["0", "3", "1"], ["0", "1", ""], ["1", "2", ""]]));
})

test('Insert at the end of the tree', () => {
    const testTree = createTestTree(3);
    expect(testTree.value()).toBe("abc");
    testTree.insert(new WChar(new WId(1, 3), "A", true, new WId(1, 2), null), 3);
    expect(testTree.value()).toBe("abcA");
    expect(getIDSequence(testTree)).toStrictEqual(correctIDSequence([["", "0", ""], ["0", "1", ""], ["1", "2", ""], ["2", "3", ""]]));
})

test('Delete 2 chars from the tree, insert in beginning', () => {
    const testTree = createTestTree(5, [1, 2]);
    expect(testTree.value()).toBe("ace");
    const c = new WChar(new WId(1, 5), "A", true, null, new WId(1, 0))
    testTree.insert(c, 0);
    expect(testTree.value()).toBe("Aace");
    expect(getIDSequence(testTree)).toStrictEqual(correctIDSequence([["", "5", "0"], ["", "0", ""], ["0", "1", ""], ["1", "2", ""], ["2", "3", ""], ["3", "4", ""]]));
}) 

test('Delete 2 chars from the tree, insert in middle', () => {
    const testTree = createTestTree(5, [1, 2]);
    expect(testTree.value()).toBe("ace");
    const c = new WChar(new WId(1, 5), "A", true, new WId(1, 0), new WId(1, 2));
    testTree.insert(c, 1);
    expect(testTree.value()).toBe("aAce");
    expect(getIDSequence(testTree)).toStrictEqual(correctIDSequence([["", "0", ""], ["0", "5", "2"], ["0", "1", ""], ["1", "2", ""], ["2", "3", ""], ["3", "4", ""]]));
}) 

test('Delete 2 chars from the tree, insert in end', () => {
    const testTree = createTestTree(5, [1, 2]);
    expect(testTree.value()).toBe("ace");
    const c = new WChar(new WId(1, 5), "A", true, new WId(1, 4), null);
    testTree.insert(c, 5);
    expect(testTree.value()).toBe("aceA");
    expect(getIDSequence(testTree)).toStrictEqual(correctIDSequence([["", "0", ""], ["0", "1", ""], ["1", "2", ""], ["2", "3", ""], ["3", "4", ""], ["4", "5", ""]]));
})

test('Subsequence, c = null, d = null', () => {
    const testTree = createTestTree(5, [1,2]);
    expect(testTree.value()).toBe("ace");
    const subseq = testTree.subseq(null, null);
    expect(subseq.length).toBe(5);
    expect(subseq[0].id).toStrictEqual(new WId(1, 0));
    expect(subseq[4].id).toStrictEqual(new WId(1, 4))
})

test('Subsequence, c = null, d = non-null', () => {
    const testTree = createTestTree(5, [1,2]);
    expect(testTree.value()).toBe("ace");
    const c = new WChar(new WId(1, 2), "c", true, new WId(1, 1), new WId(1, 3));
    const subseq = testTree.subseq(null, c);
    expect(subseq.length).toBe(2);
    expect(subseq[0].id).toStrictEqual(new WId(1, 0));
    expect(subseq[1].id).toStrictEqual(new WId(1, 1));
    expect(subseq[1].visible).toBe(false);
})

test('Subsequence, c = non-null, d = null', () => {
    const testTree = createTestTree(5, [1,2]);
    expect(testTree.value()).toBe("ace");
    const c = new WChar(new WId(1, 2), "c", true, new WId(1, 1), new WId(1, 3));
    const subseq = testTree.subseq(c, null);
    expect(subseq.length).toBe(2);
    expect(subseq[0].id).toStrictEqual(new WId(1, 3));
    expect(subseq[1].id).toStrictEqual(new WId(1, 4));
    expect(subseq[0].visible).toBe(false);
})

test('Subsequence, c = non-null, d = non-null', () => {
    const testTree = createTestTree(5, [1,2]);
    expect(testTree.value()).toBe("ace");
    const c = new WChar(new WId(1, 2), "c", true, new WId(1, 1), new WId(1, 3));
    const d = new WChar(new WId(1, 3), "d", true, new WId(1, 2), new WId(1, 4));
    const subseq = testTree.subseq(c, d);
    expect(subseq.length).toBe(0);
})