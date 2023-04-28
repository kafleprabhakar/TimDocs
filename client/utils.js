// Placeholder for tree node. Will be replaced when Grace makes the tree structure
export class WChar {
    constructor() {
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