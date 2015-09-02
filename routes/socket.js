var IO = null;
var DB = null;

var moves = {};

var join = function(gameID) {

  var sess      = this.handshake.session;
  var debugInfo = {
    socketID : this.id,
    event    : 'join',
    gameID   : gameID,
    session  : sess
  };

  
  if (gameID !== sess.gameID) {
    console.log('ERROR: Access Denied', debugInfo);
    this.emit('error', {message: "You cannot join this game"});
    return;
  }

  
  var game = DB.find(gameID);
  if (!game) {
    console.log('ERROR: Game Not Found', debugInfo);
    this.emit('error', {message: "Game not found"});
    return;
  }

  
  var result = game.addPlayer(sess);
  if (!result) {
    console.log('ERROR: Failed to Add Player', debugInfo);
    this.emit('error', {message: "Unable to join game"});
    return;
  }

  
  this.join(gameID);

 
  IO.sockets.in(gameID).emit('update', game);

  console.log(sess.playerName+' joined '+gameID);
};


var move = function(data) {

  var sess      = this.handshake.session;
  var debugInfo = {
    socketID : this.id,
    event    : 'move',
    gameID   : data.gameID,
    move     : data.move,
    session  : sess
  };

 
  if (data.gameID !== sess.gameID) {
    console.log('ERROR: Access Denied', debugInfo);
    this.emit('error', {message: "You have not joined this game"});
    return;
  }

 
  var game = DB.find(data.gameID);
  if (!game) {
    console.log('ERROR: Game Not Found', debugInfo);
    this.emit('error', {message: "Game not found"});
    return;
  }

  
  var result = game.move(data.move);
  if (!result) {
    console.log('ERROR: Failed to Apply Move', debugInfo);
    this.emit('error', {message: "Invalid move, please try again"});
    return;
  }

 
  IO.sockets.in(data.gameID).emit('update', game);

  console.log('Cos ' + data.gameID+' '+sess.playerName+': '+data.move);
  var currentdate = new Date();
  var datetime = '[ ' + (currentdate.getHours() < 10 ? '0' + currentdate.getHours() : currentdate.getHours())
                    + ':' +
                    (currentdate.getMinutes() < 10 ? '0' + currentdate.getMinutes() : currentdate.getMinutes()) + ' ]';   
    
  //this.emit('ruch', data.move);
  if (!moves[data.gameID]) {
    moves[data.gameID] = [];
  }
  
  var movements = data.move;    
  var colorSign = movements.substring(0,1);
  var color = null;
  if(colorSign === 'w'){
    color = 'Biały';      
  }
  else{
    color = 'Czarny'    
  }
 
  var pawn = movements.substring(1,2);
  var startAndDestination = movements.substring(2,7)    
    
  moves[data.gameID].push('<br />' + '   ' + color + ' - ' + pawn + ' - {' + startAndDestination +'} - '+ datetime);
/*  moves[data.gameID].push(datetime);    
  moves[data.gameID].push('<br />');  */  
  IO.sockets.in(data.gameID).emit('ruchy', moves[data.gameID] );
};


var forfeit = function(gameID) {

  var sess      = this.handshake.session;
  var debugInfo = {
    socketID : this.id,
    event    : 'forfeit',
    gameID   : gameID,
    session  : sess
  };

  
  if (gameID !== sess.gameID) {
    console.log('ERROR: Access Denied', debugInfo);
    this.emit('error', {message: "You have not joined this game"});
    return;
  }

  
  var game = DB.find(gameID);
  if (!game) {
    console.log('ERROR: Game Not Found', debugInfo);
    this.emit('error', {message: "Game not found"});
    return;
  }

  
  var result = game.forfeit(sess);
  if (!result) {
    console.log('ERROR: Failed to Forfeit', debugInfo);
    this.emit('error', {message: "Failed to forfeit game"});
    return;
  }


  IO.sockets.in(gameID).emit('update', game);

  console.log(gameID+' '+sess.playerName+': Forfeit');
};


var disconnect = function() {

  var sess      = this.handshake.session;
  var debugInfo = {
    socketID : this.id,
    event    : 'disconnect',
    session  : sess
  };

  
  var game = DB.find(sess.gameID);
  if (!game) {
    console.log('ERROR: Game Not Found', debugInfo);
    return;
  }

  
  var result = game.removePlayer(sess);
  if (!result) {
    console.log('ERROR: '+sess.playerName+' failed to leave '+sess.gameID);
    return;
  }

  console.log(sess.playerName+' left '+sess.gameID);
  console.log('Socket '+this.id+' disconnected');
};


exports.attach = function(io, db) {
  IO = io;
  DB = db;

 
  io.sockets.on('connection', function (socket) {

    // Attach the event handlers
    socket.on('join', join);
    socket.on('move', move);
            
    socket.on('forfeit', forfeit);
    socket.on('disconnect', disconnect);

    console.log('Socket '+socket.id+' connected');
    console.log('Ruch' + this.move );  

  });
};
