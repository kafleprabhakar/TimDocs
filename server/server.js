const express = require('express');
const app = express();
const port = 1800;
const crypto = require("crypto");
var cors = require('cors');

app.use(cors());

//
const peers = {};

app.get('/', (req, res) => {
  const id = crypto.randomBytes(16).toString("hex");
  const response = {};
  response['peers'] = {...peers};
  // peers.push(id);
  peers[id] = req.query.name;
  response['me'] = id;
  console.log(response);
  res.json(response);
});

app.get('/reset', (req, res) => {
  peers = {};
  console.log("Reset list of peers");
});



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});