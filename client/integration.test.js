import { Client } from "./client.js";
import { CRDTOp, OpType } from "./utils.js";
var os = require("os");

class Pos {
    constructor(ch, line = 0, sticky = null) {
        this.line = line;
        this.ch = ch;
        this.sticky = sticky;
    }
}

class Change {
    /**
     * 
     * @param {OpType} origin 
     * @param {Pos} from 
     * @param {Pos} to 
     * @param {string[]} text 
     * @param {string[]} removed 
     */
    constructor(origin, from, to, text, removed) {
        this.origin = origin;
        this.from = from;
        this.to = to;
        this.text = text;
        this.removed = removed;
    }
}

/**
 * 
 * @param {OpType} type 
 * @param {string} c 
 * @param {number} pos 
 */
function createChangeObject(type, c, pos) {
    const origin = type;
    const from = new Pos(pos);
    const to = new Pos(pos);
    let text = [''];
    let removed = [''];
    if (type == OpType.Insert) {
        text = [c];
    } else if (type == OpType.Delete) {
        removed = [c];
        to.ch = pos + 1;
        to.sticky = 'before';
        from.sticky = 'after';
    }

    return new Change(origin, from, to, text, removed);
}

/**
 * Sleep for `delay` milliseconds.
 * Not the best way to do it. But since we are only using this for testing, its OK
 * @param {number} delay in milliseconds
 */
function sleep(delay) {
    var start = new Date().getTime();
    while (new Date().getTime() < start + delay);
}

function getRandomCharacter() {
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    const i = Math.floor(Math.random() * characters.length);
    return characters.charAt(i % characters.length);
}

function getRandomPos(len) {
    return Math.floor(Math.random() * (len + 1));
}

function insertToExpected(str, char, pos) {
    return str.slice(0, pos) + char + str.slice(pos);
}

function deleteFromExpected(str, pos) {
    return str.slice(0, pos) + str.slice(pos + 1);
}

async function testConcurrentOps (deleteOp=false) {
    const c1 = await Client.makeClient(false);
    const c2 = await Client.makeClient(false);
    const c3 = await Client.makeClient(false);
    const clients = [c1, c2, c3];

    let expectedStr = '';
    for (let i = 0; i < 1000; i++) {
        let ops = [];
        let changes = [];
        for (let j = 0; j < 2; j++) {
            let opType = null;
            let pos = null;
            let char = null;

            if (Math.random() < 0.3 && expectedStr.length > 0 && deleteOp) {
                opType = OpType.Delete;
                pos = Math.floor(Math.random() * expectedStr.length);
                char = expectedStr[pos];
            } else {
                opType = OpType.Insert;
                pos = Math.floor(Math.random() * (expectedStr.length + 1));
                char = getRandomCharacter();
            }
            
            const ch = createChangeObject(opType, char, pos);
            const op = clients[j].handleEditorChange(ch);
            changes.push(ch);
            ops.push(op);
        }

        let firstOp = changes[1];
        let secondOp = changes[0];
        if (ops[0].wChar.id.isLessThan(ops[1].wChar.id)) {
            firstOp = changes[0];
            secondOp = changes[1];
        }

        expectedStr = operateOnExpected(expectedStr, firstOp);
        let doSecond = true;
        if (firstOp.from.ch <= secondOp.from.ch) {
            if (firstOp.origin == OpType.Insert) {
                secondOp.from.ch += 1;
                secondOp.to.ch += 1;
            }
            else if (firstOp.from.ch < secondOp.from.ch) {
                secondOp.from.ch -= 1;
                secondOp.to.ch -= 1;
            }
        }
        // Following conditional fixes bug where 2 of the same deletes were getting processed as 2 separate deletes 
        if (firstOp.origin == OpType.Delete && secondOp.origin == OpType.Delete && ops[0].wChar.id.isEqual(ops[1].wChar.id)) {
            doSecond = false;
        }
        if (doSecond) {
            expectedStr = operateOnExpected(expectedStr, secondOp);
        }
        c1.handleRemoteOp(ops[1]);
        c2.handleRemoteOp(ops[0]);
        // Apply op1 and op2 in random order
        const first = Math.floor(Math.random() * ops.length);
        c3.handleRemoteOp(ops[first]);
        c3.handleRemoteOp(ops[1-first]);

        for (let c of clients) {
            expect(c.controller.tree.value()).toBe(expectedStr);
        }
    }
}

