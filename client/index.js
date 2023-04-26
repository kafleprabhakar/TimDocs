var peer = new Peer();
      window.onload = async function() {
        const response = await fetch("http://localhost:1800");
        const jsonData = await response.json();
        console.log(jsonData);
        document.getElementById('dummy-p').innerHTML = JSON.stringify(jsonData);
        const me = new Peer(jsonData['me'])
        var editor = document.getElementById("editor");
        me.on("open", id => {
            console.log("peer is created!\n")
            console.log(jsonData.peers);
            console.log(me);
            me.on("connection", (conn) => {
                console.log(me);
                conn.on("data", (data) => {
                  console.log("Received data", data);
                });
              });
            for (let i = 0; i < jsonData.peers.length; i++) {
                var conn = me.connect(jsonData.peers[i]);
                conn.on('open', function() {
                    console.log("Connected to peer", peer)
                    // Send messages
                    conn.send('Hello!');
                    conn.on("data", (data) => {
                        console.log('Received data', data);
                    })
                  });
            }
        })
        // me.on('connection', function(conn))
      };
//const crdt = TODO

window.editor = CodeMirror.fromTextArea(editor, {
    mode: "xml",
    theme: "dracula",
    lineNumbers: false
})
// insert and delete 
window.editor.on("keyHandled", (cmd,key,e) => {
    console.log("keyhandled", key)
    // operation 
    // handles backspace and enter 
    // broadcast(key) 
})

window.editor.on('change', (editor,obj) => {
    console.log("hiii", obj.text) 
})

