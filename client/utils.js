// Unique identifier for WChar
export class WId {
    constructor (numSite, numTick) {
        this.numSite = numSite;
        this.numTick = numTick;
    }
}

// WChar type, as defined in WOOT paper
export class WChar {
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

export class CRDTOp {
    /**
     * 
     * @param {OpType} opType 
     * @param {WChar} wChar 
     */
    constructor(opType, wChar) {

    }
}