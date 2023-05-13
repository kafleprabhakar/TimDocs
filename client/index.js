import { Client } from "./client.js";

let client = null;
window.onload = async function() {
    client = await Client.makeClient(true);
};

window.onunload = async function() {
    client.destroy();
}