import { Controller } from './controller.js';
import { WId, WChar, CRDTOp, OpType } from './utils.js';

function getRandomColor() {
    const colors = ['#5154aa', '#bf6629', '#d81562', '#11829e', '#a90d11', 
                    '#63024a', '#10911f', '#fd8e47', '#0852e9', '#6a9f7a',
                    '#673c63', '#40262f', '#e93d31', '#223c54', '#4f8d95'];
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
    constructor(id, name, peers, handleFunc, signalConnection) {
        this.me = new Peer(id);
        this.name = name;
        this.allPeers = peers;
        this.connections = {}
        this.me.on("open", (id) => {
            this.listenForConnection();

            // for (let i = 0; i < peers.length; i++) {
            //     this.establishConnection(peers[i]);
            // }
            for (let peer in peers) {
                this.establishConnection(peer);
            }
        });
        this.handleFunc = handleFunc;
        this.signalConnection = signalConnection;
        this.heartbeat();
        this.heartbeatThread = setInterval(this.heartbeat,5000);
    }

    destroy = () => {
        clearInterval(this.heartbeatThread);
        for (let peer in this.connections) {
            this.connections[peer].conn.close();
        }
        this.me.disconnect();
    }

    establishConnection(peer) {
        var conn = this.me.connect(peer, {"metadata": {'name': this.name}});
        conn.on("open", () => {
            this.connections[peer] = {
                'conn': conn,
                'color': getRandomColor(),
                'name': this.allPeers[peer]
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
                'color': getRandomColor(),
                'name': conn.metadata.name
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
        if (data.opType == OpType.Heartbeat) {
            this.sendAck(peer, new CRDTOp(OpType.Ack));
        } else if (data.opType == OpType.Ack) {
            this.handleAck(peer);
        } else {
            this.handleFunc(peer, data); 
        }
    }

    removePeer(peer) {
        this.connections[peer].conn.close();
        delete this.connections[peer]; 
        this.signalConnection();
    }

    broadcast(data) {
        for (let key in this.connections) {
            if (key!=this.me) {
                this.connections[key].conn.send(data);
            }
        } 
        
    }

    sendTree = (peer, sendOp) => {
        this.connections[peer].conn.send(sendOp);
    }

    sendAck = (peer, ackOp) => {
        console.log("Ack sent", ackOp)
        this.connections[peer].conn.send(ackOp); 
    }
    
    handleAck = (peer, versionNum) => {
        console.log("handle ack");
        this.connections[peer]['heartbeat'] = 0;
        // check version number here
        // if version from peer is less  
        // my version number 
        //if (versionNum < this.) {
            //this.sendTree(peer,)
        //}
        

    }
    

    heartbeat= () => {
        // Moved mapHeartbeats to field of connections
        for (let key in this.connections) {
            if (this.connections[key]['heartbeat']==1) { 
                this.removePeer(key);
            }
        } 
        for (let key in this.connections) {
            if (key!=this.me) {
                const beat = new CRDTOp(OpType.Heartbeat, null,null);
                this.connections[key].conn.send(beat); 
                // if received ack w ack then send tree 
                this.connections[key]['heartbeat'] += 1;
                console.log("heartbeat sent", key);
            }
        }
    }
}