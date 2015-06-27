// JavaScript Document
var socket = io.connect('http://192.168.31.4:8000');
var uid;
var interval = 10;
var playerName=(Cookies.get('playername')==null)?"无名":Cookies.get('playername');
$("#playername").html(playerName);

function register()
{
    var name=prompt("取一个名字吧",playerName);
    if(name!=null)
    {
        playerName=name;
        $("#playername").html(playerName);
        Cookies.set('playername', playerName);
    }
}

function highscore()
{
    socket.emit("want highscore");
}


//my position
var me = {x:240,y:750};

var positionToSend={
    x:0,
    y:0
};

var playerMap=new Map();

var Player={
    createNew:function(uid)
    {
        var player={};
        player.uid=uid;
        return player;
    }
};

var bulletArray = [];
var planeArray = [];
var scores;
function sortResults(prop, asc) {
    scores = scores.sort(function(a, b) {
        if (asc) return (a[prop] > b[prop]) ? 1 : ((a[prop] < b[prop]) ? -1 : 0);
        else return (b[prop] > a[prop]) ? 1 : ((b[prop] < a[prop]) ? -1 : 0);
    });

    var transform = {'tag':'li','html':'${playername} (${playerScore})'};

    $("#s").html(json2html.transform(scores.slice(0,5),transform));
}

function Bullet(uid,x,y,speed){
    this.uid=uid;
    this.x = x;
    this.y = y;
    this.speed=speed;
}

socket.on("give highscore",function(data){
    console.log(data);
    scores=data;

    sortResults('playerScore',false);
});

socket.on("your move",function(data){
    me.x=data.x;
    me.y=data.y;
});

socket.on('broadcast',function(data)
{
   //console.log(data);
    $('#player-count').html(data.userCount);
});


//on connect you get your uid and others' uid
socket.on('initialize', function (data) {
    console.log('connect:' + data);
    uid=data.uid;
    interval = data.interval;

    data.players.forEach(function(element){
        playerMap.set(element.uid, Player.createNew(element.uid));
        playerMap.get(element.uid).x = element.x;
        playerMap.get(element.uid).y = element.y;
    });
    //socket.emit('my other event', { my: 'data' });
});

socket.on('add player', function (data) {
    playerMap.set(data.uid,Player.createNew(data.uid));

    console.log(data);
});

socket.on('remove player', function (data) {
    playerMap.delete(data.uid);
    console.log(data);
});

socket.on('p2 move', function (data) {
   // console.log(data);
    if(playerMap.has(data.uid))
    {
        playerMap.get(data.uid).x=data.x;
        playerMap.get(data.uid).y=data.y;
    }
    else
    {
        console.log("no key" + data.uid + playerMap.size);
    }
    //console.log("no key"+data.uid+playerMap.size);

    //socket.emit('my other event', { my: 'data' });
});

socket.on('generate bullet',function(data)
{
    //console.log(data);
    bulletArray.push(new Bullet(data.uid,data.x,data.y,data.speed));
});

// 获取飞机
function getPlaneByType(type) {
    switch (type) {
        case 1:
            return new Plane(100, 50, 30, planeImg1, getSpeed());
        case 2:
            return new Plane(500, 70, 90, planeImg2, getSpeed());
        case 3:
            return new Plane(1000, 110, 170, planeImg3, getSpeed());
    }
}


socket.on("generate plane", function (data) {
    console.log(data);
    var plane = getPlaneByType(data.type);
    plane.x = data.x;
    plane.y = data.y;
    plane.speed = data.speed;
    plane.hp = data.hp;
    planeArray.push(plane);
});


var c = document.getElementById("canvas");
var cxt = c.getContext("2d");
var img = newImg("./assets/bg_01.jpg");
var fps;
cxt.drawImage(img,0,0,480,800);

var planeLog = 0;
var planeImg1 = newImg("./assets/flivver.png");
var planeImg2 = newImg("./assets/flivver2.png");
var planeImg3 = newImg("./assets/flivver3.png");

// 用于记录游戏的时间，越到后面越快
var time1 = 0;
var time2 = 80;

// 积分
var playerScore = 0;

function getSpeed(){
	var number = parseInt(Math.random()*10);
	if(number < 5 && number > 0){
		return number;
	}
	return 1;
}
// 飞机的对象
function Plane(hp, width, height, img, speed){
	// 随机的X
	this.x = parseInt(Math.random()*460+1);
	this.y = 0;
	// 血量
	this.hp = hp;
	// 挨打	
	this.hit = 0;
	// 是否死亡
	this.over = 0;
	
	this.width = width;
	this.height = height;
	this.img = img;
	this.speed = speed;
}



function gameover(){
	window.clearTimeout(fps);
    socket.emit("gameover",{
        uid:uid,
        playername:playerName,
        playerScore:playerScore
    });
    socket.disconnect();
	//$('#dotu').fadeOut();
	$('.content').css('position','relative')
        .append('<span style="position:absolute; top:5px; left:2px; font-size:150px; color:#cc0000;  text-align:center" id="sil"></span>');
	$('#sil').html('Game').hide().fadeIn(1000,function()
    {
		$(this).html('Over').hide().fadeIn(1000,function()
        {
			$(this).html('<a href="javascript:location.reload();" style="color:#cc0000" title="重新开始">Game Over</a><br>' + playerScore  + ' 分').hide().fadeIn();
        });
	});
}

