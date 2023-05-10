import { Messenger } from "./messenger.js";
import { Controller } from "./controller.js";
import { OpType, CRDTOp, WId, WChar } from "./utils.js";

// const { Messenger } = require("./messenger.js");
// const { Controller } = require("./controller.js");

export class Client {
    constructor(hasEditor, id, peers) {
        this.controller = new Controller(id); 
        this.messenger = new Messenger(id, peers, this.handleRemoteOp);
        this.buffer = []
        // Initialize Editor
        this.hasEditor = hasEditor; // Will be useful if we decide to store everything in the server later on
        this.cursorPosition = 0;
        if (hasEditor) 
            this.initEditor()
        else
            this.editor = null;
        //this.vectorclocks = []; 
        
    }

    initEditor() {
        const editor = document.getElementById("editor");
        /*
        let startState = EditorState.create({
            doc: "text here", 
            extensions: [keymap.of(defaultKeymap)]
        })
        this.editor = EditorView({
            state: startState,
            parent: document.body
        })
        */
        this.editor = CodeMirror.fromTextArea(editor, {
            mode: "xml",
            theme: "dracula",
            lineNumbers: false
        });
        this.bindKeyboardActions();
    }

    /**
     * 
     * @param {boolean} hasEditor 
     */
    static async makeClient(hasEditor) {
        const response = await fetch("http://localhost:1800");
        const jsonData = await response.json();
        return new Client(hasEditor, jsonData.me, jsonData.peers);
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
        // console.log("Change:", change);
        let op = null;
        if (change.origin == "+input") {
            op = this.controller.generateInsert(change.text[0], change.from.ch);
        } else if (change.origin == "+delete") { // This could be a paste too. But for the time being only handling insert and delete
            op = this.controller.generateDelete(this.cursorPosition);
        }
        // send vector clock 
        this.messenger.broadcast(op);
        // Call broadcast function in messenger to broadcast above CRDT operation `op`
        return op; // For the test function
    }


    /**
     * 
     * Checks preconditions of operations before executing them (concurrency)
     * @param {CRDTOp} op 
     */
    isExecutable = (op) => {
        let c = op.wChar
        if (op.opType === OpType.Delete){
            return this.controller.tree.contains(c)
        } else {
            return this.controller.tree.contains(this.controller.tree.find(c.idPrev)) && 
            this.controller.tree.contains(this.controller.tree.find(c.idNew))
        }
    }


     /**
     * 
     * Add to "buffer pool"
     * @param {CRDTOp} op 
     */
    addBuffer = (op) => {
        this.buffer.push(op);
    }

    /**
     * Handles insert/delete operation from remote peer. Checks if the operation is executable before integrating
     * @param {CRDTOp} op
     */
    handleRemoteOp = (op) => {

        this.addBuffer(op);

        while(this.buffer.length!=0){
            let thisop = op;
            if (this.isExecutable(this.buffer.pop())){
                thisop = op;
            }

            if (op.opType === OpType.Insert) {
                this.controller.ins(op); 
                //let text = op.wChar.c; 
                
                //let transaction = view.state.update({changes: {from: id, insert: text}})
                //console.log(transaction.state.doc.toString()) // "0123"
                // At this point the view still shows the old state.
                //view.dispatch(transaction)
                // apply this text 
                // create a buffer of incoming and ticks 
                // create counts of client's ticks that it's received 
            } else if (op.opType === OpType.Delete) {
                this.controller.del(op);
            }
            let id = op.wChar.id;
                //console.log("text", text);
                //let text = this.editor.getValue();
                // edit the text, for example  
                // set the text back to the editor
            if (this.hasEditor)
                this.editor.setValue(this.controller.tree.value());
        }
        }
        
        
}
