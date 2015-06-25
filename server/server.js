var io = require('socket.io')(8000);

var uid=0;


io.on('connection', function (socket) {

    if(socket.uid!=null)
    {
        console.log(socket.uid+ ' continue');
    }
    else
    {
        uid++;
        socket.uid=uid;
        socket.emit('getUid', { id: socket.uid });
        socket.broadcast.emit("add player",{id:socket.uid});
        console.log(socket.uid+" connected")
    }

    //ÍË³ö
    socket.on("disconnect",function()
    {
        socket.broadcast.emit("remove player",{ id: socket.uid });
       console.log(socket.uid+ " disconnected.");
    });

    //ÒÆ¶¯
    socket.on("move",function(data)
    {
       console.log(data);
        socket.broadcast.emit("p2 move",data);
    });
});