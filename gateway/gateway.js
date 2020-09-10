const express = require('express');
const app = express();
const port = process.argv[2];

var http = require('http').createServer(app);
var io = require('socket.io')(http);
var cors = require('cors');

var connectedServers = new Map();
var leader = '';

app.use(cors());

function setNewServer(server){
     if(connectedServers.size==0){
          leader = server;
          console.log('Leader is ' +leader.ipServer);
     }
     connectedServers.set(server.id, server.ipServer);
     console.log('Cant servers: ' +connectedServers.size);
}

io.on('connection', function(socket) {
     console.log('A new client connected ');
     socket.on('serverData', function(data){
          console.log(data);
          setNewServer(data);
          io.emit('sendLeader', leader);
     });

});



http.listen(port, () => {
     console.log(`Server listening on port ${port}`);
});