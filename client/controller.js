import { WChar, CRDTOp } from "./utils";

export class Controller {
    constructor() {
        this.tree = null;
    }
    /**
     * Triggered when the client inserts a character in the document. Inserts this character at the specified position
     * in the tree and returns a CRDT w-character which will be broadcasted to other clients.
     * @param {string} c the character to insert
     * @param {number} pos position of c in the document (of visible characters)
     * @returns {WChar} CRDT W-character for this insertion
     */
    generateInsert(c, pos) {

    }

    /**
     * Triggered when the client deletes a character in the document. Makes this character invisible in the tree
     * and returns a CRDT object which will be broadcasted to other clients.
     * @param {string} c the character to delete
     * @param {number} pos position of the character in the document to be deleted
     * @returns {WChar} CRDT W-character for this deletion
     */
    generateDelete(c, pos) {

    }

    /**
     * Handles insert operation from remote peer. Checks if the operation is executable before integrating
     * @param {WChar} wchar
     */
    ins(wChar) {

    }

    /**
     * Handles delete operation from remote peer. Checks if the operation is executable before integrating
     * @param {WChar} wChar 
     */
    del(wChar) {

    }

    /**
     * Checks if the pre-conditions of the operations have been satisfied
     * @param {CRDTOp} op the CRDT operation to check 
     */
    isExecutable(op) {

    }
    
    /**
     * Called by the messenger when it receives a insert request from a peer. Integrates the character in tree
     * updates the document UI accordingly.
     * @param {WChar} wchar 
     * @param {WChar} wchar_prev 
     * @param {WChar} wchar_next 
     */
    integrateInsert(wchar, wchar_prev, wchar_next) {

    }

    /**
     * Called by the messenger when it receives a delete request from a peer. Integrates the character in tree
     * updates the document UI accordingly.
     * @param {WChar} wChar 
     */ 
    integrateDelete(wChar) {

    }
}