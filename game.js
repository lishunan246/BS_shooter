// JavaScript Document
var socket = io.connect('http://localhost:8000');
var uid;

socket.on('getUid', function (data) {
    console.log(data);
    uid=data.id;
    //socket.emit('my other event', { my: 'data' });
});


socket.on('p2 move', function (data) {
    console.log(data);

    //socket.emit('my other event', { my: 'data' });
});

var c = document.getElementById("canvas");
var cxt = c.getContext("2d");
var img = newImg("./assets/bg_01.jpg");
var fps;
cxt.drawImage(img,0,0,480,800);

var flivverLog = 0;
var flivver1 = newImg("./assets/flivver.png");
var flivver2 = newImg("./assets/flivver2.png");
var flivver3 = newImg("./assets/flivver3.png");

// 用于记录游戏的时间，越到后面越快
var time1 = 0;
var time2 = 80;

// 积分
var jifen = 0;

function getSudu(){
	var number = parseInt(Math.random()*10);
	if(number < 5 && number > 0){
		return number;
	}
	return 1;
}
// 飞机的对象
function FlivverObj(hp,ewidth,eheight,eimg,esudu){
	// 随机的X
	this.x = parseInt(Math.random()*460+1);
	this.y = 0;
	// 血量
	this.hp = hp;
	// 挨打	
	this.hit = 0;
	// 是否死亡
	this.over = 0;
	
	this.width = ewidth;
	this.height = eheight;
	this.img = eimg;
	this.sudu = esudu;
}

// 获取飞机
function getFlivver(type){
	switch(type){
		case 1:
			return new FlivverObj(100,50,30,flivver1,getSudu());
		case 2:
			return new FlivverObj(500,70,90,flivver2,getSudu());
		case 3:
			return new FlivverObj(1000,110,170,flivver3,getSudu());
	}
}
function Cartridge(x,y){
	this.x = x;
	this.y = y;	
}

function gameover(){
	window.clearTimeout(fps);
	//$('#dotu').fadeOut();
	$('.content').css('position','relative')
        .append('<span style="position:absolute; top:5px; left:2px; font-size:150px; color:#cc0000;  text-align:center" id="sil"></span>');
	$('#sil').html('你').hide().fadeIn(1000,function(){
		$(this).html('你屎').hide().fadeIn(1000,function(){
			$(this).html('<a href="javascript:location.reload();" style="color:#cc0000" title="重新开始">你屎了</a><br>' + jifen  + ' 分').hide().fadeIn();
		});	
	});
}

