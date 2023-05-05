import { Messenger } from "./messenger.js";
import { Controller } from "./controller.js";
import { OpType } from "./utils.js";

// const { Messenger } = require("./messenger.js");
// const { Controller } = require("./controller.js");

export class Client {
    constructor(hasEditor) {
        //this.controller = new Controller();
        
        // Initialize Messenger
        this.messenger = null;
        this.initMessenger();

        // Initialize Editor
        this.hasEditor = hasEditor; // Will be useful if we decide to store everything in the server later on
        this.cursorPosition = 0;
        if (hasEditor) 
            this.initEditor()
        else
            this.editor = null;
    }

    async initMessenger() {
        const response = await fetch("http://localhost:1800");
        const jsonData = await response.json();
        console.log(jsonData);
        document.getElementById('dummy-p').innerHTML = JSON.stringify(jsonData);
        this.controller = new Controller(jsonData.me); 
        this.messenger = new Messenger(jsonData.me, jsonData.peers, this.handleRemoteOp);
    }

    initEditor() {
        const editor = document.getElementById("editor");
        this.editor = CodeMirror.fromTextArea(editor, {
            mode: "xml",
            theme: "dracula",
            lineNumbers: false
        });
        this.bindKeyboardActions();
    }

    bindKeyboardActions() {
        this.editor.on("keyHandled", (cmd,key,e) => {
            console.log("keyhandled", key);
        });
        
        this.editor.on('change', (editor,obj) => this.handleEditorChange(obj));
        
        this.editor.on('cursorActivity', (editor) => {
            console.log("Cursor: ", editor.getCursor());
            this.cursorPosition = editor.getCursor().ch; // Assuming single line for the time being
            console.log("Selection: ", editor.getSelection());
        });
    }

    // Adds the character c to the document tree and broadcasts to other peers
    handleEditorChange(change) {
        console.log("Change:", change);
        let op = null;
        if (change.origin == "+input") {
            op = this.controller.generateInsert(change.text[0], change.from.ch);
        } else if (change.origin == "+delete") { // This could be a paste too. But for the time being only handling insert and delete
            op = this.controller.generateDelete(this.cursorPosition);
        } 
        // send vector clock 
        this.messenger.broadcast(op);
        // Call broadcast function in messenger to broadcast above CRDT operation `op`
    }


    /**
     * Handles insert/delete operation from remote peer. Checks if the operation is executable before integrating
     * @param {CRDTOp} op
     */
    handleRemoteOp = (op) => {
        if (op.opType === OpType.Insert) {
            this.controller.ins(op);
        } else if (op.opType === OpType.Delete) {
            this.controller.del(op);
        }
    }
}
