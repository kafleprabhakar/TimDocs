// Unique identifier for WChar, as defined in WOOT paper
class WId {
    /**
     * 
     * @param {int} numSite 
     * @param {int} numTick 
     */
    constructor (numSite, numTick) {
        this.numSite = numSite;
        this.numTick = numTick;
    }
}

// WChar type, as defined in WOOT paper
class WChar {
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

const OpType = {
    Insert: "+insert",
    Delete: "+delete"
}

class CRDTOp {
    /**
     * 
     * @param {OpType} opType 
     * @param {WChar} wChar 
     */
    constructor(opType, wChar) {

    }
}

module.exports = {
    WId: WId,
    WChar: WChar,
    OpType: OpType,
    CRDTOp: CRDTOp
}