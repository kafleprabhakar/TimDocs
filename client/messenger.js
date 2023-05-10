import { Controller } from './controller.js';
import { WId, WChar, CRDTOp, OpType } from './utils.js';

function getRandomColor() {
    const colors = ['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', 
                    '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe',
                    '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000',
                    '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080']
    return colors[Math.floor(Math.random() * colors.length)];
}
// const {CRDTOp, OpType} = require('./utils.js');

export class Messenger {
    /**
     * 
     * @param {string} id 
     * @param {string[]} peers 
     * @param {Controller} controller 
     */
    constructor(id, peers, handleFunc, signalConnection) {
        this.me = new Peer(id);
        this.connections = {}
        this.me.on("open", (id) => {
            this.listenForConnection();

            for (let i = 0; i < peers.length; i++) {
                this.establishConnection(peers[i]);
            }
        });
        this.handleFunc = handleFunc;
        this.signalConnection = signalConnection;
    }

    establishConnection(peer) {
        var conn = this.me.connect(peer);
        conn.on("open", () => {
            this.connections[peer] = {
                'conn': conn,
                'color': getRandomColor()
            };
            console.log("Connected to peer", peer);
            // Send messages
            // conn.send("Hello!"); // heartbeat
            const getDocOp = new CRDTOp(OpType.GetDoc, null);
            conn.send(getDocOp);
            conn.on("data", (data) => this.listenForData(peer, data));
            this.signalConnection();
        });
    } 

    listenForConnection() {
        this.me.on("connection", (conn) => {
            this.connections[conn.peer] = {
                'conn': conn,
                'color': getRandomColor()
            };
            conn.on("data", (data) => this.listenForData(conn.peer, data));
            conn.on("close", () => {
                console.log("Closed connection with peer", conn.peer);
            });
            this.signalConnection();
        });
    }

    /**
     * 
     * @param {CRDTOp} data 
     */
    listenForData = (peer, data) => {
        console.log('Received data', data);
        console.log('Received data optype', data.opType);
        console.log("Messenger", this);

        this.handleFunc(peer, data);
        // if (data.opType == OpType.Insert || data.opType == OpType.Delete) {
        //     // const wid = new WId(data.wChar.id.numSite, data.wChar.id.numTick);
        //     // let idPrev = null;
        //     // let idNext = null;
        //     // if (data.wChar.idPrev != null)
        //     //     idPrev = new WId(data.wChar.idPrev.numSite, data.wChar.idPrev.numTick);

        //     // if (data.wChar.idNew != null)
        //     //     idNext = new WId(data.wChar.idNew.numSite, data.wChar.idNew.numTick);
        //     // let wChar = new WChar(wid, data.wChar.c, data.wChar.visible, idPrev, idNext);
        //     // let crdtOp = new CRDTOp(data.opType, wChar);
        //     let crdtOp = CRDTOp.fromObject(data);
        //     this.handleFunc(crdtOp);
        // } else if (data.opType == OpType.GetDoc) {
        //     this.handleNewTreeRequest(peer);
        // } else if (data.opType == OpType.SendDoc) {
        //     this.handleFunc(data);
        // }
    }

    removePeer(peer) {
        delete this.connections[peer];
    }

    broadcast(data) {
        for (let key in this.connections) {
            if (key!=this.me) {
                console.log("am i getting hit here?");
                this.connections[key].conn.send(data);
            }
        } 
        
    }

    sendTree = (peer, sendOp) => {
        this.connections[peer].conn.send(sendOp);
    }

    heartbeat() { 
        for (let key in this.connections) {
            if (key!=this.me) {
                this.connections[key].conn.send("heartbeat", "");
                this.connections[key].conn.on("received heartbeat")
            }
        }  

    }
}