/**
 * 
 * @param {string} str 
 * @param {Change} change 
 */
function operateOnExpected(str, change) {
    if (change.origin == OpType.Insert) {
        return insertToExpected(str, change.text[0], change.from.ch);
    } else {
        return deleteFromExpected(str, change.from.ch);
    }
}

beforeEach(() => {
    window.location = {'hostname': "localhost"};
});

test('Sync manual inserts', async () => {
    console.log(process.version);
    const c1 = await Client.makeClient(false);
    const c2 = await Client.makeClient(false);
    const isC1Lower = (c1.controller.siteId.localeCompare(c1.controller.siteId) === -1);
    console.log("C1:", c1.controller.siteId);
    
    const op = c1.handleEditorChange(createChangeObject(OpType.Insert, 'a', 0));
    c2.handleRemoteOp(op);
    expect(c1.controller.tree.value()).toBe('a');
    expect(c2.controller.tree.value()).toBe('a');

    const op2 = c2.handleEditorChange(createChangeObject(OpType.Insert, 'b', 0));
    c1.handleRemoteOp(op2);
    expect(c1.controller.tree.value()).toBe('ba');
    expect(c2.controller.tree.value()).toBe('ba');

    const op3 = c1.handleEditorChange(createChangeObject(OpType.Insert, 'c', 1));
    const op4 = c2.handleEditorChange(createChangeObject(OpType.Insert, 'd', 1));
    expect(c1.controller.tree.value()).toBe('bca');
    expect(c2.controller.tree.value()).toBe('bda');
    console.log("Op4:", op4);
    c1.handleRemoteOp(op4);
    c2.handleRemoteOp(op3);

    let expectedStr = '';
    if (op3.wChar.id.isLessThan(op4.wChar.id)) {
        expectedStr = 'bcda';
    } else {
        expectedStr = 'bdca';
    }
    global.expected = expectedStr;
    console.log("Expected:", expectedStr);
    expect(c1.controller.tree.value()).toBe(expectedStr);
    expect(c2.controller.tree.value()).toBe(expectedStr);
    
    const op5 = c2.handleEditorChange(createChangeObject(OpType.Delete, 'b', 0));
    c1.handleRemoteOp(op5);
    expectedStr = expectedStr.slice(1);
    expect(c1.controller.tree.value()).toBe(expectedStr);
    expect(c2.controller.tree.value()).toBe(expectedStr);
});

test("Automated serialized inserts", async () => {
    const c1 = await Client.makeClient(false);
    const c2 = await Client.makeClient(false);
    const c3 = await Client.makeClient(false);
    const clients = [c1, c2, c3];

    let expectedStr = '';
    for (let i = 0; i < 100; i++) {
        const j = Math.floor(Math.random() * clients.length);
        const c = clients[j];
        const char = getRandomCharacter();
        const pos = getRandomPos(expectedStr.length);
        expectedStr = insertToExpected(expectedStr, char, pos);
        const op = c.handleEditorChange(createChangeObject(OpType.Insert, char, pos));
        for (let k = 0; k < clients.length; k++) {
            if (j !== k) {
                clients[k].handleRemoteOp(op);
            }
            expect(clients[k].controller.tree.value()).toBe(expectedStr);
        }
    }
});

