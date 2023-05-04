import { Client } from "./client.js";
import { Tree, TreeNode } from "./tree.js";
import { WId } from "./utils.js";

window.onload = async function() {
    var editor = document.getElementById("editor");
    const client = new Client(true);
    
    const tree = new Tree(new WId(1, 1), 'a');

    tree.insertBasic(new WId(1, 1), new WId(1, 2), 'b');
    tree.insertBasic(new WId(1, 1), new WId(1, 3), 'c');
    tree.insertBasic(new WId(1, 2), new WId(1, 4), 'd');

    console.log([...tree.preOrderTraversal()].map(x => x.wChar.c));
    // ['AB', 'AC', 'BC', 'BCG']

    console.log(tree.root.wChar.c);              // 'AB'
    console.log(tree.root.hasChildren);        // true

    console.log(tree.find(new WId(1, 2)).isLeaf);         // false
    console.log(tree.find(new WId(1, 4)).isLeaf);        // true
    console.log(tree.find(new WId(1, 4)).parent.wChar.c);  // 'BC'

    tree.remove(new WId(1, 2));   

    console.log([...tree.postOrderTraversal()].map(x => x.wChar.c));
};