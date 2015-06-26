var io = require('socket.io')(8000);

var interval = 10;
var uid=0;
var userCount=0;


//uid scoreMap
var playerMap=new Map();
var bulletArray=[];

var planes={
    counter:0
};

function Bullet(uid,x,y,speed){
    this.uid=uid;
    this.x = x;
    this.y = y;
    this.speed=speed;
}

planes.update=function()
{

};

function generateBullet()
{
    var speed=15;
    for (var value of playerMap.values()) {
        bulletArray.push(new Bullet(value.uid,value.x,value.y,speed));
        io.sockets.emit("generate bullet",{
            uid:value.uid,
            x:value.x,
            y:value.y,
            speed:speed
        })
    }
}
var counter = 0;
function update()
{

    if (counter++ % 5 == 0)
        generateBullet();
    io.sockets.emit('broadcast',
        {
            userCount:playerMap.size
        });
}

setInterval(update, 1000 / interval);



io.on('connection', function (socket) {
    uid++;
    userCount++;
    playerMap.set(uid, 0);

    socket.uid=uid;

    var players=[];
    for (var key of playerMap.keys()) {
        players.push(key);
    }

    //on connect you get your uid and others' uid
    socket.emit('initialize', {
        uid: socket.uid,
        players: players,
        interval: interval
    });


    //向其他玩家广播
    socket.broadcast.emit("add player",{uid:socket.uid});
    console.log(socket.uid + " connected" + interval);


    //退出
    socket.on("disconnect",function()
    {
        userCount--;
        playerMap.delete(socket.uid);
        socket.broadcast.emit("remove player",{ uid: socket.uid });
        console.log(socket.uid+ " disconnected.");
    });

    //移动
    socket.on("move",function(data)
    {
        //console.log(data);
        playerMap.set(data.uid,data);
        socket.emit("your move",data);
        socket.broadcast.emit("p2 move",data);
    });
});