test("Automated serialized inserts and deletes", async () => {
    const c1 = await Client.makeClient(false);
    const c2 = await Client.makeClient(false);
    const c3 = await Client.makeClient(false);
    const clients = [c1, c2, c3];

    let expectedStr = '';
    for (let i = 0; i < 100; i++) {
        const j = Math.floor(Math.random() * clients.length);
        const c = clients[j];
        
        let opType = null;
        let pos = null;
        let char = null;

        if (Math.random() < 0.3 && expectedStr.length > 0) {
            opType = OpType.Delete;
            pos = Math.floor(Math.random() * expectedStr.length);
            char = expectedStr[pos];
            expectedStr = deleteFromExpected(expectedStr, pos);
        } else {
            opType = OpType.Insert;
            pos = Math.floor(Math.random() * (expectedStr.length + 1));
            char = getRandomCharacter();
            expectedStr = insertToExpected(expectedStr, char, pos);
        }
        console.log("Iteration ", i, ", the expected string: ", expectedStr);
        const op = c.handleEditorChange(createChangeObject(opType, char, pos));
        for (let k = 0; k < clients.length; k++) {
            if (j !== k) {
                clients[k].handleRemoteOp(op);
            }
            expect(clients[k].controller.tree.value()).toBe(expectedStr);
        }
    }
});

test("Automated concurrent inserts", async () => {
    await testConcurrentOps();
});

test("Automated concurrent inserts and deletes", async () => {
    await testConcurrentOps(true);
});

test('Concurrent delete then insert', async () => {
    console.log(process.version);
    const c1 = await Client.makeClient(false);
    const c2 = await Client.makeClient(false);
    const isC1Lower = (c1.controller.siteId.localeCompare(c1.controller.siteId) === -1);
    console.log("C1:", c1.controller.siteId);
    
    const op = c1.handleEditorChange(createChangeObject(OpType.Insert, 'r', 0));
    c2.handleRemoteOp(op);
    expect(c1.controller.tree.value()).toBe('r');
    expect(c2.controller.tree.value()).toBe('r');

    const op2 = c2.handleEditorChange(createChangeObject(OpType.Insert, 'm', 0));
    c1.handleRemoteOp(op2);
    expect(c1.controller.tree.value()).toBe('mr');
    expect(c2.controller.tree.value()).toBe('mr');
    
    const op5 = c2.handleEditorChange(createChangeObject(OpType.Delete, 'm', 0));
    c1.handleRemoteOp(op5);
    // expectedStr = expectedStr.slice(1);
    expect(c1.controller.tree.value()).toBe("r");
    expect(c2.controller.tree.value()).toBe("r");

    const op6 = c2.handleEditorChange(createChangeObject(OpType.Insert, 'k', 0));
    c1.handleRemoteOp(op6);
    expect(c1.controller.tree.value()).toBe("kr");
    expect(c2.controller.tree.value()).toBe("kr");
});

test("Ultimate Stress Test", async () => {
    const clients = [];
    const n = 5
    for (let i = 0; i < n; i++) {
        clients.push(await Client.makeClient(false));
    }

    for (let i = 0; i < 1; i++) {
        const ops = [];
        for (let j = 0; j < 20; j++) {
            console.log("---------------New Iteration-------------");
            let opType = null;
            let pos = null;
            let char = null;

            const ci = Math.floor(Math.random() * n);
            const c = clients[ci];
            const currentStr = c.controller.tree.value();

            if (Math.random() < 0.3 && currentStr.length > 0) {
                opType = OpType.Delete;
                pos = Math.floor(Math.random() * currentStr.length);
                char = currentStr[pos];
            } else {
                opType = OpType.Insert;
                pos = Math.floor(Math.random() * (currentStr.length + 1));
                char = getRandomCharacter();
            }
            
            const ch = createChangeObject(opType, char, pos);
            console.log("Adding change to primary");
            const op = c.handleEditorChange(ch);
            ops.push(op);

            for (let k = 0; k < n; k++) {
                if (ci != k && Math.random() < 0.3) {
                    console.log("Adding change to random secondary");
                    clients[k].handleRemoteOp(op);
                }
            }
        }
        for (let op of ops) {
            for (let c of clients) {
                c.handleRemoteOp(op);
            }
        }

        const firstClientVal = clients[0].controller.tree.value();
        for (let c of clients) {
            expect(c.controller.tree.value()).toBe(firstClientVal);
        }
    }

});
