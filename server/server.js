const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
const { response } = require('express');
const port = process.argv[2];
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var myId = 0;
var leader = 'http://localhost:3000';
var imLeader = false;

const interfaces = require('os').networkInterfaces();


const myIP = getIpserver();
console.log('is:::' +myIP);


const randomBeat = Math.round(Math.random()*(5000-1000)+1000);

var servers = new Map();
servers.set(1, 'http://localhost:3001');
servers.set(2, 'http://localhost:3002');
servers.set(3, 'http://localhost:3003');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

io.of('clients').on('connection', (socket) => {
     console.log('New client connected!');
     socket.emit('your_id');
     socket.on('is_my_id', (message) => {
          myId = message;
          if(myId==3){
               imLeader = true;
               console.log("I AM LEADER");
          }
          console.log(`Now my server id is ${myId}`);
     });
});

function doBeatToLeader(){
     if(!imLeader){
          console.log('Beat to leader');
          axios.get(leader+'/isAlive')
          .then(response => {
               console.log("Leader response: " +response.data);
          })
          .catch(e => {
               console.log(e);
          });
     }
}

app.get('/isAlive', (req, res)=>{
     console.log('Entra a esta vivo');
     if(imLeader){
          res.send('ok');
          console.log('Im the leader');
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
     doBeatToLeader();
}, randomBeat);

app.get('/', (req, res) => res.send('Hello World!'));
http.listen(port, () => {
     console.log(`Example app listening on port ${port}!`);
     console.log('do beat: ' +randomBeat +" milliseconds");
});