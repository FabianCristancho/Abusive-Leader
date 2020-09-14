var app = new Vue({
    el: '#app',
    data: {
      urlParams : new URLSearchParams(window.location.search),
      myId: new URLSearchParams(window.location.search).get('id'),
      socket: io('http://'+new URLSearchParams(window.location.search).get('server')+'/clients'),
      liderId: '',
      rowData: []
    },
    created: function () {
        this.connect();
    },
    methods: {
        connect: function(){
            let vue = this;
            this.socket.on('your_id', function(msg){
                vue.myId = msg;
            });
            this.socket.on('info', function(message){
                console.log(message);
                vue.rowData.push(message);
            });
            this.socket.on('leader_id', function(idLeader){
                vue.liderId = idLeader;
                console.log('id lider: ' +idLeader);
            });
        },
        changeLeader: function(){
            console.log("I want to Give Up");
            this.liderId = -1;
            axios.post('http://'+new URLSearchParams(window.location.search).get('server')+'/giveUp')
            .then(response=>{})
            .catch(e => {
                console.log(e);
            })
        }
    }
});