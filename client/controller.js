// import { WChar, CRDTOp, WId, OpType } from "./utils.js";
// import { Tree } from "./tree.js";

const { WChar, CRDTOp, WId, OpType } = require("./utils.js");
const { Tree } = require("./tree.js");

class Controller {
    constructor(siteId) {
        this.tree = new Tree();
        this.tick = 0;
        this.sideId = siteId;
        this.bufferPool = [];
    }
    /**
     * Triggered when the client inserts a character in the document. Inserts this character at the specified position
     * in the tree and returns a CRDT w-character which will be broadcasted to other clients.
     * @param {string} c the character to insert
     * @param {number} pos position of c in the document (of visible characters)
     * @returns {CRDTOp} CRDT Operation for this insertion
     */
    generateInsert(c, pos) {
        this.tick += 1;
        const cp = this.tree.ithVisible(pos);
        const cn = this.tree.ithVisible(pos + 1);
        const wid = new WId(this.siteId, this.tick);
        let cp_id = null;
        if (cp != undefined) {
            cp_id = cp.id;
        }
        let cn_id = null;
        if (cp != undefined) {
            cn_id = cn.id;
        }
        const wChar = new WChar(wid, c, true, cp_id, cn_id);
        this.integrateInsert(wChar);
        return new CRDTOp(OpType.Insert, wChar);
    }

    /**
     * Triggered when the client deletes a character in the document. Makes this character invisible in the tree
     * and returns a CRDT object which will be broadcasted to other clients.
     * @param {number} pos position of the character in the document to be deleted
     * @returns {CRDTOp} CRDT Operation for this deletion
     */
    generateDelete(pos) {
        const wChar = this.tree.ithVisible(pos);
        this.integrateDelete(wChar);
        return new CRDTOp(OpType.Delete, wChar);
    }

    /**
     * Handles insert operation from remote peer. Checks if the operation is executable before integrating
     * @param {CRDTOp} op
     */
    ins(op) {
        if (this.isExecutable(op)) {
            this.integrateInsert(op.wChar, this.tree.CP(op.wChar), this.tree.CN(op.wChar));
        } else {
            this.bufferPool.push(op);
        }
    }

    /**
     * Handles delete operation from remote peer. Checks if the operation is executable before integrating
     * @param {CRDTOp} op 
     */
    del(op) {
        if (this.isExecutable(op)) {
            this.integrateDelete(op.wChar);
        } else {
            this.bufferPool.push(op);
        }
    }

    /**
     * Checks if the pre-conditions of the operations have been satisfied
     * @param {CRDTOp} op the CRDT operation to check 
     */
    isExecutable(op) {
        if (op.opType == OpType.Insert) {
            return this.tree.contains(op.wChar);
        } else {
            return this.tree.contains(this.tree.CP(op.wChar)) && this.tree.contains(this.tree.CN(op.wChar));
        }
    }
    
    /**
     * Called by the messenger when it receives a insert request from a peer. Integrates the character in tree
     * updates the document UI accordingly.
     * @param {WChar} wchar 
     * @param {WChar} wchar_prev 
     * @param {WChar} wchar_next 
     */
    integrateInsert(wchar, wchar_prev, wchar_next) {

        // find sequence 
        // insert at next position 
        
        sequence = this.tree 
        subseq = sequence.subseq(wchar_prev, wchar_next) 
        if (length(subseq)===0) { 
            return sequence.insertBasic(w_char, this.tree.pos(wchar_next))
        } else {
            let L  = subseq
            let i = 1 
            // TODO: ADD IN CLOCKS check if site is same then clock for 1 has to be less than 2
            while (i < length(L) -1 && (L[i].siteId<=wchar.siteId)){ 
                i+=1
            }
            return this.integrateInsert(wchar, L[i-1],L[i])
        }
    }

    /**
     * Called by the messenger when it receives a delete request from a peer. Integrates the character in tree
     * updates the document UI accordingly.
     * @param {WChar} wChar 
     */ 
    integrateDelete(wChar) {
        // set visible char to false 
        this.wChar.visible = false // might have to do something more complicated 


    }
}

module.exports = {
    Controller: Controller
}