(
	function(cxt)
    {
        var planes = {counter:0};
        // 用于存放小飞机
        // 自己
        var meImg = newImg('assets/me.png');//64*72
        // 子弹
        var bulletImg = newImg('./assets/cartridge.png');
        var boo1 = newImg('./assets/boo1.png');
        var over = newImg('./assets/over.png');
        //

        var cnt=0;
        planes.update = function()
        {
            if(cnt++%50==0)
            socket.emit("want highscore");

            planes.setBg();
            // 设置小飞机
            planes.setFlivver();
            // 画自己
            planes.setMe();
            // 子弹
            planes.cartridge();

            $('#sbX').html(me.x);
            $('#sbY').html(me.y);
            if(uid==null)
            {
                console.log("no uid");
            }
            else if(!(positionToSend.x==me.x&&positionToSend.y==me.y)){
                socket.emit("move",{x:positionToSend.x,y:positionToSend.y,uid:uid});
            }


            cxt.font = "20px Consolas";
            cxt.strokeText("Score：" + playerScore, 10, 30);

            $('#fjs').html(planeArray.length);
            $('#zds').html(bulletArray.length);
           // $('#scfj').html("1000/" + time2 + " 毫秒");
        };

        /**
         * 设置移动的背景
         */
        planes.setBg = function(){
            planes.counter++;
            if(planes.counter == 800){
                planes.counter = 0;
            }
            // 画布的背景
            cxt.drawImage(img,0,planes.counter,480,800);
            cxt.drawImage(img,0,planes.counter - 800,480,800);
        };

        planes.setFlivver = function()
        {
            for(var a in planeArray)
            {
                if(!planeArray.hasOwnProperty(a))
                {
                    continue;
                }
                planeArray[a].y += planeArray[a].speed;
                // 如果超出屏幕将该小飞机删除
                if(planeArray[a].y > 780){
                    planeArray.splice(a, 1);
                }
                // 将小飞机画到画布上

                // 小飞机死亡
                if(planeArray[a].over > 0)
                {
                    planeArray[a].over --;

                    if(planeArray[a].over > 20){
                        cxt.drawImage(boo1,planeArray[a].x + planeArray[a].width/2 - 20  ,planeArray[a].y + planeArray[a].height / 2 -10,41,39);
                    }else if(planeArray[a].over > 2){
                        cxt.drawImage(over,planeArray[a].x + planeArray[a].width/2 - 20 ,planeArray[a].y + planeArray[a].height / 2 -10,40,43);
                    }else{
                        planeArray.splice(a, 1);
                    }
                }
                else
                {
                    cxt.drawImage(planeArray[a].img,planeArray[a].x,planeArray[a].y,planeArray[a].width,planeArray[a].height);
                    // 判断自己是否死亡
                    if( me.x > (planeArray[a].x - planeArray[a].width + 20) && (me.x) <(planeArray[a].x + planeArray[a].width - 20) && (me.y) < (planeArray[a].y + planeArray[a].height + 20) && (me.y + 72) > (planeArray[a].y - 20)){
                        gameover();
                    }

                    if(planeArray[a].hit > 0){
                        cxt.drawImage(boo1,planeArray[a].x + planeArray[a].width/2 - 20 ,planeArray[a].y + planeArray[a].height / 2 -10,41,39);
                        //cxt.drawImage(boo1,flivver[a].x + 5 ,flivver[a].y,41,39);
                        planeArray[a].hit--;
                    }
                }
            }
        };

        // 更新自己的距离
        planes.setMe = function(){
            cxt.drawImage(meImg,me.x-32,me.y-36,64,72);
            for (var value of playerMap.values()) {
                cxt.drawImage(meImg,value.x-32,value.y-36,64,72);
            }
        };

        // 更新子弹方法
        planes.cartridge = function () {
            for(var i in bulletArray){
                if(!bulletArray.hasOwnProperty(i))
                {
                    continue;
                }
                // 飞到顶部就将OBJ删除掉
                if(bulletArray[i].y < 0){
                    bulletArray.splice(i, 1);
                    continue;
                }


                bulletArray[i].y -= bulletArray[i].speed;
                // 将小飞机画到画布上
                cxt.drawImage(bulletImg,bulletArray[i].x,bulletArray[i].y,7,17);

                // 子弹碰到飞机的情况
                for(var j in planeArray){
                    if(!planeArray.hasOwnProperty(j))
                    {
                        continue;
                    }
                    if(planeArray[j].over > 0){
                        continue;
                    }
                    if(bulletArray[i].x > planeArray[j].x && bulletArray[i].x < planeArray[j].x+ planeArray[j].width && bulletArray[i].y >  planeArray[j].y && bulletArray[i].y -planeArray[j].height < planeArray[j].y){

                        planeArray[j].hit = 10;
                        $('#isdz').html('打中了编号' + j);

                        if(planeArray[j].hp > 1){
                            planeArray[j].hp -= 80;
                        }else{
                            planeArray[j].over = 40;
                            playerScore += 1;
                        }
                        // 子弹消失
                        bulletArray.splice(i, 1);
                        break;
                    }
                }
            }
        };

        // 绑定鼠标事件
        c.addEventListener('mousemove', function onMouseMove(evt) {
            positionToSend.x=evt.layerX;
            positionToSend.y=evt.layerY;
        });

        fps = setInterval(planes.update, 1000 / interval);
    }(cxt)
);


function newImg(src){
	var obj = new Image();
	obj.src = src;
	return obj;
}