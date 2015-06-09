/* jshint browser: true, globalstrict: true, devel: true */
/* global io: false */
"use strict";

$( window ).load( function (event) {
    var status = $("#status");
    var open = $("#open");
    var close = $("#close");
    var send = $("#send");
    var text = $("#text");
    var message = $("#message");
    var socket;
    var pamiec = "";
    
    var $nickForm = $('#setNick');
	var $nickError = $('#nickError');
	var $nickBox = $('#nickname');
	var $users = $('#users');
    
    var WIDTH=550, HEIGHT=450, pi=Math.PI;
    var UpArrow=38, DownArrow=40, KeyW = 87, KeyS = 83;
    var canvas, ctx, keystate;
    var player, ai, ball;
    var paused = false, clicked = false, KeyP = "P".charCodeAt(0);
    var count = 0;

    status.text("Brak połącznia");
    close.prop('disabled', true);
    send.prop('disabled', true);

    // Po kliknięciu guzika „Połącz” tworzymy nowe połączenie WS
    open.on('click', function (event) {
        open.prop('disabled', true);
        if (!socket || !socket.connected) {
            socket = io({forceNew: true});
        }
        socket.on('connect', function () {
            close.prop('disabled', false);
            send.prop('disabled', false);
            status.attr('src',"img/bullet_green.png");
            console.log('Nawiązano połączenie przez Socket.io');
            $('#nickWrap').show();
            
        });
        socket.on('disconnect', function () {
            open.prop('disabled', false);
            status.attr('src',"img/bullet_red.png");
            console.log('Połączenie przez Socket.io zostało zakończone');
            $('#nickWrap').hide();
            $('#WriteMessage').hide();
            $('#Login').hide();
            $nickBox.val('');
            $('#newGame').hide();
            $('canvas').hide();
            $('#endGame').hide();
            $('#punctation').hide();
            paused = true;
        });
        socket.on("error", function (err) {
            message.text("Błąd połączenia z serwerem: '" + JSON.stringify(err) + "'");
        });
      $nickForm.submit(function(e){
          
				e.preventDefault();
				socket.emit('new user', $nickBox.val(), function(data){
					if(data){
						$('#nickWrap').hide();
                        $('#WriteMessage').show();
                        $('#Login').show();
						//$('#contentWrap').show();
                        $('#userName').text(data);
                        //$('#message').append(data +" joined to chat" + "<br>");
//                        socket.on('joined', function(data){
//                            $("#message").append(data.msg + "<br>" );
//                        });
                        
                        $('#newGame').show();
					} else{
						$nickError.html('Taki użytkownik już istnieje! Spróbuj ponownie.');
					}
				});
				//$nickBox.val('');
        });
        
        
//        socket.on('usernames', function(data){
//				var html = '';
//				for(var i=0; i < data.length; i++){
//					html += data[i] + '<br/>'
//				}
//				$users.html(html);
//        });
        
        socket.on("echo", function (data) {
            console.log("Received: " + data);
            $("#message").append(data.nick +": " + data.msg + "<br>" );
            // $("#message").each(function(i, input) {
            //     input.value += "jhgjhg";
            //     input.value += "<br>";
            // });
            //pamiec = pamiec + '<b>' + data.nick + ': </b>' + data.msg + "<br/>";
            //data = pamiec;
            //data.parseAsHtml= data + "</br>";
            //message.textContent =  data  ;
            
        });
        
        socket.on("joined", function (username) {
            $("#message").append(username + "<br>" );
        });
    });
    
    // Zamknij połączenie po kliknięciu guzika „Rozłącz”
   close.on('click', function (event) {
        close.prop('disabled', true);
        send.prop('disabled', true);
        open.prop('disabled', true );
        message.text("");
        socket.io.disconnect();
        console.dir(socket);
    });

    // Wyślij komunikat do serwera po naciśnięciu guzika „Wyślij”
    send.on('click', function (event) {
        socket.emit('message', text.val());
        console.log('Wysłałem wiadomość: ' + text.val());
        text.val("");
    });
    
    
        
    
        player = {
            score: 0,
            x: null,
            y: null,
            width: 20,
            height: 80,
            update: function() {
                if (paused) return;
                
                if(keystate[UpArrow]) this.y -= 7;
                if(keystate[DownArrow]) this.y += 7;
                this.y = Math.max(Math.min(this.y, HEIGHT - this.height), 0); //prohibit the paddles to across borders
            },
            
            draw: function(){
                ctx.fillRect(this.x, this.y, this.width, this.height);    
            }
        };
        
        ai = {
            score: 0,
            x: null,
            y: null,
            width: 20,
            height: 100,
            update: function() {
                if (paused) return;
                var destiny = ball.y - (this.height - ball.side)*0.5;
                this.y += (destiny - this.y) * 0.1; //the ai paddle is moving when the ballis bounsed from it
                this.y = Math.max(Math.min(this.y, HEIGHT - this.height), 0);
                
                
//                if (keystate[KeyW]) this.y -= 7;
//                if (keystate[KeyS]) this.y += 7;
//                this.y = Math.max(Math.min(this.y, HEIGHT - this.height), 0);
            },
            
            draw: function(){
                ctx.fillRect(this.x, this.y, this.width, this.height);    
            }
        };
        
        ball = {
            x: null,
            y: null,
            vel: null,
            side: 20,
            speed: 8,
            
            serve: function(side){
                var r = Math.random();
                this.x = side===1 ? player.x+player.width : ai.x - this.side;
                this.y = (HEIGHT - this.side)*r;
                
                var phi = 0.1*pi*(1 - 2*r);
                this.vel = {
                    x: side*this.speed*Math.cos(phi),
                    y: this.speed*Math.sin(phi)
                }
            },
            
            update: function() {
                if (paused) return;
                
                
                this.x += this.vel.x;
                this.y += this.vel.y;
                
                if(0 > this.y || this.y+this.side > HEIGHT){
                    var offset = this.vel.y < 0 ? 0 - this.y : HEIGHT - (this.y+this.side);
                    this.y += 2*offset;
                    this.vel.y *= -1;    
                }
                
                var boardBorder = function(ax, ay, aw, ah, bx, by, bw, bh){
                    return ax < bx+bw && ay < by+bh && bx < ax+aw && by < ay+ah;  
                };
                
                var paddle = this.vel.x < 0 ? player : ai;
                if(boardBorder(paddle.x, paddle.y, paddle.width, paddle.height, this.x, this.y, this.side, this.side)){
                    //this.vel.x *= -1;
                    this.x = paddle===player ? player.x+player.width : ai.x - this.side;
                    var n = (this.y+this.side - paddle.y)/(paddle.height+this.side);
                    var phi = 0.25*pi*(2*n - 1);
                    
                    var smash = Math.abs(phi) > 0.1*pi ? 1.5 : 1;
                    this.vel.x = smash*(paddle===player ? 1 : -1)*this.speed*Math.cos(phi);
                    this.vel.y = smash*this.speed*Math.sin(phi);
                }
                
                if(0 > this.x+this.side || this.x > WIDTH){
                    this.serve(paddle===player ? 1 : -1);
                    if(paddle===player){
                        ai.score++;
                    }
                    else{
                        player.score++;    
                    }
                    document.getElementById("punctation").innerHTML = 'Player1 - '+player.score+' Player2 - '+ai.score;
                    
                    if(player.score == 11){
                        paused = true;
                        document.getElementById("punctation").innerHTML = "Wygrana!!! ;)"
                    }
                    else if(ai.score == 11){
                        paused = true;
                        document.getElementById("punctation").innerHTML = "Porażka ;("
                    }
                }
                
            },
            
            draw: function(){
                ctx.fillRect(this.x, this.y, this.side, this.side);    
            }
        };
        
        function main(){
            canvas= document.createElement("canvas");
            canvas.width = WIDTH;
            canvas.height = HEIGHT;
            ctx = canvas.getContext("2d");
            document.body.appendChild(canvas);
            
            keystate = {};
            document.addEventListener("keydown", function(evt) {
                keystate[evt.keyCode] = true;
            });
            
            document.addEventListener("keyup", function(evt) {
                delete keystate[evt.keyCode];
                
            });
            
            init();
            
            var loop = function(){
                
                update();
                draw(); 
                
                window.requestAnimationFrame(loop, canvas);
                
            };
            window.requestAnimationFrame(loop, canvas);
//            document.getElementById("scoreP1").innerHTML = player.score;
//            document.getElementById("scoreP2").innerHTML = ai.score;
                   
        }
        
        function init(){
            
            player.x = player.width;
            player.y = (HEIGHT - player.height)/2;
            
            ai.x = WIDTH - (player.width + ai.width);
            ai.y = (HEIGHT - ai.height)/2;
            
            ball.serve(1);
        }
        
        function update(){
            ball.update();
            player.update();
            ai.update();
        }
        
        function draw(){
            ctx.fillRect(0, 0, WIDTH, HEIGHT);
            ctx.save();
            ctx.fillStyle = "#fff";
            ball.draw();
            player.draw();
            ai.draw();
            // draw the net
            var w = 4;
            var x = (WIDTH - w)*0.5;
            var y = 0;
            var step = HEIGHT/20; // how many net segments
            while (y < HEIGHT) {
                ctx.fillRect(x, y+step*0.25, w, step*0.5);
                y += step;
            }
            ctx.restore();
        }
    
        var newGame = $("#newGame");//document.getElementById("newGame");
        var endGame = $("#endGame");//document.getElementById("endGame");
        
        newGame.on("click", function (event) {
            //document.getElementById("newGame").style.visibility = "collapse";
            $('#newGame').hide();
//            document.getElementById("endGame").style.visibility = "visible";
//            endGame.disabled = false;
            $('#endGame').show();
            $('#punctation').show();
            player.score = 0;
            ai.score = 0;
            ball.x = 100;
            ball.y = 100;
            player.x = player.width;
            player.y = (HEIGHT - player.height)/2;
            
            ai.x = WIDTH - (player.width + ai.width);
            ai.y = (HEIGHT - ai.height)/2;
            document.getElementById("punctation").innerHTML = 'Player1 - '+player.score+' Player2 - '+ai.score;
            if(count == 0){
                main();    
            }
            else{
                $('canvas').show();        
            }
            count++;
            paused = false;
        });
        
        endGame.on("click", function (event) {
            //document.getElementById("newGame").style.visibility = "visible";
            $('#newGame').show();
            //location.reload();
            $('canvas').hide();
            $('#endGame').hide();
            $('#punctation').hide();
            paused = true;
            
        });
    
});


