import { WChar } from "./utils.js";
import { WId } from "./utils.js";

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
}

export class Tree {
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
     * Returns WChar with certain ID
     * @param {WId} id 
     * @returns 
     */
    find(id) {
        const node = this.findNode(id);
        if (node != null) {
            return node.wChar;
        }
        return null;
    }

    /**
     * Internal use only. Returns the TreeNode with certain ID.
     * @param {WId} id 
     * @returns TreeNode
     */
    findNode(id) {
        if (id == null) {
            return null;
        }
        
        for (let node of this.preOrderTraversal()) {
            
            if (id.isEqual(node.wChar.id)) return node;
        }
        return null;
    }

    /**
     * Gets the ith visible character
     * @param {int} i 
     * @returns {WChar} found at ith position
     */
    ithVisible(i) {
        let count = 0;
        for (let node of this.preOrderTraversal()) {
            if (node.wChar.visible) {
                if (count === i) {
                    return node.wChar;
                }
                count += 1;
            }
        }
        return null;
    }

    /**
     * Insert WChar c into the position that WChar c2 used to be in
     * Position index INCLUDES hidden characters
     * Example:
     *   String before: "bd"
     *   String after calling insert("c", 1) => "bcd"
     * @param {WChar} c1
     * @param {number} p pos(c2)
     * @returns True if inserted correctly
     */
    insert(c1, p) {
        let tree = [...this.preOrderTraversal()];
        // First insertion into tree becomes the root.
        if (tree.length == 0) {
            this.root = new TreeNode(c1);
            return true;
        }

        if (p > tree.length) {
            return false;
        }

        // Case 1: Insert at the end of the tree. 
        //         Append to last node's children.
        let t2 = null;
        if (p == tree.length) {
            t2 = tree[tree.length-1];
            t2.children.push(new TreeNode(c1, t2.wChar.id));
            return true;
        }

        // Case 2: Insert anywhere else. Swap such that:
        //      parent           parent
        //         |               |
        //        t2    becomes    t1
        //      / |  \          / / | \
        //     t3 t4 t5       t2 t3 t4 t5
        t2 = tree[p];
        let t1 = new TreeNode(c1, t2.parent);
        // Change root if t2 was root
        if (this.root.wChar.id === t2.wChar.id) {
            this.root = t1;
        }
        if (t2.parent != null) {
            const t2Parent = this.findNode(t2.parent);
            for (let i = 0; i < t2Parent.children.length; i++) {
                if (t2Parent.children[i].wChar.id === t2.wChar.id) {
                    t2Parent.children[i] = t1;
                }
            }
        }
        // t1 takes on t2's children. t2 becomes t1's first child.
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
     * @param {WChar} c 
     * @param {boolean} checkVisible If true, index only includes visible character. If false, includes all characters.
     * @returns Returns -1 if not found
     */
    pos(c, checkVisible = true) {
        let i = -1;
        const tree = [...this.preOrderTraversal()];
        if (c == null) {
            return tree.length;
        }
        for (let node of tree) {
            if (checkVisible && node.wChar.visible == false) {
                continue;
            }
            i += 1;
            if (node.wChar.id.isEqual(c.id)) {
                return i;
            }
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
     * @returns Previous WChar. If none exist, returns null.
     */
    CP(c) {
        let tree = [...this.preOrderTraversal()];
        for (let i = 0; i < tree.length; i++) {
            if (tree[i].wChar === c) {
                if (i > 0) {
                    return tree[i-1];
                }
            }
        }
        return null;
    }

    /**
     * Gets the next WChar (does not have to be visible)
     * @param {WChar} c 
     * @returns Next WChar. If none exist, returns null.
     */
    CN(c) {
        let tree = [...this.preOrderTraversal()];
        for (let i = 0; i < tree.length; i++) {
            if (tree[i].wChar === c) {
                if (i+1 < length(tree)) {
                    return tree[i+1];
                }
            }
        }
        return null;
    }

    /**
     * Returns string of visible WChars in linear order
     */
    value() {
        let s = "";
        for (let node of this.preOrderTraversal()) {
            if (node.wChar.visible) {
                s += node.wChar.c;
            }
        }
        return s;
    }

    /**
     * Returns the part of S between the elements c and d (excluding c and d)
     * @param {WChar} c 
     * @param {WChar} d 
     * @returns {WChar[]} Empty array if d is not to be found after c
     */
    subseq(c, d) {
        let seq = [];
        let isCFound = false;
        if (c == null) {
            isCFound = true;
        }
        for (let node of this.preOrderTraversal()) {
            if (d && node.wChar.id.isEqual(d.id)) {
                return seq;
            }
            if (isCFound) {
                seq.push(node.wChar);
            }
            if (c && node.wChar.id.isEqual(c.id)) {
                isCFound = true;
            }
        }
        if (d == null) {
            return seq;
        }
        return [];
    }

    /**
     * Marks wChar c at position p as hidden
     * IMPORTANT: p is the ith VISIBLE character
     * @param {int} p 
     * @returns True if successful. False if c at position p was already marked as NOT visible.
     */
    delete(p) {
        let tree = [...this.preOrderTraversal()];
        let c = 0;
        for (let node of this.preOrderTraversal()) {
            if (node.wChar.visible) {
                if (c == p) {
                    node.wChar.visible = false;
                    return true;
                }
                c += 1;
            }
        }
        return false;
    }
}