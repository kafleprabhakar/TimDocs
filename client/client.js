import { Messenger } from "./messenger.js";
import { Controller } from "./controller.js";
import { OpType, CRDTOp, WId, WChar } from "./utils.js";
import { Tree } from "./tree.js";

export class Client {
    constructor(hasEditor, id, name, peers) {
        this.controller = new Controller(id); 
        this.messenger = new Messenger(id, name, peers, this.handleRemoteMessage, this.updatePeersUI);
        this.buffer = []
        // Initialize Editor
        this.hasEditor = hasEditor; // Will be useful if we decide to store everything in the server later on
        this.cursorPosition = 0;
        this.peerCursors = {}
        if (hasEditor) 
            this.initEditor();
        else
            this.editor = null;
        this.mapHeartbeats = {};
    }

    initEditor() {
        const editor = document.getElementById("editor");
        this.editor = CodeMirror.fromTextArea(editor, {
            mode: "xml",
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

    destroy = () => {
        this.messenger.destroy();
    }

    bindKeyboardActions() {
        
        this.editor.on('change', (editor,obj) => this.handleEditorChange(obj));
        
        this.editor.on('cursorActivity', (editor) => {
            console.log("Cursor: ", editor.getCursor());
            this.cursorPosition = editor.getCursor().ch; // Assuming single line for the time being
            const op = new CRDTOp(OpType.CursorPos, null, null, {'line': editor.getCursor().line, 'ch': editor.getCursor().ch});
            this.messenger.broadcast(op);
            // console.log("Selection: ", editor.getSelection());
        });

        this.editor.on("beforeChange", function(instance, change) {
            var newtext = change.text.join("").replace(/\n/g, " "); // remove ALL \n !
            change.update(change.from, change.to, [newtext]);
            console.log("Changed text to not have newline");
            return true;
        });
    }

    /**
     * Adds the character c to the document tree and broadcasts to other peers
     * @param {Object} change 
     * @returns {CRDTOp[]} lest of CRDT operations performed on the tree
     */
    handleEditorChange(change) {
        console.log("Change: ", change);
        let ops = [];
        if (change.origin !== OpType.Insert && change.origin !== OpType.Delete && change.origin !== OpType.Paste)
            return ops;
        const start = change.from.ch;
        for (let i = 0; i < change.removed[0].length; i++) {
            ops.push(this.controller.generateDelete(start));
        }
        for (let i = 0; i < change.text[0].length; i++) {
            ops.push(this.controller.generateInsert(change.text[0][i], start + i));
        }
        this.controller.tree.versionNumber += 1;
        for (let op of ops) {
            this.messenger.broadcast(op);
        }
        // Call broadcast function in messenger to broadcast above CRDT operation `op`
        return ops; // For the test function
    }


    /**
     * 
     * Checks preconditions of operations before executing them (concurrency)
     * @param {CRDTOp} op 
     */
    isExecutable = (op) => {
        let c = op.wChar
        
        if (op.opType === OpType.Delete){
            return this.controller.tree.contains(c.id)
        } else if (op.opType === OpType.Insert) { 
            // console.log("id prev", op); 
            return this.controller.tree.contains(c.idPrev) && 
            this.controller.tree.contains(c.idNew)
        } else {
            return true;
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

    resetCursor = () => {
        this.editor.setCursor({'line': 0, 'ch': this.cursorPosition});
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
                    let changeCursorPos = 0;
                    if (op.opType === OpType.Insert) {
                        const pos = this.controller.ins(op);
                        this.controller.tree.versionNumber+=1;
                        if (this.hasEditor)
                            this.editor.replaceRange(op.wChar.c, {'line': 0, 'ch': pos}, {'line': 0, 'ch': pos});
                        if (pos <= this.cursorPosition)
                            changeCursorPos = 1;
                    } else if (op.opType === OpType.Delete) {
                        const pos = this.controller.del(op);
                        this.controller.tree.versionNumber+=1;
                        if (this.hasEditor)
                            this.editor.replaceRange('', {'line': 0, 'ch': pos}, {'line': 0, 'ch': pos + 1});
                        if (pos <= this.cursorPosition)
                            changeCursorPos = -1;
                    }
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
        this.messenger.sendAck(peer, ackOp);
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
        } else if (op.opType == OpType.CursorPos) {
            console.log("Remote Cursor pos: ", op);
            if (peer in this.peerCursors) {
                this.peerCursors[peer].clear();
            }
            const cursorNode = document.getElementById('cursor-template').content.cloneNode(true);
            console.log("cursorNode:", cursorNode.className);
            // cursorNode.style['background'] = this.messenger.connections[peer].color;
            this.peerCursors[peer] = this.editor.setBookmark(op.cursorPos, {'widget': cursorNode});
            this.peerCursors[peer].widgetNode.style['background'] = this.messenger.connections[peer].color;
            console.log("Peer cursor: ", this.peerCursors[peer]);
        } else if (op.opType == OpType.Insert || op.opType == OpType.Delete) {
            this.handleRemoteOp(op);
        }
    }

    updatePeersUI = () => {
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
