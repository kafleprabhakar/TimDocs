import { Messenger } from "./messenger.js";

export class Client {
    constructor(hasEditor) {
        this.messenger = null;
        this.initClient();
        // Initialize editor
        this.hasEditor = true; // Will be useful if we decide to store everything in the server later on
        if (hasEditor) {
            this.editor = CodeMirror.fromTextArea(editor, {
                mode: "xml",
                theme: "dracula",
                lineNumbers: false
            });
            this.bindKeyboardActions();
        } else
            this.editor = null;
    }

    async initClient() {
        const response = await fetch("http://localhost:1800");
        const jsonData = await response.json();
        console.log(jsonData);
        document.getElementById('dummy-p').innerHTML = JSON.stringify(jsonData);
        this.messenger = new Messenger(jsonData.me, jsonData.peers);
    }

    bindKeyboardActions() {
        this.editor.on("keyHandled", (cmd,key,e) => {
            console.log("keyhandled", key);
        });
        
        this.editor.on('change', (editor,obj) => {
            console.log("hiii", obj.text);
        });
        
        this.editor.on('cursorActivity', (editor) => {
            console.log("Cursor: ", editor.getCursor());
            console.log("Selection: ", editor.getSelection());
        });
    }
}