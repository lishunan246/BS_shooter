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

    //console.log(plane);

    io.sockets.emit("generate plane", {
        type: plane.type,
        x: plane.x,
        y: plane.y,
        speed: plane.speed,
        hp: plane.hp
    })
}

function updatePlane() {
    for (var a in planeArray) {
        if (!planeArray.hasOwnProperty(a)) {
            continue;
        }
        planeArray[a].y += planeArray[a].speed;
        // 如果超出屏幕将该小飞机删除
        if (planeArray[a].y > 780) {
            planeArray.splice(a, 1);
        }

        // 小飞机死亡
        if (planeArray[a].over > 0) {
            planeArray[a].over--;

            if (planeArray[a].over > 20) {
                //cxt.drawImage(boo1,planeArray[a].x + planeArray[a].width/2 - 20  ,planeArray[a].y + planeArray[a].height / 2 -10,41,39);
            } else if (planeArray[a].over > 2) {
                // cxt.drawImage(over,planeArray[a].x + planeArray[a].width/2 - 20 ,planeArray[a].y + planeArray[a].height / 2 -10,40,43);
            } else {
                planeArray.splice(a, 1);
            }
        }
        else {
            //cxt.drawImage(planeArray[a].img,planeArray[a].x,planeArray[a].y,planeArray[a].width,planeArray[a].height);
            // 判断自己是否死亡
            //if( me.x > (planeArray[a].x - planeArray[a].width + 20) && (me.x) <(planeArray[a].x + planeArray[a].width - 20) && (me.y) < (planeArray[a].y + planeArray[a].height + 20) && (me.y + 72) > (planeArray[a].y - 20)){
            //     gameover();
            // }

            if (planeArray[a].hit > 0) {
                //    cxt.drawImage(boo1,planeArray[a].x + planeArray[a].width/2 - 20 ,planeArray[a].y + planeArray[a].height / 2 -10,41,39);
                //cxt.drawImage(boo1,flivver[a].x + 5 ,flivver[a].y,41,39);
                planeArray[a].hit--;
            }
        }
    }
}

function updateBullet() {
    for (var i in bulletArray) {
        if (!bulletArray.hasOwnProperty(i)) {
            continue;
        }
        // 飞到顶部就将OBJ删除掉
        if (bulletArray[i].y < 0) {
            bulletArray.splice(i, 1);
            continue;
        }

        bulletArray[i].y -= bulletArray[i].speed;
        // 将小飞机画到画布上
        //cxt.drawImage(bulletImg,bulletArray[i].x,bulletArray[i].y,7,17);

        // 子弹碰到飞机的情况
        for (var j in planeArray) {
            if (!planeArray.hasOwnProperty(j)) {
                continue;
            }
            if (planeArray[j].over > 0) {
                continue;
            }
            if (bulletArray[i].x > planeArray[j].x && bulletArray[i].x < planeArray[j].x + planeArray[j].width && bulletArray[i].y > planeArray[j].y && bulletArray[i].y - planeArray[j].height < planeArray[j].y) {

                planeArray[j].hit = 10;
                //$('#isdz').html('打中了编号' + j);

                if (planeArray[j].hp > 1) {
                    planeArray[j].hp -= 80;
                } else {
                    planeArray[j].over = 40;
                    ///playerScore += 1;
                }
                // 子弹消失
                bulletArray.splice(i, 1);
                break;
            }
        }
    }
}

var counter = 0;
function update()
{
    counter++;
    if (counter % 3 == 0)
        generateBullet();
    if (counter % 20 == 0)
        generatePlane();

    updatePlane();
    updateBullet();

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
        players.push({
            uid: key,
            x: playerMap.get(key).x,
            y: playerMap.get(key).y
        });
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