import { Client } from "./client.js";
import { Tree } from "./tree.js";

window.onload = async function() {
    var editor = document.getElementById("editor");
    const client = new Client(true);
    
    const tree = new Tree(1, 'AB');

    tree.insert(1, 11, 'AC');
    tree.insert(1, 12, 'BC');
    tree.insert(12, 121, 'BG');

    console.log([...tree.preOrderTraversal()].map(x => x.value));
    // ['AB', 'AC', 'BC', 'BCG']

    console.log(tree.root.value);              // 'AB'
    console.log(tree.root.hasChildren);        // true

    console.log(tree.find(12).isLeaf);         // false
    console.log(tree.find(121).isLeaf);        // true
    console.log(tree.find(121).parent.value);  // 'BC'

    tree.remove(12);   

    console.log([...tree.postOrderTraversal()].map(x => x.value));
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