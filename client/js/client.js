var app = new Vue({
    el: '#app',
    data: {
      urlParams : new URLSearchParams(window.location.search),
      myId: new URLSearchParams(window.location.search).get('id'),
      socket: io('http://'+new URLSearchParams(window.location.search).get('server')+'/clients'),
      liderId: 3,
      rowData: []
    },
    created: function () {
        this.connect();
    },
    methods: {
        connect: function(){
            let vue = this;
            console.log("aqui entra");
            this.socket.on('your_id', function(msg){
                console.log("Me pide id");
                vue.socket.emit('is_my_id', vue.myId);
            });
        },
        filterKey: function(e){
            if((e.keyCode < 48 && (e.keyCode != 8 && e.keyCode != 9))|| e.keyCode > 57) {
                e.preventDefault();
            }
        },
        changeLeader: function(){
            console.log("Voy a cambiar de lider");
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