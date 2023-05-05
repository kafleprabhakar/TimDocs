const {CRDTOp, OpType} = require('./utils.js');

export class Messenger {
    constructor(id, peers) {
        this.me = new Peer(id);
        this.connections = {}
        this.me.on("open", (id) => {

            this.listenForConnection()

            for (let i = 0; i < peers.length; i++) {
                this.establishConnection(peers[i])
            }
        })
    }

    establishConnection(peer) {
        var conn = this.me.connect(peer);
        conn.on("open", () => {
            this.connections[peer] = conn;
            console.log("Connected to peer", peer);
            // Send messages
            conn.send("Hello!"); // heartbeat 
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
    listenForData(data) {
        console.log('Received data', data);
        if (data.OpType == OpType.Insert) {
            
        }
    }

    removePeer(peer) {
        delete this.connections[peer];
    }

    broadcast(data) {
        for (let key in this.connections) {
            if (key!=this.me) {
                this.connections[key].send(data);
            }
        } 
        
    }

    heartbeat() { 
        for (let key in this.connections) {
            if (key!=this.me) {
                this.connections[key].send("heartbeat", "")
                this.connections[key].on("received heartbeat") 
            }
        }  

    }
}