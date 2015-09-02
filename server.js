var path         = require('path')
  , express      = require('express')
  , http         = require('http')
  , socket       = require("socket.io")
  , httpRoutes   = require('./routes/http')
  , socketRoutes = require('./routes/socket')
  , GameStore    = require('./lib/GameStore');


var app    = express()
  , server = http.createServer(app)
  , io     = socket.listen(server);

var DB = new GameStore();
var people = {};
var cookieParser = express.cookieParser('Cookie')
  , sessionStore = new express.session.MemoryStore();


app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.engine('jade', require('jade').__express);


app.use(express.favicon(__dirname + '/public/img/favicon.ico'));
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(cookieParser);
app.use(express.session({ store: sessionStore }));
app.use(express.static(__dirname + '/public'));
app.use(app.router);
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}


io.set('authorization', function (handshakeData, callback) {
  cookieParser(handshakeData, {}, function(err) {
    if (err) return callback(err);
    sessionStore.load(handshakeData.signedCookies['connect.sid'], function(err, session) {
      if (err) return callback(err);
      handshakeData.session = session;
      var authorized = (handshakeData.session) ? true : false;
      callback(null, authorized);
    });
  });
});


httpRoutes.attach(app, DB);
socketRoutes.attach(io, DB);

app.get('/', function (req, res) {
	res.sendfile(__dirname + '/views/home.jade');
});

io.sockets.on('connection', function (socket) {
	
	socket.emit('chat', { hour: new Date(), text: 'Witaj w grze ChessTitans. Rozmawiaj z innymi i wklejaj ID stołów' });
	
	socket.on('chat', function (data) {
		io.sockets.emit('chat', { hour: new Date(), name: data.name || 'Anonim', text: data.text });
	});
});


server.listen(app.get('port'), function(){
  console.log('Chess is listening on port ' + app.get('port'));
});
