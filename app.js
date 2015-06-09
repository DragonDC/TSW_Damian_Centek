///* jshint node: true */
//var app = require("express")();
//var httpServer = require("http").Server(app);
//var io = require("socket.io")(httpServer);
//
//var static = require('serve-static');
//var port = process.env.PORT || 3000;
//
//var oneDay = 86400000;
//
//app.use('/img', static(__dirname + '/public/img', { maxAge: oneDay }));
//app.use('/js/jquery.min.js', static(__dirname + '/bower_components/jquery/dist/jquery.min.js'));
//app.use('/js/jquery.min.map', static(__dirname + '/bower_components/jquery/dist/jquery.min.map'));
//app.use(static(__dirname + '/public'));
//
//io.sockets.on("connection", function (socket) {
//    socket.on("message", function (data) {
//        io.sockets.emit("echo", "No tak, tak – dostałem: " + data);
//    });
//    socket.on("error", function (err) {
//        console.dir(err);
//    });
//});
//
//httpServer.listen(port, function () {
//    console.log('Serwer HTTP działa na porcie ' + port);
//});

/* jshint node: true */
var app = require("express")();
var httpServer = require("http").Server(app);
var io = require("socket.io")(httpServer);
nicknames = [];

var static = require('serve-static');
var port = process.env.PORT || 3000;

// Passport.js
//var passport = require('passport');
//var passportLocal = require('passport-local');
//var passportHttp = require('passport-http');

//"Skrypt inicjalizacyjny" 
//w katalogu głównym projektu:
//bin/skrypt.js
//package.json:
//
//"scripts": {
//    "init": "node ./bin/skrypt.js"
//    "initdb": "node ./bin/skrypt2.js"
//}
//
//npm run init
//npm run initdb

var oneDay = 86400000;

app.use('/img', static(__dirname + '/public/img', { maxAge: oneDay }));
app.use('/js/jquery.min.js', static(__dirname + '/bower_components/jquery/dist/jquery.min.js'));
app.use('/js/jquery.min.map', static(__dirname + '/bower_components/jquery/dist/jquery.min.map'));
app.use(static(__dirname + '/public'));

io.sockets.on("connection", function (socket) {
    socket.on('new user', function(data, callback){
		if (nicknames.indexOf(data) != -1){
			callback(false);
		} else{
			callback(data);
			socket.nickname = data;
            socket.room = 'room1';
            socket.join('room1');
			nicknames.push(socket.nickname);
			updateNicknames();
            socket.broadcast.to('room1').emit('joined', data + ' dołączył do czatu');
            //sendMessageAboutNewUser();
		}
	});
    
//    function sendMessageAboutNewUser(){
//        socket.on("nickname", function (data) {
//           io.sockets.emit("joined", {msg: socket.nickname + ' join to chat'});
//        });     
//    }
    
    // Używamy Passport.js
//    app.use(passport.initialize());
//    app.use(passport.session());
//    // Konfiguracja Passport.js
//    var validateUser = function (username, password, done){
//    //zmienić tą funkcję
//        User.findOne({username: username}, function (err, user) {
//            if (err) {
//                done(err);
//            }
//                if (user) {
////                if (user.password === HASH(password)) {
//                if (user.password === password) {
//                    done(null, user);
//                } else {
//                    done(null, null);
//                }
//            } else {
//                done(null, null);
//            }
//        });
//    };
//    passport.use(new passportLocal.Strategy(validateUser));
//    passport.use(new passportHttp.BasicStrategy(validateUser));
    
    
    
    
    
    function updateNicknames(){
		io.sockets.emit('usernames', nicknames);
	}
    
    socket.on("message", function (data) {
    	console.log(data)
        io.sockets.emit("echo",  {msg: data, nick: socket.nickname});
    });
    socket.on("error", function (err) {
        console.dir(err);
    });
    socket.on('disconnect', function(data){
		if(!socket.nickname) return;
        socket.broadcast.emit('joined', socket.nickname + ' opuścił czat');
		//nicknames.splice(nicknames.indexOf(socket.nickname), 1);
        delete nicknames[socket.nickname];
		updateNicknames();
        
        socket.leave(socket.room);
	});
    
});

httpServer.listen(port, function () {
    console.log('Serwer HTTP działa na porcie ' + port);
});