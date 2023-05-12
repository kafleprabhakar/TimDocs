import { Messenger } from "./messenger.js";
import { Controller } from "./controller.js";
import { OpType, CRDTOp, WId, WChar } from "./utils.js";
import { Tree } from "./tree.js";

// const { Messenger } = require("./messenger.js");
// const { Controller } = require("./controller.js");

export class Client {
    constructor(hasEditor, id, name, peers) {
        this.controller = new Controller(id); 
        this.messenger = new Messenger(id, name, peers, this.handleRemoteMessage, this.listenToConnections);
        this.buffer = []
        // Initialize Editor
        this.hasEditor = hasEditor; // Will be useful if we decide to store everything in the server later on
        this.cursorPosition = 0;
        if (hasEditor) 
            this.initEditor()
        else
            this.editor = null;
        this.mapHeartbeats = {};  

        
        
    }

    initEditor() {
        const editor = document.getElementById("editor");
        this.editor = CodeMirror.fromTextArea(editor, {
            mode: "xml",
            theme: "dracula",
            lineNumbers: false,
            lineWrapping: true,
        });
        this.bindKeyboardActions();
    }

    /**
     * 
     * @param {boolean} hasEditor 
     */
    static async makeClient(hasEditor) {
        let name = 'A';
        if (hasEditor) 
            name = prompt("Your name", "Anonymous");
        const response = await fetch("http://" + window.location.hostname + ":1800/?name="+name);
        const jsonData = await response.json();
        return new Client(hasEditor, jsonData.me, name, jsonData.peers);
    } 

    bindKeyboardActions() {
        
        this.editor.on('change', (editor,obj) => this.handleEditorChange(obj));
        
        this.editor.on('cursorActivity', (editor) => {
            // console.log("Cursor: ", editor.getCursor());
            this.cursorPosition = editor.getCursor().ch; // Assuming single line for the time being
            // console.log("Selection: ", editor.getSelection());
        });
    }

    // Adds the character c to the document tree and broadcasts to other peers
    handleEditorChange(change) {
        let op = null;
        if (change.origin == "+input") {
            op = this.controller.generateInsert(change.text[0], change.from.ch);
            this.controller.tree.versionNumber+=1;
        } else if (change.origin == "+delete") { // This could be a paste too. But for the time being only handling insert and delete
            op = this.controller.generateDelete(change.from.ch);
            this.controller.tree.versionNumber+=1;
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
        } else if (op.opType === OpType.Insert) { 
            // console.log("id prev", op); 
            return this.controller.tree.contains(this.controller.tree.find(c.idPrev)) && 
            this.controller.tree.contains(this.controller.tree.find(c.idNew))
        } else {
            return true
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

        let appliedOp = true;
        while (appliedOp) {
            appliedOp = false;
            const bufferCopy = []
            for (let op of this.buffer) {
                if (this.isExecutable(op)) {
                    if (op.opType === OpType.Insert) {
                        this.controller.ins(op); 
                        this.controller.tree.versionNumber+=1;
                    } else if (op.opType === OpType.Delete) {
                        this.controller.del(op);
                        this.controller.tree.versionNumber+=1;
                    } 
                    if (this.hasEditor) 
                        this.editor.setValue(this.controller.tree.value());
                    appliedOp = true;
                } else {
                    // put back in buffer pool
                    bufferCopy.push(op);
                }
            }
            this.buffer = bufferCopy;
        }
         
    }

    handleTreeRequest = (peer) => {
        const sendOp = new CRDTOp(OpType.SendDoc, null, this.controller.tree);
        this.messenger.sendTree(peer, sendOp);
    }
    
    handleHeartbeat = (peer) => {
        // console.log("handle heartbeat");
        const ackOp = new CRDTOp(OpType.Ack, null, this.controller.tree);
        this.messenger.sendAck(ackOp);  

    }

    handleAck = (peer, versionNum) => {
        // console.log("handle ack") 
        //this.connections[peer].conn.on("error");
        //this.connections[peer].conn.send(ackOp)
        this.messenger.mapHeartbeats[peer] = 0; 
        // check version number here
        // if version from peer is less my version number 
        if (versionNum < this.controller.versionNum) {
            this.handleTreeRequest(peer); // send your tree over 
        }
    }
    

    integrateTree = (op) => {
        this.controller.tree = Tree.fromObject(op.tree);
        if (this.hasEditor)
            this.editor.setValue(this.controller.tree.value());
    }
        
    handleRemoteMessage = (peer, msg) => {
        const op = CRDTOp.fromObject(msg);
        if (op.opType == OpType.Heartbeat) {
            this.handleHeartbeat(peer);
        } else if (op.opType == OpType.Ack) { 
            
            this.handleAck(peer, op.tree.versionNumber); 
        } else if (op.opType == OpType.GetDoc) {
            this.handleTreeRequest(peer);
        } else if (op.opType == OpType.SendDoc) {
            this.integrateTree(op);
        } else if (op.opType == OpType.Insert || op.opType == OpType.Delete) {
            this.handleRemoteOp(op);
        }
    }

    listenToConnections = () => {
        // console.log("Got signal for new client joining");
        if (this.hasEditor) {
            const peers = document.getElementById('peer-list');
            const peerTemplate = document.getElementById('peer-item-template');
            peers.innerHTML = "";
            peers.appendChild(peerTemplate);
            for (let peer in this.messenger.connections) {
                const thisPeer = peerTemplate.content.cloneNode(true);
                thisPeer.querySelector(".user-name").innerHTML = this.messenger.connections[peer].name;
                thisPeer.querySelector(".user-icon").style["background-color"] = this.messenger.connections[peer].color;
                peers.appendChild(thisPeer);
            }
        }
    }
}
