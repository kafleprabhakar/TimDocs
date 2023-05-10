import { Tree, TreeNode } from "./tree.js";

// Unique identifier for WChar, as defined in WOOT paper
export class WId {
    /**
     * 
     * @param {string} numSite 
     * @param {int} numTick 
     */
    constructor (numSite, numTick) {
        this.numSite = numSite;
        this.numTick = numTick;
    }

    static fromObject(obj) {
        if (obj == null) {
            return null;
        }
        const wid = new WId();
        wid.numSite = obj.numSite;
        wid.numTick = obj.numTick;
        return wid;
    }

    /**
     * 
     * @param {WId} wId 
     * @returns 
     */
    isEqual(wId) {

        return this.numSite === wId.numSite && this.numTick === wId.numTick;
    }

    /**
     * 
     * @param {WId} wId 
     */
    isLessThan(wId) {
        const siteCompare = this.numSite.toString().localeCompare(wId.numSite);
        return (siteCompare === -1) || (siteCompare === 0 && this.numTick < wId.numTick);
    }
}

// WChar type, as defined in WOOT paper
export class WChar {
    /**
     * 
     * @param {WId} id 
     * @param {string} c 
     * @param {boolean} visible 
     * @param {WId} idPrev 
     * @param {WId} idNew 
     */
    constructor(id, c, visible, idPrev, idNew) {
        this.id = id;
        this.c = c;
        this.visible = visible;
        this.idPrev = idPrev;
        this.idNew = idNew;
    }

    static fromObject(obj) {
        if (obj == null) {
            return null;
        }
        const wc = new WChar();
        wc.id = WId.fromObject(obj.id);
        wc.c = obj.c;
        wc.visible = obj.visible;
        wc.idPrev = WId.fromObject(obj.idPrev);
        wc.idNew = WId.fromObject(obj.idNew);
        return wc;
    }

    // Returns the message of this CRDT Operation to be sent to peers
    toMessage() {
        return {

        }
    }
}

export const OpType = {
    Insert: "+input",
    Delete: "+delete",
    GetDoc: "getDoc",
    SendDoc: "sendDoc",
    Ack: "acknowledge",
    Heartbeat: "heartbeat"
}

export class CRDTOp {
    /**
     * 
     * @param {OpType} opType 
     * @param {WChar} wChar 
     * @param {TreeNode} tree 
     */
    constructor(opType, wChar, tree = null) {
        this.opType = opType;
        this.wChar = wChar;
        this.tree = tree;
    }

    static fromObject(obj) {
        const op = new CRDTOp();
        // Object.assign(op,obj);
        op.opType = obj.opType;
        op.wChar = WChar.fromObject(obj.wChar);
        op.tree = Tree.fromObject(obj.tree);
        return op;
    }
}

// module.exports = {
//     WId: WId,
//     WChar: WChar,
//     OpType: OpType,
//     CRDTOp: CRDTOp
// }