//window.addEventListener("load", function (event) {
//        var WIDTH=700, HEIGHT=600, pi=Math.PI;
//        var UpArrow=38, DownArrow=40, KeyW = 87, KeyS = 83;
//        var canvas, ctx, keystate;
//        var player, ai, ball;
//        var paused = false, clicked = false, KeyP = "P".charCodeAt(0);
//    
//        player = {
//            score: 0,
//            x: null,
//            y: null,
//            width: 20,
//            height: 100,
//            update: function() {
//                if (paused) return;
//                
//                if(keystate[UpArrow]) this.y -= 7;
//                if(keystate[DownArrow]) this.y += 7;
//                this.y = Math.max(Math.min(this.y, HEIGHT - this.height), 0); //prohibit the paddles to across borders
//            },
//            
//            draw: function(){
//                ctx.fillRect(this.x, this.y, this.width, this.height);    
//            }
//        };
//        
//        ai = {
//            score: 0,
//            x: null,
//            y: null,
//            width: 20,
//            height: 100,
//            update: function() {
////                var destiny = ball.y - (this.height - ball.side)*0.5;
////                this.y += (destiny - this.y) * 0.1; //the ai paddle is moving when the ballis bounsed from it
////                this.y = Math.max(Math.min(this.y, HEIGHT - this.height), 0);
//                if (paused) return;
//                
//                if (keystate[KeyW]) this.y -= 7;
//                if (keystate[KeyS]) this.y += 7;
//                this.y = Math.max(Math.min(this.y, HEIGHT - this.height), 0);
//            },
//            
//            draw: function(){
//                ctx.fillRect(this.x, this.y, this.width, this.height);    
//            }
//        };
//        
//        ball = {
//            x: null,
//            y: null,
//            vel: null,
//            side: 20,
//            speed: 8,
//            
//            serve: function(side){
//                var r = Math.random();
//                this.x = side===1 ? player.x+player.width : ai.x - this.side;
//                this.y = (HEIGHT - this.side)*r;
//                
//                var phi = 0.1*pi*(1 - 2*r);
//                this.vel = {
//                    x: side*this.speed*Math.cos(phi),
//                    y: this.speed*Math.sin(phi)
//                }
//            },
//            
//            update: function() {
//                if (paused) return;
//                
//                this.speed = 8;
//                this.x += this.vel.x;
//                this.y += this.vel.y;
//                
//                if(0 > this.y || this.y+this.side > HEIGHT){
//                    var offset = this.vel.y < 0 ? 0 - this.y : HEIGHT - (this.y+this.side);
//                    this.y += 2*offset;
//                    this.vel.y *= -1;    
//                }
//                
//                var boardBorder = function(ax, ay, aw, ah, bx, by, bw, bh){
//                    return ax < bx+bw && ay < by+bh && bx < ax+aw && by < ay+ah;  
//                };
//                
//                var paddle = this.vel.x < 0 ? player : ai;
//                if(boardBorder(paddle.x, paddle.y, paddle.width, paddle.height, this.x, this.y, this.side, this.side)){
//                    //this.vel.x *= -1;
//                    this.x = paddle===player ? player.x+player.width : ai.x - this.side;
//                    var n = (this.y+this.side - paddle.y)/(paddle.height+this.side);
//                    var phi = 0.25*pi*(2*n - 1);
//                    
//                    var smash = Math.abs(phi) > 0.1*pi ? 1.5 : 1;
//                    this.vel.x = smash*(paddle===player ? 1 : -1)*this.speed*Math.cos(phi);
//                    this.vel.y = smash*this.speed*Math.sin(phi);
//                }
//                
//                if(0 > this.x+this.side || this.x > WIDTH){
//                    this.serve(paddle===player ? 1 : -1);
//                    if(paddle===player){
//                        ai.score++;
//                    }
//                    else{
//                        player.score++;    
//                    }
//                    document.getElementById("punctation").innerHTML = 'Player1 - '+player.score+' Player2 - '+ai.score;
//                    
//                    if(player.score == 11){
//                        paused = true;
//                        document.getElementById("punctation").innerHTML = "Wygrał gracz 1"
//                    }
//                    else if(ai.score == 11){
//                        paused = true;
//                        document.getElementById("punctation").innerHTML = "Wygrał gracz 2"
//                    }
//                }
//                
//            },
//            
//            draw: function(){
//                ctx.fillRect(this.x, this.y, this.side, this.side);    
//            }
//        };
//        
//        function main(){
//            canvas= document.createElement("canvas");
//            canvas.width = WIDTH;
//            canvas.height = HEIGHT;
//            ctx = canvas.getContext("2d");
//            document.body.appendChild(canvas);
//            
//            keystate = {};
//            document.addEventListener("keydown", function(evt) {
//                keystate[evt.keyCode] = true;
//            });
//            
//            document.addEventListener("keyup", function(evt) {
//                delete keystate[evt.keyCode];
//                
//            });
//            
//            init();
//            
//            var loop = function(){
//                
//                update();
//                draw(); 
//                
//                window.requestAnimationFrame(loop, canvas);
//                
//            };
//            window.requestAnimationFrame(loop, canvas);
////            document.getElementById("scoreP1").innerHTML = player.score;
////            document.getElementById("scoreP2").innerHTML = ai.score;
//                   
//        }
//        
//        function init(){
//            
//            player.x = player.width;
//            player.y = (HEIGHT - player.height)/2;
//            
//            ai.x = WIDTH - (player.width + ai.width);
//            ai.y = (HEIGHT - ai.height)/2;
//            
//            ball.serve(1);
//        }
//        
//        function update(){
//            ball.update();
//            player.update();
//            ai.update();
//        }
//        
//        function draw(){
//            ctx.fillRect(0, 0, WIDTH, HEIGHT);
//            ctx.save();
//            ctx.fillStyle = "#fff";
//            ball.draw();
//            player.draw();
//            ai.draw();
//            // draw the net
//            var w = 4;
//            var x = (WIDTH - w)*0.5;
//            var y = 0;
//            var step = HEIGHT/20; // how many net segments
//            while (y < HEIGHT) {
//                ctx.fillRect(x, y+step*0.25, w, step*0.5);
//                y += step;
//            }
//            ctx.restore();
//        }
//    
//        var newGame = document.getElementById("newGame");
//        var endGame = document.getElementById("endGame");
//        
//        newGame.addEventListener("click", function (event) {
//            document.getElementById("newGame").style.visibility = "collapse";
//            document.getElementById("endGame").style.visibility = "visible";
//            endGame.disabled = false;
//            main();
//        });
//        
//        endGame.addEventListener("click", function (event) {
//            document.getElementById("newGame").style.visibility = "visible";
//            location.reload();
//            
//        });
//    
//});    

