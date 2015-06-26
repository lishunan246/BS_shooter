var io = require('socket.io')(8000);

var interval = 10;
var uid=0;
var userCount=0;


//uid scoreMap
var playerMap=new Map();
var bulletArray=[];

var planeArray = [];

function Bullet(uid,x,y,speed){
    this.uid=uid;
    this.x = x;
    this.y = y;
    this.speed=speed;
}

function Plane(hp, width, height, type, speed) {
    // 随机的X
    this.x = parseInt(Math.random() * 460 + 1);
    this.y = 0;
    // 血量
    this.hp = hp;
    // 挨打
    this.hit = 0;
    // 是否死亡
    this.over = 0;
    this.type = type;

    this.width = width;
    this.height = height;
    this.speed = speed;
}


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
function getSpeed() {
    var number = parseInt(Math.random() * 10);
    if (number < 5 && number > 0) {
        return number;
    }
    return 1;
}

function getPlaneByType(type) {
    switch (type) {
        case 1:
            return new Plane(100, 50, 30, 1, getSpeed());
        case 2:
            return new Plane(500, 70, 90, 2, getSpeed());
        case 3:
            return new Plane(1000, 110, 170, 3, getSpeed());
    }
}

var planeLog = 0;
function generatePlane() {
    planeLog++;
    var plane;
    if (planeLog % 6 == 0) {
        plane = getPlaneByType(2);
    } else if (planeLog % 13 == 0) {
        plane = getPlaneByType(3);
    } else {
        plane = getPlaneByType(1);
    }

    planeArray.push(plane);

    console.log(plane);

    io.sockets.emit("generate plane", {
        type: plane.type,
        x: plane.x,
        y: plane.y,
        speed: plane.speed,
        hp: plane.hp
    })
}

var counter = 0;
function update()
{
    counter++;
    if (counter % 3 == 0)
        generateBullet();
    if (counter % 20 == 0)
        generatePlane();

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