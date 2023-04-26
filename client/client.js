import { Messenger } from "./messenger.js";

export class Client {
    constructor() {
        this.messenger = null;
        this.initClient();
    }

    async initClient() {
        const response = await fetch("http://localhost:1800");
        const jsonData = await response.json();
        console.log(jsonData);
        document.getElementById('dummy-p').innerHTML = JSON.stringify(jsonData);
        this.messenger = new Messenger(jsonData.me, jsonData.peers);
    }
}