(
	function(cxt)
    {
        var planes = {nums:0};
        // 用于存放小飞机
        var flivver = [];

        // 自己
        var me = {x:240,y:750};
        var meImg = newImg('assets/me.png');
        // 子弹
        var cartridges = [];
        var cartridgeImg = newImg('./assets/cartridge.png');

        var boo1 = newImg('./assets/boo1.png');
        var over = newImg('./assets/over.png');
        //
        planes.update = function(){

            planes.setTimes();
            // 设置背景
            planes.setBg();
            // 设置小飞机
            planes.setFlivver();
            // 画自己
            planes.setMe();
            // 子弹
            planes.cartridge();


            cxt.font = "italic 20px 微软雅黑";
            cxt.strokeText("积分：" + jifen, 10, 30);

            $('#fjs').html(flivver.length);
            $('#zds').html(cartridges.length);
            $('#scfj').html("1000/" + time2 + " 毫秒");
        };

        planes.setTimes = function(){
            time1++ ;
            // 100 秒 1个档位
            if(time1 == 1000){
                time1 = 0;
                time2 = (time2 == 20) ? 20 : time2 - 20;
            }

        };


        /**
         * 设置移动的背景
         */
        planes.setBg = function(){
            planes.nums++;
            if(planes.nums == 800){
                planes.nums = 0;
            }
            // 画布的背景
            cxt.drawImage(img,0,planes.nums,480,800);
            cxt.drawImage(img,0,planes.nums - 800,480,800);
        };

        planes.setFlivver = function(){
            // 生成飞机
            if(planes.nums % time2 == 0){
                flivverLog++;
                if(flivverLog % 6 == 0){
                    flivver.push(getFlivver(2));
                }else if(flivverLog % 13 == 0){
                    flivver.push(getFlivver(3));
                }else{
                    flivver.push(getFlivver(1));
                }

            }

            for(var a in flivver){



                flivver[a].y += flivver[a].sudu;
                // 如果超出屏幕将该小飞机删除
                if(flivver[a].y > 780){
                    flivver.splice(a, 1);
                }
                // 将小飞机画到画布上


                // 小飞机死亡
                if(flivver[a].over > 0){
                    flivver[a].over --;

                    if(flivver[a].over > 20){
                        cxt.drawImage(boo1,flivver[a].x + flivver[a].width/2 - 20  ,flivver[a].y + flivver[a].height / 2 -10,41,39);
                    }else if(flivver[a].over > 2){
                        cxt.drawImage(over,flivver[a].x + flivver[a].width/2 - 20 ,flivver[a].y + flivver[a].height / 2 -10,40,43);
                    }else{
                        flivver.splice(a, 1);
                    }



                }else{
                    cxt.drawImage(flivver[a].img,flivver[a].x,flivver[a].y,flivver[a].width,flivver[a].height);
                    // 判断自己是否死亡
                    if( me.x > (flivver[a].x - flivver[a].width + 20) && (me.x) <(flivver[a].x + flivver[a].width - 20) && (me.y) < (flivver[a].y + flivver[a].height + 20) && (me.y + 72) > (flivver[a].y - 20)){
                        gameover();
                    }

                    if(flivver[a].hit > 0){
                        cxt.drawImage(boo1,flivver[a].x + flivver[a].width/2 - 20 ,flivver[a].y + flivver[a].height / 2 -10,41,39);
                        //cxt.drawImage(boo1,flivver[a].x + 5 ,flivver[a].y,41,39);
                        flivver[a].hit--;
                    }
                }

            }
        };

        // 更新自己的距离
        planes.setMe = function(){
            cxt.drawImage(meImg,me.x,me.y,64,72);
        };

        // 更新子弹方法
        planes.cartridge = function(){
            if(planes.nums % 10 == 0){
                cartridges.push(new Cartridge(me.x + 30,me.y));
            }

            for(i in cartridges){
                // 飞到顶部就将OBJ删除掉
                if(cartridges[i].y < 0){
                    cartridges.splice(i, 1);
                    continue;
                }


                cartridges[i].y -= 20;
                // 将小飞机画到画布上
                cxt.drawImage(cartridgeImg,cartridges[i].x,cartridges[i].y,7,17);

                // 子弹碰到飞机的情况
                for(j in flivver){
                    if(flivver[j].over > 0){
                        continue;
                    }
                    if(cartridges[i].x > flivver[j].x && cartridges[i].x < flivver[j].x+ flivver[j].width && cartridges[i].y >  flivver[j].y && cartridges[i].y -flivver[j].height < flivver[j].y){

                        flivver[j].hit = 10;
                        $('#isdz').html('打中了编号' + j);

                        if(flivver[j].hp > 1){
                            flivver[j].hp -= 80;
                        }else{
                            flivver[j].over = 40;
                            jifen += 50000;
                        }
                        // 子弹消失
                        cartridges.splice(i, 1);
                        break;
                    }
                }
            }
        };

        // 绑定鼠标事件
        c.addEventListener('mousemove', function onMouseMove(evt) {
            me.x=evt.layerX;
            //me.x = evt.layerX - $('#canvas').offset().left - 32;
            me.y = evt.layerY -  36 ;
            $('#sbX').html(me.x);
            $('#sbY').html(me.y);
            socket.emit("move",{x:me.x,y:me.y,uid:uid});
        });

        fps = setInterval(planes.update, 1000/100);
    }(cxt)
);


function newImg(src){
	var obj = new Image();
	obj.src = src;
	return obj;
}

//setInterval(h.update, 1000/65); 