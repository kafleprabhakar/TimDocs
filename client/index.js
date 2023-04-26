import { Client } from "./client.js";

window.onload = async function() {
    var editor = document.getElementById("editor");
    const client = new Client();
};
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