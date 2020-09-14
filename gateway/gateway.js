const express = require('express');
const app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var cors = require('cors');
var connectedServers = new Map();
const port = process.argv[2];
var leader = '';

//Settings
app.use(cors());

//Connections
io.on('connection', function(socket) {
     console.log('A new client connected ');
     socket.on('serverData', function(data){
          console.log(data);
          setNewServer(data);
          socket.emit('sendLeader', leader);
     });
});

//Services
app.get('/sendMeServers', (req, res) => {
     console.log('Leader that give up: ' +req.query.deadLeader);
     connectedServers.delete(req.query.deadLeader);
     console.log(connectedServers);
     res.json(Object.fromEntries(connectedServers));
});

app.get('/newLeader', (req, res)=>{
     leader = req.query;
});

//Functions
function setNewServer(server){
     if(connectedServers.size==0){
          leader = server;
          console.log('Leader is ' +leader.ipServer);
     }
     connectedServers.set(server.id, server.ipServer);
     console.log('Cant servers: ' +connectedServers.size);
}

http.listen(port, () => {
     console.log(`Server listening on port ${port}`);
});