var Game = require('./Game');

function GameStore() {
  this.games = {};

  
  setInterval(function(games) {
    for (key in games) {
      if (Date.now() - games[key].modifiedOn > (12 * 60 * 60 * 1000)) {
        console.log("Deleting game " + key + ". No activity for atleast 12 hours.");
        delete games[key];
      }
    }
  }, (1 * 60 * 60 * 1000), this.games);
};

GameStore.prototype.add = function(gameParams) {
  var key       = '';
  var keyLength = 4;
  var chars     = 'abcdefghijklmnopqrstuvwxyz0123456789';

  
  do {
    for (var i=0; i<keyLength; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    };
  } while (this.games.hasOwnProperty(key))

 
  this.games[key] = new Game(gameParams);

  return key;
};

GameStore.prototype.remove = function(key) {
  if (this.games.hasOwnProperty(key)) {
    delete this.games[key];
    return true;
  } else {
    return false;
  }
};

GameStore.prototype.find = function(key) {
  return (this.games.hasOwnProperty(key)) ? this.games[key] : false ;
};

module.exports = GameStore;
