import { WChar, CRDTOp, WId, OpType } from "./utils.js";
import { Tree } from "./tree.js";

// const { WChar, CRDTOp, WId, OpType } = require("./utils.js");
// const { Tree } = require("./tree.js");

export class Controller {
    constructor(siteId) {
        this.tree = new Tree();
        this.tick = -1;
        this.siteId = siteId;
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
        const cp = this.tree.ithVisible(pos-1);
        const cn = this.tree.ithVisible(pos);
        const wid = new WId(this.siteId, this.tick);
        let cp_id = null;
        if (cp != null) {
            cp_id = cp.id;
        }
        let cn_id = null;
        if (cn != null) {
            cn_id = cn.id;
        }
        const wChar = new WChar(wid, c, true, cp_id, cn_id);
        
        this.integrateInsert(wChar, cp_id, cn_id);
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
        op = CRDTOp.fromObject(op);
        if (this.isExecutable(op)) {
            this.integrateInsert(op.wChar, op.wChar.idPrev, op.wChar.idNew);
        } else {
            this.bufferPool.push(op);
        }
        
    }

    /**
     * Handles delete operation from remote peer. Checks if the operation is executable before integrating
     * @param {CRDTOp} op 
     */
    del(op) {
        op = CRDTOp.fromObject(op);
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
        if (op.opType == OpType.Delete) {
            return this.tree.contains(op.wChar);
        } else {
            return (op.wChar.idPrev === null || this.tree.contains(this.tree.find(op.wChar.idPrev)))
                    && (op.wChar.idPrev === null || this.tree.contains(this.tree.find(op.wChar.idNew)));
        }
    }
    
    /**
     * Called by the messenger when it receives a insert request from a peer. Integrates the character in tree
     * updates the document UI accordingly.
     * @param {WChar} wchar 
     * @param {WChar} wchar_prev 
     * @param {WChar} wchar_next 
     */
    integrateInsert(wchar, wchar_prev_id, wchar_next_id) {

        // find sequence 
        // insert at next position 
        let wchar_prev = null;
        let wchar_next = null;
        if (wchar_prev_id != null) {
            wchar_prev = this.tree.find(wchar_prev_id);
        }
        if (wchar_next_id != null) {
            wchar_next = this.tree.find(wchar_next_id);
        }

        const sequence = this.tree;
        const subseq = sequence.subseq(wchar_prev, wchar_next);
        // console.log("sub", subseq);
        // If wchar is in between prev and next, subseq should have 0 length.
        if (subseq.length == 0) {
            const posi = this.tree.pos(wchar_next, false);
            return sequence.insert(wchar, posi);
        } else {
            let L = [];
            L.push(wchar_prev);
            const c_p_pos = this.tree.pos(wchar_prev, false);
            const c_n_pos = this.tree.pos(wchar_next, false);
            for (let wc of subseq) {
                // TODO: ???
                if(wc.idPrev == null || wc.idNew == null) {
                    L.push(wc);
                    continue;
                }
                let dPrevPos = this.tree.pos(this.tree.find(wc.idPrev), false);
                let dNextPos = this.tree.pos(this.tree.find(wc.idNew), false);
                if (dPrevPos <= c_p_pos && c_n_pos <= dNextPos) {
                    L.push(wc);
                }
            }
            L.push(wchar_next);
            let i = 1;
            // TODO: ADD IN CLOCKS check if site is same then clock for 1 has to be less than 2
            while (i < L.length - 1 && (L[i].id.isLessThan(wchar.id))){ 
                i += 1;
            }
            let newPrev = null;
            let newNext = null;
            if (L[i-1] != null) {
                newPrev = L[i-1].id;
            }
            if (L[i] != null) {
                newNext = L[i].id;
            }
            return this.integrateInsert(wchar, newPrev, newNext);
        }
    }

    /**
     * Called by the messenger when it receives a delete request from a peer. Integrates the character in tree
     * updates the document UI accordingly.
     * @param {WChar} wChar 
     */ 
    integrateDelete(wChar) {
        // set visible char to false 
        const p = this.tree.pos(wChar);
        const delSucceed = this.tree.delete(p);
        console.log("delSucceed:", delSucceed);
        console.log("wChar:", wChar);
        // console.log("Wchar id in integratedel", this.tree.find(wChar.id));
        // this.tree.find(wChar.id).visible = false;
        // console.log("Wchar id in integratedel after invisible", this.tree.find(wChar.id));
        
        //wChar.visible = false // might have to do something more complicated 


    }
}

// module.exports = {
//     Controller: Controller
// }