const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const port = process.argv[2];
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var myId = 0;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

io.of('clients').on('connection', (socket) => {
     console.log('New client connected!');
     socket.emit('your_id');
     socket.on('is_my_id', (message) => {
          myId = message;
          console.log(`Now my server id is ${myId}`);
     });
});

app.get('/', (req, res) => res.send('Hello World!'));
http.listen(port, () => console.log(`Example app listening on port ${port}!`));