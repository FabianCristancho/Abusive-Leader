const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
const interfaces = require('os').networkInterfaces();
const app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var node = require('socket.io-client');
const port = process.argv[2];
var myId = process.argv[3];
const gateway = process.argv[4];
var leader, leaderId, deadLeaderID = '';
var imLeader, confirmed = false;
var socketClient = node.connect('http://'+gateway); 
const myIP = getIpserver();
const randomBeat = Math.round(Math.random()*(5000-3000)+3000);

//Settings
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//Server connections
socketClient.on('connect', () => {
     console.log('Successfully connected!');
     socketClient.emit('serverData', {id: myId, ipServer:myIP+':'+port});
});

socketClient.on('sendLeader', function(data){
     console.log('Gateway send me that leader is: ' +data.ipServer);
     if(data.ipServer == myIP+':'+port){
          console.log('I am the leader');
          imLeader = true;
     }else{
          imLeader = false;
     }
     leaderId = data.id;
     leader = data.ipServer;
     io.emit('leader_id', leaderId);
});

//Client connections
io.of('clients').on('connection', (socket) => {
     console.log('New client connected!');
     socket.emit('your_id', myId);
     socket.emit('leader_id', leaderId);
     socket.emit('info',{time:new Date().toLocaleString(), leader:leaderId, informant:'-', giveup:'-'});     
});

//Services
app.get('/', (req, res) => res.send('Hello World!'));

app.get('/isAlive', (req, res)=>{
     if(imLeader){
          res.json({res:'ok', status:true});
          console.log('Im the leader, i am alive');
     }
     else{
          if(!confirmed){
               res.json({res:'dead', status:0});
               confirmed = true;
          }else{
               res.json({res:'dead', status:1});
          }
          console.log('Im not the leader');
     }
});

app.post('/giveUp', (req, res)=>{
     console.log('I wish to give Up');
     imLeader = false;
     leader = '';
     leaderId = '';
});

app.get('/newLeader', (req, res)=>{
     leaderId = req.query.leaderId;
     leader = req.query.leaderIp;
     if(myId == leaderId){
          console.log('¡I AM LEADER!');
          imLeader = true;
          confirmed = false;
     }else{
          imLeader = false;
     }
     io.of('clients').emit('leader_id', leaderId);
     io.of('clients').emit('info',{time:new Date().toLocaleString(), leader:leaderId, informant:req.query.informer, giveup:req.query.deadLeader});   
});

// Functions
function doBeatToLeader(){
     console.log('Beat to leader: ' +leader);
     axios.get('http://'+leader+'/isAlive')
     .then(response => {
          console.log("Leader response: " +response.data.res);
          if(response.data.res == 'dead'){
               if(response.data.status == 0){
                    console.log('¡I do the selection!');
                    deadLeaderID = leaderId;
                    soliciteServers();
               }else{
                    leaderId, leader = '';
               }
          }
     })
     .catch(e => {
          console.log('Leader is dead');
          leaderId, leader = '';
     });
}

function soliciteServers(){
     console.log('I solicite servers to gateway ');
     axios.get('http://'+gateway+'/sendMeServers', {
          params: {deadLeader: leaderId}
     })
     .then(response => {
          console.log(response.data);
          selectLeader(response.data);
     })
     .catch(e => {});
}

function selectLeader(servers){
     var maxId = -1;
     var newLeader = '';
     for (var idServer in servers){
          if(idServer>maxId){
               maxId = idServer;
               newLeader = servers[idServer];
          }
     }
     console.log("Server with with max id is: " +maxId);
     sendNewLeader(servers, maxId, newLeader);
}

function sendNewLeader(servers, maxId, newLeader){
     for (var idServer in servers){
          axios.get('http://'+servers[idServer]+'/newLeader', {params:{
               leaderId: maxId,
               leaderIp: newLeader,
               deadLeader: deadLeaderID,
               informer: myId
          }})
          .catch(e => {});;
     }
     axios.get('http://'+gateway+'/newLeader', {params:{
               id: maxId,
               ipServer: newLeader
     }})
     .catch(e => {});;
}

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
               if(confirmed){
                    console.log('I am down');
               }else{
                    console.log('Wait to leader');
               }
          }
     }
}, randomBeat);

http.listen(port, () => {
     console.log(`Server listening on port ${port}!`);
     console.log('Do beat: ' +randomBeat +" milliseconds");
});