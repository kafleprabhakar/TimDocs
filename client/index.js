import { Client } from "./client.js";

window.onload = async function() {
    const client = await Client.makeClient(true);
};