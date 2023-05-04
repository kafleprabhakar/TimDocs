// import { WChar } from "./utils.js";
// import { WId } from "./utils.js";

const { WChar, WId } = require("./utils.js");

class TreeNode {
    /**
     * 
     * @param {WChar} wChar 
     * @param {WId} parent 
     */
    constructor(wChar, parent = null) {
        this.wChar = wChar;
        this.parent = parent;
        this.children = []; 
    }

    get isLeaf() {
        return this.children.length === 0;
    }

    get hasChildren() {
        return !this.isLeaf;
    }
}

class Tree {
    constructor() {
        this.root = null;
    }

    /**
     * Generates left to right order of the tree
     * @param {TreeNode} node 
     */
    *preOrderTraversal(node = this.root) {
        if (node) {
            yield node;
            if (node.children.length) {
                for (let child of node.children) {
                    yield* this.preOrderTraversal(child);
                }
            }
        }
    }

    /**
     * Generates right to left order of the tree
     * @param {TreeNode} node 
     */
    *postOrderTraversal(node = this.root) {
        if (node) {
            if (node.children.length) {
                for (let child of node.children) {
                    yield* this.postOrderTraversal(child);
                }
            }
            yield node;
        }
    }

    /**
     * Completely remove wchar with certain ID
     * @param {WId} id 
     * @returns 
     */
    remove(id) {
        for (let node of this.preOrderTraversal()) {
            const filtered = node.children.filter(c => c.wChar.id.numTick !== id.numTick);
            if (filtered.length !== node.children.length) {
                node.children = filtered;
                return true
            }
        }
        return false;
    }

    /**
     * Returns node with certain ID
     * @param {WId} id 
     * @returns 
     */
    find(id) {
        for (let node of this.preOrderTraversal()) {
            if (node.wChar.id.numTick === id.numTick) return node;
        }
        return undefined;
    }

    /**
     * Gets the ith visible character
     * @param {int} i 
     * @returns {WChar} found at ith position
     */
    ithVisible(i) {
        let count = 0;
        for (let node of this.preOrderTraversal()) {
            if (node.wChar.isVisible) {
                if (count === i) {
                    return node.wChar;
                }
                count += 1;
            }
        }
        return undefined;
    }

    /**
     * Insert WChar c into the position that WChar c2 used to be in
     * Position index INCLUDES hidden characters
     * Example:
     *  String before: "bd"
     *  String after calling insert("c", 1) => "bcd"
     * @param {WChar} c1
     * @param {int} p pos(c2)
     * @returns True if inserted correctly
     */
    insert(c1, p) {
        let tree = [...this.preOrderTraversal()];
        // First insertion into tree becomes the root.
        if (tree.length === 0) {
            this.root = new TreeNode(c1);
            return true
        }
        const t2 = tree[p]; // TreeNode found at position p
        if (t2 === null) {
            return false;
        }
        let t1 = new TreeNode(c1, t2.parent.wChar.id);
        t1.children = t2.children;
        t1.children.unshift(t2);
        t2.children = [];
        for (let child of t1.children) {
            child.parent = t1.wChar.id;
        }
        return true;
    }

    /**
     * Gets index of WChar c
     * Index INCLUDES hidden characters
     * @param {WChar} c 
     * @returns Index of WChar c (-1 if not found)
     */
    pos(c) {
        let i = 0;
        for (let node of this.preOrderTraversal()) {
            if (node === c) {
                return i;
            }
            i += 1;
        }
        return -1;
    }

    /**
     * Returns true if c can be found
     * @param {WChar} c 
     * @returns 
     */
    contains(c) {
        if (this.pos(c) === -1) {
            return false;
        }
        return true;
    }

    /**
     * Gets the previous WChar (does not have to be visible)
     * @param {WChar} c 
     * @returns Previous WChar. If none exist, returns -1.
     */
    CP(c) {
        let tree = [...this.preOrderTraversal()];
        for (let i = 0; i < length(tree); i++) {
            if (tree[i].wChar === c) {
                if (i > 0) {
                    return tree[i-1];
                }
            }
        }
        return undefined;
    }

    /**
     * Gets the next WChar (does not have to be visible)
     * @param {WChar} c 
     * @returns 
     */
    CN(c) {
        let tree = [...this.preOrderTraversal()];
        for (let i = 0; i < length(tree); i++) {
            if (tree[i].wChar === c) {
                if (i+1 < length(tree)) {
                    return tree[i+1];
                }
            }
        }
        return undefined;
    }

    /**
     * Returns string of visible WChars in linear order
     */
    value() {
        let s = "";
        for (let node of this.preOrderTraversal()) {
            if (node.wChar.isVisible) {
                s += node.wChar.c;
            }
        }
        return s;
    }

    /**
     * Returns the part of S between the elements c and d (excluding c and d)
     * @param {WChar} c 
     * @param {WChar} d 
     * @returns Undefined if d is not to be found after c
     */
    subseq(c, d) {
        let seq = [];
        let isCFound = false;
        for (let node of this.preOrderTraversal()) {
            console.log("node:", node);
            if (node.wChar === d) {
                return seq;
            }
            if (isCFound) {
                seq.push(node)
            }
            if (node.wChar === c) {
                isCFound = true;
            }
        }
        return undefined;
    }

    /**
     * Marks wChar c at position p as hidden
     * @param {int} p 
     * @returns True if successful. False if c at position p was already marked as NOT visible.
     */
    delete(p) {
        let tree = [...this.preOrderTraversal()];
        if (tree[p].wChar.isVisible === false) {
            return false;
        } else {
            tree[p].wChar.isVisible = false;
        }
        return true;
    }
}

module.exports = {
    Tree: Tree,
    TreeNode: TreeNode
}