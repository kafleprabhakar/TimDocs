import { WChar } from "./utils.js";
import { WId } from "./utils.js";

export class TreeNode {
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

export class Tree {
    /**
     * 
     * @param {WId} id 
     * @param {string} c 
     * @param {boolean} isVisible 
     * @param {WId} idPrev 
     * @param {WId} idNew 
     */
    constructor(id, c, isVisible = true, idPrev = null, idNew = null) {
        this.root = new TreeNode(new WChar(id, c, isVisible, idPrev, idNew))
    }

    /**
     * Generates left to right order of the tree
     * @param {TreeNode} node 
     */
    *preOrderTraversal(node = this.root) {
        yield node;
        if (node.children.length) {
            for (let child of node.children) {
                yield* this.preOrderTraversal(child);
            }
        }
    }

    /**
     * Generates right to left order of the tree
     * @param {TreeNode} node 
     */
    *postOrderTraversal(node = this.root) {
        if (node.children.length) {
            for (let child of node.children) {
                yield* this.postOrderTraversal(child);
            }
        }
        yield node;
    }

    /**
     * Insert wchar
     * @param {WId} parentNodeId 
     * @param {WId} id 
     * @param {string} c 
     * @param {boolean} isVisible 
     * @param {WId} idPrev 
     * @param {WId} idNew 
     * @returns 
     */
    insert(parentNodeId, id, c, isVisible = true, idPrev = null, idNew = null) {
        for (let node of this.preOrderTraversal()) {
            if (node.wChar.id.numTick === parentNodeId.numTick) {
                node.children.push(new TreeNode(new WChar(id, c, isVisible, idPrev, idNew), node));
                return true;
            }
        }
        return false;
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
}