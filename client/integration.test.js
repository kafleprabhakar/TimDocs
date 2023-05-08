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
    sleep(100); // Let clients initialize
    
    const op = c1.handleEditorChange(createChangeObject(OpType.Insert, 'a', 0));
    c2.handleRemoteOp(op);
    expect(c1.controller.tree.value()).toBe('a');
    expect(c2.controller.tree.value()).toBe('a');

    const op2 = c2.handleEditorChange(createChangeObject(OpType.Insert, 'b', 0));
    c1.handleRemoteOp(op2);
    expect(c1.controller.tree.value()).toBe('ba');
    expect(c2.controller.tree.value()).toBe('ba');

    // const op = testController.generateInsert('A', 0);
    // const expectedWChar = new WChar(new WId(1, 0), 'A', true, null, null);
    // const expectedOp = new CRDTOp(OpType.Insert, expectedWChar);

    // console.log(op);

    // expect(op).toEqual(expectedOp);
    // expect(testController.tree.value()).toBe('A');
});