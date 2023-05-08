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

    // Returns the message of this CRDT Operation to be sent to peers
    toMessage() {
        return {

        }
    }
}

export const OpType = {
    Insert: "+input",
    Delete: "+delete"
}

export class CRDTOp {
    /**
     * 
     * @param {OpType} opType 
     * @param {WChar} wChar 
     */
    constructor(opType, wChar) {
        this.opType = opType;
        this.wChar = wChar;
    }

    static fromObject(obj) {
        const op = new CRDTOp();
        Object.assign(op,obj);
        return op;
    }
}

// module.exports = {
//     WId: WId,
//     WChar: WChar,
//     OpType: OpType,
//     CRDTOp: CRDTOp
// }