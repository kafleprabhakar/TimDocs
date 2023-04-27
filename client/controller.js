export class Controller {
    constructor() {
        this.tree = null;
    }

    // Triggered when the client inserts a character in the document. Inserts this character in the tree
    // and returns a CRDT object which will be broadcasted to other clients.
    generateInsert(c) {

    }

    // Triggered when the client deletes a character in the document. Makes this character invisible in the tree
    // and returns a CRDT object which will be broadcasted to other clients.
    generateDelete(c) {

    }

    // Called by the messenger when it receives a insert request from a peer. Integrates the character in tree
    // updates the document UI accordingly.
    integrateInsert(c) {

    }

    // Called by the messenger when it receives a delete request from a peer. Integrates the character in tree
    // updates the document UI accordingly.
    integrateDelete(c) {

    }
}