import { Messenger } from "./messenger.js";
import { Controller } from "./controller.js";

export class Client {
    constructor(hasEditor) {
        this.controller = new Controller();
        
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
        this.messenger = new Messenger(jsonData.me, jsonData.peers);
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
        // Call broadcast function in messenger to broadcast above CRDT operation `op`
    }
}