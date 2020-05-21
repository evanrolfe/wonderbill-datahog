const express = require('express');

const server = express();
const port = 3002;

server.use(express.json());
server.get('/', (req, res) => res.send('Welcome to the callback server! Enjoy!'));
server.post('/', (req, res) => {
  console.log(`Recieved a post request!`);
  console.log(req.body);
});
server.listen(port, () => console.log(`Callback-Server listening at http://localhost:${port}`));

