var io = require('socket.io')(8000);

var uid=0;
var userCount=0;

var planes={
    backgroudX:0
};

planes.update=function()
{

};

function update()
{
    io.sockets.emit('broadcast',
        {
            userCount:userCount
        });
}

setInterval(update,1000);



io.on('connection', function (socket) {

    if(socket.uid!=null)
    {
        console.log(socket.uid+ ' continue');
    }
    else
    {
        uid++;
        userCount++;
        socket.uid=uid;
        socket.emit('getUid', { uid: socket.uid });
        socket.broadcast.emit("add player",{uid:socket.uid});
        console.log(socket.uid+" connected")
    }

    //ÍË³ö
    socket.on("disconnect",function()
    {
        userCount--;
        socket.broadcast.emit("remove player",{ uid: socket.uid });
        console.log(socket.uid+ " disconnected.");
    });

    //ÒÆ¶¯
    socket.on("move",function(data)
    {
        //console.log(data);
        socket.emit("your move",data);
        socket.broadcast.emit("p2 move",data);
    });
});