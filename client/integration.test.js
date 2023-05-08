import { Client } from "./client.js";
import { OpType } from "./utils.js";

function createTestClient() {

}

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
});
