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
var confirmed = false;
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
     io.emit('leader_id', leaderId);
});

const myIP = getIpserver();
console.log('is:::' +myIP);


const randomBeat = Math.round(Math.random()*(5000-3000)+3000);

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
          console.log("Leader response: " +response.data.res);
          if(response.data.res == 'dead'){
               if(response.data.status == 0){
                    console.log('i do the selection');
                    soliciteServers();
               }else{
                    leaderId = '';
                    leader = '';
               }
          }
     })
     .catch(e => {
          console.log('Leader is dead');
          leaderId = '';
          leader = '';
     });
}

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
     // io.of('clients').emit('leader_id', leaderId);
     console.log('YA NO HAY LIDER');
     io.emit('leader_id', leaderId);
});

function soliciteServers(){
     console.log('###################ESTA ENTRANDO######################');
     axios.get('http://'+gateway+'/sendMeServers', {
          params: {
            deadLeader: leaderId
          }
        })
     .then(response => {
          console.log(response.data);
          selectLeader(response.data);
     })
     .catch(e => {
          console.log(e);
     });
}

function getIpserver(){
     const ipServer = Object.keys(interfaces)
     .reduce((results, name) => results.concat(interfaces[name]), [])
     .filter((iface) => iface.family === 'IPv4' && !iface.internal)
     .map((iface) => iface.address);
     return ipServer[ipServer.length-1];
}

function selectLeader(servers){
     var maxId = -1;
     var newLeader = '';
     for (var idServer in servers){
          if(idServer>maxId){
               maxId = idServer;
               newLeader = servers[idServer];
          }
            console.log("La idServer es " + idServer+ " y el valor es " + servers[idServer]);
     }
     console.log("El server con mayor id es el: " +maxId);
     sendNewLeader(servers, maxId, newLeader);
}

function sendNewLeader(servers, maxId, newLeader){
     for (var idServer in servers){
          axios.get('http://'+servers[idServer]+'/newLeader', {params:{
               leaderId: maxId,
               leaderIp: newLeader
          }})
          .then(response => {
               
          })
          .catch(e => {
               console.log(e);
          });
     }
     axios.get('http://'+gateway+'/newLeader', {params:{
               id: maxId,
               ipServer: newLeader
     }})
     .then(response => {               
     })
     .catch(e => {
          console.log(e);
     });
}

app.get('/newLeader', (req, res)=>{
     console.log('Ahora el nuevo lider tiene id: ' +req.query.leaderId +' y su ip es: ' +req.query.leaderIp);
     leaderId = req.query.leaderId;
     leader = req.query.leaderIp;
     if(myId == leaderId){
          console.log('¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿SOY LIDER??????????????????????????????????');
          imLeader = true;
          confirmed = false;
     }else{
          imLeader = false;
     }
});

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

app.get('/', (req, res) => res.send('Hello World!'));
http.listen(port, () => {
     console.log(`Example app listening on port ${port}!`);
     console.log('do beat: ' +randomBeat +" milliseconds");
});