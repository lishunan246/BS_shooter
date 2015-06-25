var io = require('socket.io')(8000);

var uid=0;


io.on('connection', function (socket) {
    uid++;
    socket.uid=uid;
    socket.emit('getUid', { id: socket.uid });
    //socket.on('my other event', function (data) {
    //    console.log(data);
    //});

    socket.on("disconnect",function()
    {
        socket.broadcast.emit("quit",{ id: socket.uid });
       console.log(socket.uid+ " disconnected.");
    });

    socket.on("move",function(data)
    {
       console.log(data);
        socket.broadcast.emit("p2 move",data);
    });
});