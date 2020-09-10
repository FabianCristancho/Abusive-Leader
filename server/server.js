const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
const { response } = require('express');
const port = process.argv[2];
var myId = process.argv[3];
const gateway = process.argv[4];
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var node = require('socket.io-client');
var leader = '';
var leaderId = '';
var imLeader = false;
var socketClient = node.connect('http://'+gateway); 
const interfaces = require('os').networkInterfaces();


socketClient.on('connect', () => {
     console.log('Successfully connected!');
     socketClient.emit('serverData', {id: myId, ipServer:myIP+':'+port});
});

socketClient.on('sendLeader', function(data){
     console.log('Gateway send me that leader is: ' +data);
     console.log('LLEGA: ' +data.ipServer)
     if(data.ipServer == myIP+':'+port){
          console.log('I am leader');
          imLeader = true;
     }else{
          imLeader = false;
     }
     leaderId = data.id;
     leader = data.ipServer;
});

const myIP = getIpserver();
console.log('is:::' +myIP);


const randomBeat = Math.round(Math.random()*(5000-3000)+3000);

var servers = new Map();
servers.set(1, 'http://localhost:3001');
servers.set(2, 'http://localhost:3002');
servers.set(3, 'http://localhost:3003');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

io.of('clients').on('connection', (socket) => {
     console.log('New client connected!');
     socket.emit('your_id', myId);
          socket.emit('leader_id', leaderId);
          console.log('ENTRAAA');
    
});

function doBeatToLeader(){
     console.log('Beat to leader: ' +leader);
     axios.get('http://'+leader+'/isAlive')
     .then(response => {
          console.log("Leader response: " +response.data);
     })
     .catch(e => {
          console.log('Leader is dead');
          leaderId = '';
          leader = '';
     });
}

app.get('/isAlive', (req, res)=>{
     if(imLeader){
          res.send('ok');
          console.log('Im the leader, i am alive');
     }
     else{
          res.send('no');
          console.log('Im not the leader');
     }
});

app.post('/giveUp', (req, res)=>{
     console.log('I wish to give Up');
     imLeader = false;
});

function getIpserver(){
     const ipServer = Object.keys(interfaces)
     .reduce((results, name) => results.concat(interfaces[name]), [])
     .filter((iface) => iface.family === 'IPv4' && !iface.internal)
     .map((iface) => iface.address);
     return ipServer[ipServer.length-1];
}

setInterval(()=>{
     if(imLeader){
          console.log('Currently i am leader');
     }else{
          if(leader){
               doBeatToLeader();
          }else{
               console.log('Wait to leader');
          }
     }
     
}, randomBeat);

app.get('/', (req, res) => res.send('Hello World!'));
http.listen(port, () => {
     console.log(`Example app listening on port ${port}!`);
     console.log('do beat: ' +randomBeat +" milliseconds");
});