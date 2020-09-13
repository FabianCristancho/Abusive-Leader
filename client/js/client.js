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
                console.log("Me pide id");
                // vue.socket.emit('is_my_id', vue.myId);
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
        filterKey: function(e){
            if((e.keyCode < 48 && (e.keyCode != 8 && e.keyCode != 9))|| e.keyCode > 57) {
                e.preventDefault();
            }
        },
        changeLeader: function(){
            console.log("I want to Give Up");
            this.liderId = -1;
            axios.post('http://'+new URLSearchParams(window.location.search).get('server')+'/giveUp')
            .then(response=>{})
            .catch(e => {
                console.log(e);
            })

            //     axios.post('http://'+new URLSearchParams(window.location.search).get('server')+'/changeTime', null, {params: {hour: this.newHour, minute:this.newMinute, seconds: this.newSeconds}})
            // .then(response => {
            //     this.rowData.push(response.data);
            //     this.newHour = '';
            //     this.newMinute = '';
            //     this.newSeconds = '';
            // })
            // .catch(e => {
            //     console.log(e);
            // });  
        }
    }
});