// Inicjalizacja
//window.addEventListener("load", function (event) {
//    var status = document.getElementById("status");
//    var open = document.getElementById("open");
//    var close = document.getElementById("close");
//    var send = document.getElementById("send");
//    var text = document.getElementById("text");
//    var message = document.getElementById("message");
//    var socket;
//
//    status.textContent = "Brak połącznia";
//    close.disabled = true;
//    send.disabled = true;
//
//    // Po kliknięciu guzika „Połącz” tworzymy nowe połączenie WS
//    open.addEventListener("click", function (event) {
//        open.disabled = true;
//        if (!socket || !socket.connected) {
//            socket = io({forceNew: true});
//        }
//        socket.on('connect', function () {
//            close.disabled = false;
//            send.disabled = false;
//            status.src = "img/bullet_green.png";
//            console.log('Nawiązano połączenie przez Socket.io');
//        });
//        socket.on('disconnect', function () {
//            open.disabled = false;
//            status.src = "img/bullet_red.png";
//            console.log('Połączenie przez Socket.io zostało zakończone');
//        });
//        socket.on("error", function (err) {
//            message.textContent = "Błąd połączenia z serwerem: '" + JSON.stringify(err) + "'";
//        });
//        socket.on("echo", function (data) {
//            message.textContent = "Serwer twierdzi, że otrzymał od Ciebie: '" + data + "'";
//        });
//    });
//    
//    // Zamknij połączenie po kliknięciu guzika „Rozłącz”
//    close.addEventListener("click", function (event) {
//        close.disabled = true;
//        send.disabled = true;
//        open.disabled = false;
//        message.textContent = "";
//        socket.io.disconnect();
//        console.dir(socket);
//    });
//
//    // Wyślij komunikat do serwera po naciśnięciu guzika „Wyślij”
//    send.addEventListener("click", function (event) {
//        socket.emit('message', text.value);
//        console.log('Wysłałem wiadomość: ' + text.value);
//        text.value = "";
//    });
//});
