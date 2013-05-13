var VK_ENTER = 13;
var VK_ESC = 27;
var VK_PGUP = 33;
var VK_PGDOWN = 34;
var VK_END = 35;
var VK_HOME = 36;
var VK_LEFT = 37;
var VK_UP = 38;
var VK_RIGHT = 39;
var VK_DOWN = 40;
var VK_A = 65;
var VK_D = 68;
var VK_L = 76;
var VK_S = 83;
var VK_W = 87;
var VK_ADD = 107;
var VK_SUB = 109;

function InputManager() {
  this.keyState = [];
  this.keyCurrent = [];
  this.keyLast = [];
  var self = this;

  window.addEventListener('keydown', function(ev) {
    self.keyCurrent[ev.which] = true;
    self.keyState[ev.which] = true;
  });
  window.addEventListener('keyup', function(ev) {
    self.keyState[ev.which] = false;
  });
}

// call this once per run of the game's logic update (render loop)
InputManager.prototype.update = function(){
  this.keyLast = this.keyCurrent;
  this.keyCurrent = this.keyState.slice(0);
};

// test if a key is currently being pressed
InputManager.prototype.isKeyDown = function(key){
  return !!this.keyCurrent[key];
};

// test if a key has been pressed this frame
InputManager.prototype.isKeyTriggered = function(key){
  return !!this.keyCurrent[key] && !this.keyLast[key];
};

// test if a key has been pressed last frame
InputManager.prototype.isKeyReleased = function(key){
  return !this.keyCurrent[key] && !!this.keyLast[key];
};