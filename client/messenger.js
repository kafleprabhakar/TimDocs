import { Controller } from './controller.js';
import { WId, WChar, CRDTOp, OpType } from './utils.js';

// const {CRDTOp, OpType} = require('./utils.js');

export class Messenger {
    /**
     * 
     * @param {string} id 
     * @param {string[]} peers 
     * @param {Controller} controller 
     */
    constructor(id, peers, handleFunc) {
        this.me = new Peer(id);
        this.connections = {}
        this.me.on("open", (id) => {
            this.listenForConnection()

            for (let i = 0; i < peers.length; i++) {
                this.establishConnection(peers[i])
            }
        });
        this.handleFunc = handleFunc;
    }

    establishConnection(peer) {
        var conn = this.me.connect(peer);
        conn.on("open", () => {
            this.connections[peer] = conn;
            console.log("Connected to peer", peer);
            // Send messages
            // conn.send("Hello!"); // heartbeat 
            conn.on("data", this.listenForData);

        });
    } 

    listenForConnection() {
        this.me.on("connection", (conn) => {
            this.connections[conn.peer] = conn;
            conn.on("data", this.listenForData);
            conn.on("close", () => {
                console.log("Closed connection with peer", conn.peer);
            })
        });
    }

    /**
     * 
     * @param {CRDTOp} data 
     */
    listenForData = (data) => {
        console.log('Received data', data);
        console.log('Received data optype', data.opType);
        console.log("Messenger", this);

        const wid = new WId(data.wChar.id.numSite, data.wChar.id.numTick);
        let idPrev = null;
        let idNext = null;
        if (data.wChar.idPrev != null)
            idPrev = new WId(data.wChar.idPrev.numSite, data.wChar.idPrev.numTick);

        if (data.wChar.idNew != null)
            idNext = new WId(data.wChar.idNew.numSite, data.wChar.idNew.numTick);
        let wChar = new WChar(wid, data.wChar.c, data.wChar.visible, idPrev, idNext);
        let crdtOp = new CRDTOp(data.opType, wChar);

        if (crdtOp.opType == OpType.Insert || crdtOp.opType == OpType.Delete) {
            this.handleFunc(crdtOp);
        }
    }

    removePeer(peer) {
        delete this.connections[peer];
    }

    broadcast(data) {
        for (let key in this.connections) {
            if (key!=this.me) {
                console.log("am i getting hit here?");
                this.connections[key].send(data);
            }
        } 
        
    }

    heartbeat() { 
        for (let key in this.connections) {
            if (key!=this.me) {
                this.connections[key].send("heartbeat", "");
                this.connections[key].on("received heartbeat")
            }
        }  

    }
}