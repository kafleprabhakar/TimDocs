export class Node {
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

// Tree node that is the WChar
export class WChar {
    constructor(id, char, visible, idPrev, idNew) {
        this.id = id;
        this.char = char,
        this.visible = visible;
        this.idPrev = idPrev;
        this.idNew = idNew;
    }

    // Returns the message of this CRDT Operation to be sent to peers
    toMessage() {
        return {

        }
    }
}
  
export class Tree {
    constructor(id, char, visible, idPrev, idNew) {
      this.root = new TreeNode(id, char, visible, idPrev, idNew);
    }
  
    *preOrderTraversal(node = this.root) {
      yield node;
      if (node.children.length) {
        for (let child of node.children) {
          yield* this.preOrderTraversal(child);
        }
      }
    }
  
    *postOrderTraversal(node = this.root) {
      if (node.children.length) {
        for (let child of node.children) {
          yield* this.postOrderTraversal(child);
        }
      }
      yield node;
    }
  
    insert(parentNodeKey, key, value = key) {
      for (let node of this.preOrderTraversal()) {
        if (node.key === parentNodeKey) {
          node.children.push(new TreeNode(key, value, node));
          return true;
        }
      }
      return false;
    }
  
    remove(key) {
      for (let node of this.preOrderTraversal()) {
        const filtered = node.children.filter(c => c.key !== key);
        if (filtered.length !== node.children.length) {
          node.children = filtered;
          return true;
        }
      }
      return false;
    }
  
    find(key) {
      for (let node of this.preOrderTraversal()) {
        if (node.key === key) return node;
      }
      return undefined;
    }
  }