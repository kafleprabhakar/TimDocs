const express = require('express');
const app = express();
const port = 3000;
const crypto = require("crypto");
var cors = require('cors');

app.use(cors());

const peers = [];

app.get('/', (req, res) => {
  const id = crypto.randomBytes(16).toString("hex");
  const response = {};
  response['peers'] = [...peers];
  peers.push(id);
  response['me'] = id;
  console.log(response);
  res.json(response);
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});