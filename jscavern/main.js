/**
 * @license Copyright © 2023 Stewart J. Robinson (AKA StewVed, Ved)
 * To show your appreciation of my work, feel free to talk about, and link to my website(s)
 * If you wish to copy/use code from [any part of] my website(s), please contact me. Thankyou.
*/

/*
  -- GOOGLE CLOSURE STUFF --

cd "C:\Users\StewVed\Google Drive\Website stuff\webtop\jscavern"

java -jar closure-compiler-v20190909.jar --js_output_file 191010.js --compilation_level ADVANCED_OPTIMIZATIONS --js main.js

for CSS:
java -jar closure-stylesheets-150.jar --allowed-unrecognized-property user-select style.css > out.css

*/

var
  zAudios = [
    'Heart'
  , 'Diamond'
  , 'Jetpack'
  , 'Death'
  ]
, jsCavernSprite = -1
, mainScript
, gameMenu
, initWidth = 896
, initHeight = 486
, gameVars = {
    menuMove: 0
  , Loading: -1
  , EvilTemp: []
  , Evil: []
  , paused: 1
  , Hearts: -1
  , gameSpeed: 58
  , blockSize: 16
  , Scale: 1.0
  , CLevel: []
  , LiftMap: []
  , EvilMap: []
  , BoatMap: []
  , deathKeys: []
  , Bod: []
  , JetPack: {
      On:0
    , Left:0
    , Top:0
    , Image:0
    }
  , Start: {
    JetPack: {
      On:0
    , Left:0
    , Top:0
    , Image:0
    }
  }
  , tickTimer: 0
  , aVolume: 0.5
}
;


//cancel fullscreen:
var killFS = (document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen)
//kick up fullscreen:
, getFS = (document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen || document.documentElement.msRequestFullscreen)
/*
 * Keys to ignore... alt-tab is annoying, so don't bother with alt for example
 * 16 = shift
 * 17 = Ctrl
 * 18 = Alt (and 17 if altGr)
 * 91 = windows key
 * 116 = F5 - browser refresh
 * 122 = F11 - Full Screen Toggle
 * 123 = F12 - Dev tools.
*/
, keysIgnore = [0, 16, 17, 18, 91, 116, 122, 123]
/*
  left,up,right,down,A,B,X,Y you can add more should your game require it.
*/
, keysDefault = {100:0, 101:1, 97:2, 98:3}
/*
  the currently used keys are loaded on init
*/
, keysCurrent = null
//Input events vars to hold the event info:
, inputType = null
//touch|gamePad|mouse|keyboard - depending on game type you could add GPS or whatever else HTML supports...
//Mouse:
, mouseVars = []
, scrollVars = []
//For touch-enabled devices
, touchVars = []
//Gamepad:
, gamePadVars = []
, gamepadReMap = [2, 3, 0, 1]
//keyboard:
, keyVars = []
, zAppPrefix = 'JSCavern'
, LS1 = '@'
, LS2 = '#'
, LS3 = '~'
, LS4 = '^'
, saveY = 0 //whether the user allows saving to HTML5 local storage

, audioSprite = null //prolly need this to be an array eventually!
, audioCtx = null //must create the audioContext later. Thx google!
, audioVolume = null
, globVol = 1 //the volume in the game. keep even if muted.
, isMuted = -1 //if the user mutes the audio, have that here. also use for furst user input.

, isUpdating = ''
;



window['init'] = function() {
  //load the CSS stylesheet into the HTML head
  loadCSS();
  //Add event listeners to the game element
  addEventListeners();
  //initialize the mouse event
  mouseClear();
  //initialize the scroll vars
  scrollClear();


  //make a non-linked shallow copy of the following arrays so they can be manipulated:
  //if this method doesn't work, I'll have to devise a looping math.floor version or something!
  //cant use JSON stringyfy cos the data are numbers, and array.slice(0) only works on single dimention arrays.
  gameVars.LiftMap = loadArray(jscLift);
  gameVars.EvilMap = loadArray(jscEvil);
  gameVars.BoatMap = loadArray(jscBoat);
  /*
  these two are now done only in reset:
  gameVars.DiamondMap = loadArray(jscDiamondMap);
  gameVars.HeartMap = loadArray(jscHeartMap);
  */
  //close button add window.clearTimeout(gameVars.tickTimer);
 /*
  gameVars['aHeart'].src = 'audio/Heart.mp3';
  gameVars['aHeart'].src = 'audio/Heart.ogg';
  gameVars['aDiamond'].src = 'audio/Diamond.mp3';
  gameVars['aDiamond'].src = 'audio/Diamond.ogg';
  gameVars['aJet1'].src = 'audio/Jetpack.mp3';
  gameVars['aJet1'].src = 'audio/Jetpack.ogg';
  gameVars['aDeath'].src = 'audio/Death.mp3';
  gameVars['aDeath'].src = 'audio/Death.ogg';

  gameVars['aHeart'].volume = gameVars.aVolume;
  gameVars['aDiamond'].volume = gameVars.aVolume;
  gameVars['aJet1'].volume = gameVars.aVolume;
  gameVars['aDeath'].volume = gameVars.aVolume;
  */

  // Create the current level array
  var x, y;
  for (y = 0; y < 28; y++) {
    gameVars.CLevel[y] = [];
    for (x = 0; x < 56; x++) {
      gameVars.CLevel[y][x] = [];
    }
  }
  // Create the Evils array
  for (x = 0; x < 7; x++) {
    gameVars.EvilTemp[x] = [];
    for (y = 0; y < 7; y++) {
      gameVars.EvilTemp[x][y] = 0;
    }
  }
  // bit extra for when the bod goes off the bottom:
  gameVars.CLevel[28] = [];
  // needed because the feet can go through it seems.
  if (jsCavernSprite === -1) {
    loadSprite();
  } else {
    InitLoad();
  }
}

function loadCSS() {
  //internal css are <style> and external css files are <link>
  var a = document.createElement('style');
  a.innerHTML =
    'html{background-color:black}body{color:#0f0;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);overflow:hidden;margin:0;padding:0;border:0;font-size:1em;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}hr{width:10em}.game{clear:both;position:absolute;left:0;top:0}.scores{position:relative;float:left;width:23%;font-size:2em;text-align:center;display:inline}.touchButtons{position:absolute;text-align:center;line-height:1.3em;font-size:3em;bottom:1em;border-radius:5em;border:2px solid rgba(0,0,0,0.4);width:1.4em;height:1.4em;background-color:rgba(128,128,128,0.4);display:none}.fsButton{position:absolute;font-weight:bold;transform:scale(2,1);font-size:2em;text-align:center;opacity:.5;transition:opacity .1s,transform .1s;cursor:default;right:.5em;bottom:0}.fsButton:hover{transform:scale(2.4,1.2);transition:.2s;opacity:1}.fsButton:active{transform:scale(2,1);transition:.05s}.fsdButton{position:absolute;font-weight:bold;transform:scale(2.4,1.2);font-size:2em;text-align:center;opacity:.5;transition:opacity .1s,transform0 .1s;right:.5em;bottom:0}.fsdButton:hover{transform:scale(2,1);transition:.2s;opacity:1}.fsdButton:active{transform:scale(2.4,1.2);transition:.05s}#menu{position:absolute;top:0;left:0;width:100%;height:100%;z-index:99;background-color:rgba(32,32,32,0.8);text-align:center;font-size:3em;line-height:1em}.menuSelected{opacity:.5;animation:oPulse .5s linear alternate infinite}@keyframes oPulse{0%{text-shadow:0 0 0}to{text-shadow:0 0 .3em;font-size:1.2em;opacity:1}}'
  ;

  document.head.appendChild(a);
}

function loadSprite() {
  jsCavernSprite = document.createElement('img');
  jsCavernSprite.src = 'images/jscSprites2.png';
  jsCavernSprite.id = 'jsCavernSpritel';
  jsCavernSprite.addEventListener('load', function() {
    if (this.id.slice(-1) === 'l') {
      this.id = this.id.slice(0, -1);
      InitLoad();
    }
  });
}
function InitLoad() {
  window.setTimeout(function() {
    //check for saved data. If set, the user has chosen to either save or not save data.
    storageCheck();
    //create the game stuff
    initGame();
    //show the menu.
    menuShow();
  }, 250);
}

function menuShow() {
  var message = '<p>JS Cavern</p>';
  //gameVars.Loading is -1 when initially loaded
  if (gameVars.Loading !== -1) {
    message = (gameVars.Hearts < 0 ? '<p>Game Over</p><hr>' :
      '<p>Paused</p><hr>'
    );
  }
  var newElem = document.createElement('div');
  newElem.id = 'menu';
  newElem.innerHTML = message
    + '<div class="menuItem" id="m-R">Resume</div>'
    + '<div class="menuItem" id="m-LG">Load Game</div>'
    + '<div class="menuItem" id="m-SG">Save Game</div>'
    + '<div class="menuItem" id="m-NG">New Game</div>'
    + '<hr>'
    + '<div class="menuItem" id="m-TC">Show Touch Controls</div>'
  ;

  document.body.appendChild(newElem);
  //can the game be saved right now?
  if (gameVars.Loading !== 0 || gameVars.Falling || gameVars.Jumping || gameVars.Waiting || gameVars.Hearts < 0) {
    document.getElementById('m-SG').style.opacity = '0.4';
  }
  //look for a loaded game. if there is one, have load game selected.
  var a = storageLoad('SaveGame');
  if (!a) {
    document.getElementById('m-LG').style.opacity = '0.4';
  }
  if (gameVars.Hearts < 0) {
    if (a) {
      document.getElementById('m-LG').classList.add('menuSelected');
    }
    else {
      document.getElementById('m-NG').classList.add('menuSelected');
    }
    document.getElementById('m-R').style.opacity = '0.4';
  }
  else {
    document.getElementById('m-R').classList.add('menuSelected');
  }

}
function menuInputs() {

  if (gameVars.pressedKeys.indexOf(37) != -1 || gameVars.pressedKeys.indexOf(38) != -1) {
    // left or up is pressed. move the menu up/to the bottom.
    menuMove('u');
  }
  else if (gameVars.pressedKeys.indexOf(39) != -1 || gameVars.pressedKeys.indexOf(40) != -1) {
    // right or down is pressed. move the menu up/to the bottom.
    menuMove('d');
  }
}
function menuMove(d) {
  //slow down the menu scrolling when user keeps moving up.down.
  if (gameVars.menuMove) {
    return;
  }
  gameVars.menuMove = 1;

  window.setTimeout(function() {
    gameVars.menuMove = 0;
  }, 250);

  //enumerate the active menu entries present
  var menuEntry = [], a = 0, SMIid = 0;

  var menuItems = document.getElementsByClassName('menuItem');
/*
  while (document.getElementById('m-' + a)) {
    if (document.getElementById('m-' + a).style.opacity != 0.4) {
      if (document.getElementById('m-' + a).classList.contains('menuSelected')) {
        SMIid = menuEntry.length; //should only ever be one entry!
        document.getElementById('m-' + a).classList.remove('menuSelected');
      }
      menuEntry.push(a);
    }
    a++;
  }
*/
  for (var x = 0; x < menuItems.length; x++) {
    if (menuItems[x].style.opacity != 0.4) {
      if (menuItems[x].classList.contains('menuSelected')) {
        SMIid = menuEntry.length; //should only ever be one entry!
        menuItems[x].classList.remove('menuSelected');
      }
      menuEntry.push(menuItems[x]);
    }
  }

/*
  //which menu item is currently selected?
  var SMI = document.getElementById('menu').getElementsByClassName('menuSelected')[0];
  var SMIid = parseInt(SMI.id.slice(2), 10);
  //remove the selected menu item's selected class
  SMI.classList.remove('menuSelected');
*/
  if (d === 'u') {
    // if not at the top, move the menu selection up
    if (SMIid > 0) {
      //document.getElementById('m-' + menuEntry[SMIid-1]).classList.add('menuSelected');
      menuEntry[SMIid-1].classList.add('menuSelected');
    }
    else {
      //make the bottom menu item selected
      //document.getElementById('m-' + menuEntry[menuEntry.length-1]).classList.add('menuSelected');
      menuEntry[menuEntry.length-1].classList.add('menuSelected');
    }
  }
  else if (d === 'd') {
    // if not at the top, move the menu selection up
    if (SMIid < (menuEntry.length - 1)) {
      //document.getElementById('m-' + menuEntry[SMIid + 1]).classList.add('menuSelected');
      menuEntry[SMIid + 1].classList.add('menuSelected');
    }
    else {
      //make the bottom menu item selected
      //document.getElementById('m-' + menuEntry[0]).classList.add('menuSelected');
      menuEntry[0].classList.add('menuSelected');
    }
  }
}
function menuSelect() {

  var SMI = document.getElementById('menu').getElementsByClassName('menuSelected');

  //for testing:
  if (SMI.length !== 1) {
    debugger;
    var blah = 'there are ' + SMI.length + ' entries that have "menuSelected!"';
  }

  var SMIid = SMI[0].id.slice(2, 10);

  //let's try to get around the Uncaught (in promise) DOMException
  //defaultMuted is true... unmute the elements now.
  /*
  gameVars.aDiamond.muted = false;
  gameVars.aJet1.muted = false;
  gameVars.aHeart.muted = false;
  gameVars.aDeath.muted = false;
  */
  //nope... still sometimes(!!!) causes DEMException.
  //ffs
  //try the globalscripts audio version... from the menu.
  if (!audioCtx) {
    soundInit();
  }

  if (SMIid === 'R') {
    //resume the game
    menuHide();
    gameVars.paused = 0;
  }
  else if (SMIid === 'NG') {
    //create a new game
    newGame();
  }
  else if (SMIid === 'LG' && SMI[0].style.opacity != 0.4) {
    //load a game
    gameLoad();
  }
  else if (SMIid === 'SG' && SMI[0].style.opacity != 0.4) {
    //save a game
    gameSave();
  }
  else if (SMIid === 'TC') {
    //show/hide Touch Controls
    if (document.getElementById('m-TC').innerHTML === 'Show Touch Controls') {
      document.getElementById('m-TC').innerHTML = 'Hide Touch Controls';
      toggleTouchControls('block');
    }
    else {
      document.getElementById('m-TC').innerHTML = 'Show Touch Controls';
      toggleTouchControls('none');
    }
  }
}
function menuHide() {
  if (document.getElementById('menu')) {
    document.body.removeChild(document.getElementById('menu'));
  }
}
function toggleTouchControls(a) {
  document.getElementById('L').style.display = a;
  document.getElementById('U').style.display = a;
  document.getElementById('R').style.display = a;
  document.getElementById('D').style.display = a;
}
function initGame() {
  document.body.innerHTML =
    '<canvas id="GameBack" class="game" width="896" height="448"></canvas>'
  + '<canvas id="GameFore" class="game" style="position:relative;" width="896" height="448"></canvas>'
  + '<div id="Hearts" class="scores">Hearts: 1000</div>'
  + '<div id="Diamonds" class="scores">Diamonds: 0</div>'
  + '<div id="Parachutes" class="scores">Parachutes: 3</div>'
  + '<div id="Score" class="scores">Level 00</div>'
  + '<div id="fs" class="fsButton">&#9974;</div>'
  + '<div id="L" class="touchButtons" style="left:0;bottom:2em;">&larr;</div>'
  + '<div id="R" class="touchButtons" style="left:2em;">&rarr;</div>'
  + '<div id="U" class="touchButtons" style="right:0;bottom:2em;">&uarr;</div>'
  + '<div id="D" class="touchButtons" style="right:2em;">&darr;</div>'
  ;

  gameVars.Score = document.getElementById('Score');

  reScale();
  gamePadsButtonEventCheck();
  timerUpdate();
}
function newGame() {
  menuHide();
  gameVars.Loading = 1;
  gameVars.Jumping = 0;
  gameVars.Falling = 0;
  gameVars.Gloved = 'none';
  gameVars.Swimming = 0;
  gameVars.Detonated = 0;
  gameVars.UsedLift = 0;
  gameVars.CurrentLevel = 0;
  gameVars.Tramp = [0, 0, 0];
  gameVars.Diamonds = 0;
  gameVars.Hearts = 2;
  gameVars.Parachutes = 3;
  gameVars.Bod.Left = 432;
  gameVars.Bod.Top = 190;
  gameVars.Bod.Height = 32;
  gameVars.Bod.Width = 28;
  gameVars.Bod.Image = 74;
  gameVars.JetPack.On = 0;
  gameVars.Start.JetPack = [];
  gameVars.DiamondMap = loadArray(jscDiamondMap);
  gameVars.HeartMap = loadArray(jscHeartMap);
  gameVars.pressedKeys = [];
  gameVars.deathKeys = [];
  document.getElementById('Hearts').innerHTML = 'Hearts: ' + gameVars.Hearts;
  document.getElementById('Diamonds').innerHTML = 'Diamonds: ' + gameVars.Diamonds;
  document.getElementById('Parachutes').innerHTML = 'Parachutes: ' + gameVars.Parachutes;

  loadStartCheck();
  loadLevel();
  gameVars.paused = 0;
  mainLoop();
}

function gameLoad() {
  //only one save/load slot---at least for now!
  var dataToLoad = storageLoad('SaveGame')
  var LSsplit1;
  if (dataToLoad) {
    try {
      LSsplit1 = dataToLoad.split(LS1);
      //lob all of the stuff into the gameVars
      gameVars.Loading = parseInt(LSsplit1[0], 10);
      gameVars.Jumping = parseInt(LSsplit1[1], 10);
      gameVars.Falling = parseInt(LSsplit1[2], 10);
      gameVars.Gloved = LSsplit1[3];
      gameVars.Swimming = parseInt(LSsplit1[4], 10);
      gameVars.Detonated = parseInt(LSsplit1[5], 10);
      gameVars.UsedLift = parseInt(LSsplit1[6], 10);
      gameVars.Tramp = [parseInt(LSsplit1[7], 10), parseInt(LSsplit1[8], 10), parseInt(LSsplit1[9], 10)];
      gameVars.Hearts = parseInt(LSsplit1[10], 10);
      gameVars.Diamonds = parseInt(LSsplit1[11], 10);
      gameVars.Parachutes = parseInt(LSsplit1[12], 10);
      gameVars.CurrentLevel = parseInt(LSsplit1[13], 10);
      gameVars.Bod.Left = parseInt(LSsplit1[14], 10);
      gameVars.Bod.Top = parseInt(LSsplit1[15], 10);
      gameVars.Bod.Height = parseInt(LSsplit1[16], 10);
      gameVars.Bod.Width = parseInt(LSsplit1[17], 10);
      gameVars.Bod.Image = parseInt(LSsplit1[18], 10);

      gameVars.JetPack.On = parseInt(LSsplit1[19], 10);
      gameVars.JetPack.Left = parseInt(LSsplit1[20], 10);
      gameVars.JetPack.Top = parseInt(LSsplit1[21], 10);
      gameVars.JetPack.Image = parseInt(LSsplit1[22], 10);
    //if the jetpack is on, it'll be rendered at the right place. not needed in load/save
      gameVars.Start.Left = parseInt(LSsplit1[23], 10);
      gameVars.Start.Top = parseInt(LSsplit1[24], 10);
      gameVars.Start.Height = parseInt(LSsplit1[25], 10);
      gameVars.Start.Width = parseInt(LSsplit1[26], 10);
      gameVars.Start.Detonated = parseInt(LSsplit1[27], 10);
      gameVars.Start.JetPack.On = parseInt(LSsplit1[28], 10);
      gameVars.Start.JetPack.Left = parseInt(LSsplit1[29], 10);
      gameVars.Start.JetPack.Top = parseInt(LSsplit1[30], 10);
      gameVars.Start.JetPack.Image = parseInt(LSsplit1[31], 10);
      gameVars.Start.Image = parseInt(LSsplit1[32], 10);
      gameVars.Start.Waiting = parseInt(LSsplit1[33], 10);

      gameVars.DiamondMap = gameLoadArray(LSsplit1[34]);
      gameVars.HeartMap = gameLoadArray(LSsplit1[35]);

      //reset pressed keys, and update the scores:
      gameVars.pressedKeys = [];
      gameVars.deathKeys = [];
      document.getElementById('Hearts').innerHTML = 'Hearts: ' + gameVars.Hearts;
      document.getElementById('Diamonds').innerHTML = 'Diamonds: ' + gameVars.Diamonds;
      document.getElementById('Parachutes').innerHTML = 'Parachutes: ' + gameVars.Parachutes;

      loadLevel();
      menuHide();
      gameVars.Falling = 0;
      gameVars.paused = 0;
      //mainLoop();
    } catch (ex) {
      //notify of error.
    }
  }
}
function gameLoadArray(stringArray) {
  // split the stringArray into lines of the 1st dimention
  var
    zCopy = []
  ,  LSsplit1
  , LSsplit2
  , LSsplit3
  ;
  if (stringArray) {
    try {
      //split the blurb into the levels
      LSsplit1 = stringArray.split(LS2);

      for (var x = 0; x < LSsplit1.length - 1; x++) {
        //initialise 2nd dimention of the array
        zCopy[x] = [];
        //split the levels into items within that level
        LSsplit2 = LSsplit1[x].split(LS3);
        for (var y = 0; y < LSsplit2.length - 1; y++) {
          //initialise 3rd dimention of the array
          zCopy[x][y] = [];
          //split items into their individual data
          LSsplit3 = LSsplit2[y].split(LS4);
          for (var z = 0; z < LSsplit3.length - 1; z++) {
            //copy the individual array item datum
            //is it a number and ONLY a number?
            if (parseFloat(LSsplit3[z]) == LSsplit3[z]) {
              zCopy[x][y][z] = parseFloat(LSsplit3[z]);
            }
            else {
              zCopy[x][y][z] = LSsplit3[z];
            }
          }
        }
      }
    } catch (ex) {
      zCopy = 0;
    }
  }
  return zCopy;
}
function gameSave() {
  //only one save/load slot---at least for now!
  // using array.join(LS1) for the maps hopefully!
  var dataToSave =
    gameVars.Loading
    + LS1 + gameVars.Jumping
    + LS1 + gameVars.Falling
    + LS1 + gameVars.Gloved
    + LS1 + gameVars.Swimming
    + LS1 + gameVars.Detonated
    + LS1 + gameVars.UsedLift
    + LS1 + gameVars.Tramp[0]
    + LS1 + gameVars.Tramp[1]
    + LS1 + gameVars.Tramp[2]
    + LS1 + gameVars.Hearts
    + LS1 + gameVars.Diamonds
    + LS1 + gameVars.Parachutes
    + LS1 + gameVars.CurrentLevel
    + LS1 + gameVars.Bod.Left
    + LS1 + gameVars.Bod.Top
    + LS1 + gameVars.Bod.Height
    + LS1 + gameVars.Bod.Width
    + LS1 + gameVars.Bod.Image
    + LS1 + gameVars.JetPack.On
    + LS1 + gameVars.JetPack.Left
    + LS1 + gameVars.JetPack.Top
    + LS1 + gameVars.JetPack.Image
    //if the jetpack is on, it'll be rendered at the right place. not needed in load/save
    + LS1 + gameVars.Start.Left
    + LS1 + gameVars.Start.Top
    + LS1 + gameVars.Start.Height
    + LS1 + gameVars.Start.Width
    + LS1 + gameVars.Start.Detonated
    + LS1 + gameVars.Start.JetPack.On
    + LS1 + gameVars.Start.JetPack.Left
    + LS1 + gameVars.Start.JetPack.Top
    + LS1 + gameVars.Start.JetPack.Image
    + LS1 + gameVars.Start.Image
    + LS1 + gameVars.Start.Waiting
    //save the arrays to strings
    + LS1 + gameSaveArray(gameVars.DiamondMap)
    + LS1 + gameSaveArray(gameVars.HeartMap)
  ;

  storageSave('SaveGame', dataToSave);
  //let the user know that the game saved successfully?
  document.getElementById('m-SG').innerHTML = 'Game Saved.';
  document.getElementById('m-SG').style.opacity = '0.4';
  //move the selected menu item to "resume"
  document.getElementById('m-SG').classList.remove('menuSelected');
  document.getElementById('m-R').classList.add('menuSelected');
}
function gameSaveArray(zArray) {
  // split the stringArray into lines of the 1st dimention
  var stringArray = '';

  for (var x = 0; x < zArray.length; x++) {
    for (var y = 0; y < zArray[x].length; y++) {
      for (var z = 0; z < zArray[x][y].length; z++) {
        stringArray += zArray[x][y][z] + LS4;
      }
      stringArray += LS3;
    }
    stringArray += LS2;
  }

  return stringArray;
}
function updateInputs() {
  gameVars.pressedKeys = [];
  //reset the currently pressed keys here,
  //check gamepad statuses - add to pressed key if any axis is 'on'
  for (var x = 0; x < gamePadVars.length; x++) {
    for (var y = 0; y < gamePadVars[x].axes.length; y++) {
      //add a deadZone...
      if (gamePadVars[x].axes[y] < -.5 || gamePadVars[x].axes[y] > .5) {
        //if odd, assume axis is Y, even is X
        if (y % 2 == 0) { // even | X
          if (gamePadVars[x].axes[y] < 0) {
            gameVars.pressedKeys.push(37); //left
          } else {
            gameVars.pressedKeys.push(39); //right
          }
        }
        //ToDo: Add option in controls to ignore these and just use the A & B buttons instead.
        else { // odd | Y
          if (gamePadVars[x].axes[y] < 0) {
            gameVars.pressedKeys.push(38); //up
          } else {
            gameVars.pressedKeys.push(40); //down
          }
        }
      }
    }

    /*
      check for button presses - xbox 360 button mapping
      0 = A  1 = B  2 = X  3 = Y
      4 = Left Shoulder
      5 = Right Shoulder
      6 = Left Trigger (value from 0 to 1 eg. 0.5 half pressed)
      7 = Right Trigger (value from 0 to 1 eg. 0.5 half pressed)
      8 = Back
      9 = Start / Menu
      10 = Left stick pressed
      11 = Right stick pressed
      12-15 up, down, left, right D-Pad
      16 = the big X button!
    */
    if ((gamePadVars[x].buttons[0].value && !gameVars.paused) || gamePadVars[x].buttons[12].value) { //assume value = either pressed or touched. also maybe pressure sensetive?
      gameVars.pressedKeys.push(38); //up
    }
    else if (gamePadVars[x].buttons[1].value || gamePadVars[x].buttons[13].value) {
      gameVars.pressedKeys.push(40); //Down
    }
    else if (gamePadVars[x].buttons[14].value || gamePadVars[x].buttons[14].value) {
      gameVars.pressedKeys.push(37); //Left
    }
    else if (gamePadVars[x].buttons[15].value || gamePadVars[x].buttons[15].value) {
      gameVars.pressedKeys.push(39); //Right
    }
    else if (gamePadVars[x].buttons[9].value) {
      pauseToggle();
      gameVars.pressedKeys.push(80);
    }
  }
  //add keyboard inputs here:
  for (var x = 0; x < keyVars.length; x++) {
    if (gameVars.pressedKeys.indexOf(keyVars[x]) == -1) {
      gameVars.pressedKeys.push(keyVars[x]);
    }
  }

  //look for P = pause key or esc key
  if (gameVars.pressedKeys.indexOf(80) != -1 || gameVars.pressedKeys.indexOf(27) != -1) {
    pauseToggle();
  }

  //onscreen mouse.first touch buttons
  if (mouseVars.button && mouseVars.current.target.id) {
    checkTarget(mouseVars.current.target.id);
  }
  // a second touch would be needed for pressing up/down while moving left/right
  if (touchVars[1]) {
    debugger;
    checkTarget(touchVars[1].target.id);
  }

  //check for deathKeys, remove any that are the same, and check all deathKeys to pressedKeys, if a DeathKey isn't in pressedKeys, then remove it.
  for (var x = 0; x < gameVars.deathKeys.length; x++) {
    var t1 = gameVars.pressedKeys.indexOf(gameVars.deathKeys[x]);
    if (gameVars.pressedKeys.indexOf(gameVars.deathKeys[x]) != -1) {
      while (gameVars.pressedKeys.indexOf(gameVars.deathKeys[x]) != -1) {
        gameVars.pressedKeys.splice(gameVars.pressedKeys.indexOf(gameVars.deathKeys[x]), 1);
        //updates array length
      }
    } else {
      gameVars.deathKeys.splice(gameVars.deathKeys.indexOf(gameVars.deathKeys[x]), 1);
    }
  }
}
function checkTarget(zId) {
  if (zId === 'L') {
    gameVars.pressedKeys.push(37); //left
  }
  else if (zId === 'R') {
    gameVars.pressedKeys.push(39); //right
  }
  else if (zId === 'U') {
    gameVars.pressedKeys.push(38); //up
  }
  else if (zId === 'D') {
    gameVars.pressedKeys.push(40); //down
  }
}
function mainLoop() {
  if (gameVars.Loading !== 1) {

    updateInputs();

    if (gameVars.paused) {
      menuInputs();
      return;
    }

    if (gameVars.pressedKeys.length > 0) {
      moveBod();
    }
    // move the bod depending on falling, jumping or going through a stair
    gravity();

    moveEvils();
    moveBoats();

    collision();

    moveJetpack();

    if (gameVars.Loading === 0) {
      renderFore();
    }
  }
}


function pauseToggle() {
  // if the game has just loaded, ignore!
  if (gameVars.Loading === -1) {
    return;
  }
  //pause the game and put up the menu :D
  if (gameVars.paused
    && gameVars.deathKeys.indexOf(80) === -1
  ) {
    gameVars.deathKeys.push(80);
    gameVars.paused = 0;
    menuHide();
  }
  else if (gameVars.deathKeys.indexOf(80) === -1) {
    gameVars.paused = 1;
    gameVars.deathKeys.push(80);
    menuShow();
  }

  //add the p key to pressedKeys if it isn't there
  if (gameVars.pressedKeys.indexOf(80) === -1) {
     gameVars.pressedKeys.push(80);
  }
}
function renderBack() {
  var gameBackContext2d = document.getElementById('GameBack').getContext('2d');
  //clear the canvas
  gameBackContext2d.clearRect(0, 0, document.getElementById('GameFore').width, document.getElementById('GameFore').height);
  var srcSprite = jsCavernSprite;
  var TmpStuff;
  var x = 0
    , y = 0;
  while (y < 28) {
    TmpStuff = [];
    if (gameVars.CLevel[y][x] != 0) {
      TmpStuff[0] = jscTiles[gameVars.CLevel[y][x]][0];
      //image x position
      TmpStuff[1] = jscTiles[gameVars.CLevel[y][x]][1];
      //image y position
      //2 and 3 are image width and height
      TmpStuff[4] = (x * gameVars.blockSize);
      //canvas x co-ordinate
      TmpStuff[5] = (y * gameVars.blockSize);
      //canvas y co-ordinate
      //6 and 7 would be the same as 2 and 3 (?)
      if (gameVars.CLevel[y][x] < 42) {
        TmpStuff[2] = TmpStuff[6] = gameVars.blockSize
        //16;
        TmpStuff[3] = TmpStuff[7] = gameVars.blockSize
        //16;
        x += 1;
      } else if (gameVars.CLevel[y][x] > 41 && gameVars.CLevel[y][x] < 56) {
        if (gameVars.CLevel[y][x] == 55) {
          TmpStuff[2] = TmpStuff[6] = gameVars.blockSize * 2//32;
          TmpStuff[3] = TmpStuff[7] = gameVars.blockSize * 2//32;
          x += 2;
        } else {
          TmpStuff[2] = TmpStuff[6] = gameVars.blockSize * 2//32;
          TmpStuff[3] = TmpStuff[7] = gameVars.blockSize//16;
          x += 2;
        }
      } else if (gameVars.CLevel[y][x] > 55 && gameVars.CLevel[y][x] < 61) {
        if (gameVars.CLevel[y][x] > 56 && gameVars.CLevel[y][x] < 61) {
          TmpStuff[2] = TmpStuff[6] = gameVars.blockSize * 3//48;
          TmpStuff[3] = TmpStuff[7] = gameVars.blockSize * 2//32;
          x += 3;
        } else if (gameVars.CLevel[y][x] > 55){ //the small animatd evil
          TmpStuff[2] = TmpStuff[6] = gameVars.blockSize * 2//32;
          TmpStuff[3] = TmpStuff[7] = gameVars.blockSize * 2//32;
          x += 2;
        } else {
          TmpStuff[2] = TmpStuff[6] = gameVars.blockSize * 3//48;
          TmpStuff[3] = TmpStuff[7] = gameVars.blockSize//16;
          x += 3;
        }
      } else if (gameVars.CLevel[y][x] > 60 && gameVars.CLevel[y][x] < 66) {
        TmpStuff[2] = TmpStuff[6] = gameVars.blockSize * 4//64;
        TmpStuff[3] = TmpStuff[7] = gameVars.blockSize//16;
        x += 4;
      } else if (gameVars.CLevel[y][x] == 66) {
        TmpStuff[2] = TmpStuff[6] = gameVars.blockSize * 4//64;
        TmpStuff[3] = TmpStuff[7] = gameVars.blockSize * 2//32;
        x += 4;
      } else if (gameVars.CLevel[y][x] == 67 || gameVars.CLevel[y][x] == 68) {
        TmpStuff[2] = TmpStuff[6] = parseInt((gameVars.blockSize * 5), 10); //boxing gloves are actually 4.5 = 72, but need 16 blocks.
        TmpStuff[3] = TmpStuff[7] = gameVars.blockSize//16;
        x += 5;
      } else if (gameVars.CLevel[y][x] == 69) {
        TmpStuff[2] = TmpStuff[6] = gameVars.blockSize * 6//96;
        TmpStuff[3] = TmpStuff[7] = gameVars.blockSize * 3//48;
        x += 6;
      }
      gameBackContext2d.drawImage(srcSprite, TmpStuff[0], TmpStuff[1], Math.ceil(TmpStuff[2]), Math.ceil(TmpStuff[3]), Math.floor(TmpStuff[4]), Math.floor(TmpStuff[5]), Math.ceil(TmpStuff[6]), Math.ceil(TmpStuff[7])//TmpStuff[0], TmpStuff[1], TmpStuff[2], TmpStuff[3],
      //TmpStuff[4], TmpStuff[5], TmpStuff[6], TmpStuff[7]
      );
    } else {
      x += 1;
    }
    if (x > 55) {
      x = 0;
      y++;
    }
  }
  //Enter the Diamonds, reuse x...
  for (x = 1; x <= gameVars.DiamondMap[gameVars.CurrentLevel][0]; x++) {
    if (gameVars.DiamondMap[gameVars.CurrentLevel][x][2] == 1) {
      gameVars.CLevel[gameVars.DiamondMap[gameVars.CurrentLevel][x][1]][gameVars.DiamondMap[gameVars.CurrentLevel][x][0]] = 48;
      gameVars.CLevel[gameVars.DiamondMap[gameVars.CurrentLevel][x][1]][(gameVars.DiamondMap[gameVars.CurrentLevel][x][0] + 1)] = 48;
      gameBackContext2d.drawImage(srcSprite, jscTiles[48][0], jscTiles[48][1], (gameVars.blockSize * 2), gameVars.blockSize, (gameVars.DiamondMap[gameVars.CurrentLevel][x][0] * gameVars.blockSize), (gameVars.DiamondMap[gameVars.CurrentLevel][x][1] * gameVars.blockSize), (gameVars.blockSize * 2), gameVars.blockSize);
    }
  }
  //Enter the Hearts...
  for (x = 1; x <= gameVars.HeartMap[gameVars.CurrentLevel][0]; x++) {
    if (gameVars.HeartMap[gameVars.CurrentLevel][x][2] == 1) {
      gameVars.CLevel[gameVars.HeartMap[gameVars.CurrentLevel][x][1]][gameVars.HeartMap[gameVars.CurrentLevel][x][0]] = 49;
      gameVars.CLevel[gameVars.HeartMap[gameVars.CurrentLevel][x][1]][(gameVars.HeartMap[gameVars.CurrentLevel][x][0] + 1)] = 49;
      gameBackContext2d.drawImage(srcSprite, jscTiles[49][0], jscTiles[49][1], (gameVars.blockSize * 2), gameVars.blockSize, (gameVars.HeartMap[gameVars.CurrentLevel][x][0] * gameVars.blockSize), (gameVars.HeartMap[gameVars.CurrentLevel][x][1] * gameVars.blockSize), (gameVars.blockSize * 2), gameVars.blockSize);
    }
  }
  //Enter the Parachutes...
  for (x = 1; x <= jscParachute[gameVars.CurrentLevel][0]; x++) {
    gameVars.CLevel[jscParachute[gameVars.CurrentLevel][x][1]][jscParachute[gameVars.CurrentLevel][x][0]] = 50;
    gameVars.CLevel[jscParachute[gameVars.CurrentLevel][x][1]][(jscParachute[gameVars.CurrentLevel][x][0] + 1)] = 50;
    gameBackContext2d.drawImage(srcSprite, jscTiles[50][0], jscTiles[50][1], (gameVars.blockSize * 2), gameVars.blockSize, (jscParachute[gameVars.CurrentLevel][x][0] * gameVars.blockSize), (jscParachute[gameVars.CurrentLevel][x][1] * gameVars.blockSize), (gameVars.blockSize * 2), gameVars.blockSize);
  }
  //Enter the Jetpacks:
  for (x = 1; x <= jscJetpack[gameVars.CurrentLevel][0]; x++) {
    gameVars.CLevel[jscJetpack[gameVars.CurrentLevel][x][1]][jscJetpack[gameVars.CurrentLevel][x][0]] = 1;
    gameBackContext2d.drawImage(srcSprite, jscTiles[1][0], jscTiles[1][1], gameVars.blockSize, gameVars.blockSize, (jscJetpack[gameVars.CurrentLevel][x][0] * gameVars.blockSize), (jscJetpack[gameVars.CurrentLevel][x][1] * gameVars.blockSize), gameVars.blockSize, gameVars.blockSize);
  }
  //Enter the Arrows...  [[8] , [30,44,27,14]]
  for (x = 1; x <= jscArrow[gameVars.CurrentLevel][0]; x++) {
    gameVars.CLevel[jscArrow[gameVars.CurrentLevel][x][2]][jscArrow[gameVars.CurrentLevel][x][1]] = jscArrow[gameVars.CurrentLevel][x][0];
    gameVars.CLevel[jscArrow[gameVars.CurrentLevel][x][2]][(jscArrow[gameVars.CurrentLevel][x][1] + 1)] = jscArrow[gameVars.CurrentLevel][x][0];
    gameBackContext2d.drawImage(srcSprite, jscTiles[jscArrow[gameVars.CurrentLevel][x][0]][0], jscTiles[jscArrow[gameVars.CurrentLevel][x][0]][1], (gameVars.blockSize * 2), gameVars.blockSize, (jscArrow[gameVars.CurrentLevel][x][1] * gameVars.blockSize), (jscArrow[gameVars.CurrentLevel][x][2] * gameVars.blockSize), (gameVars.blockSize * 2), gameVars.blockSize);
  }
  //Enter the Lifts...  [[2] , [8,25,8,7]]
  for (x = 1; x <= jscLift[gameVars.CurrentLevel][0]; x++) {
    if (jscLift[gameVars.CurrentLevel][x][4] == 'up') {
      y = 0;
    } else if (jscLift[gameVars.CurrentLevel][x][4] == 'down') {
      y = 2;
    }
    gameVars.LiftMap[gameVars.CurrentLevel][x][5] = jscLift[gameVars.CurrentLevel][x][y];
    //reset the Lifts to their original position
    gameVars.LiftMap[gameVars.CurrentLevel][x][6] = jscLift[gameVars.CurrentLevel][x][y + 1];
    gameVars.LiftMap[gameVars.CurrentLevel][x][7] = jscLift[gameVars.CurrentLevel][x][4];
    var x6 = Math.floor(gameVars.LiftMap[gameVars.CurrentLevel][x][6] / 16);
    var x5 = Math.floor(gameVars.LiftMap[gameVars.CurrentLevel][x][5] / 16);
    gameVars.CLevel[x6][x5] = 62;
    gameVars.CLevel[x6][(x5 + 1)] = 62;
    gameVars.CLevel[x6][(x5 + 2)] = 62;
    gameVars.CLevel[x6][(x5 + 3)] = 62;
  }
  //TmpStuff += "<div id='Lift" + x + "' style=\"background:url('Sprites.png') " + tiles[62] +
  //"; position:absolute; top:" + (DivY + Lift[CurrentLevel][x][6]) + "px; left:" + (DivX + Lift[CurrentLevel][x][5]) + "px; width:64px; height:16px;\"></div>";
  //Enter the Boats...  [[2] , [8,25,8,7]]
  for (x = 1; x <= jscBoat[gameVars.CurrentLevel][0]; x++) {
    if (jscBoat[gameVars.CurrentLevel][x][4] == 'right') {
      y = 0;
    } else if (jscBoat[gameVars.CurrentLevel][x][4] == 'left') {
      y = 2;
    }
    gameVars.BoatMap[gameVars.CurrentLevel][x][5] = jscBoat[gameVars.CurrentLevel][x][y];
    //reset the Boats to their original position
    gameVars.BoatMap[gameVars.CurrentLevel][x][6] = jscBoat[gameVars.CurrentLevel][x][y + 1];
    gameVars.BoatMap[gameVars.CurrentLevel][x][7] = jscBoat[gameVars.CurrentLevel][x][4];
    var x6 = Math.floor(gameVars.BoatMap[gameVars.CurrentLevel][x][6] / 16);
    var x5 = Math.floor(gameVars.BoatMap[gameVars.CurrentLevel][x][5] / 16);
    gameVars.CLevel[x6][x5] = 62;
    gameVars.CLevel[x6][(x5 + 1)] = 62;
    gameVars.CLevel[x6][(x5 + 2)] = 62;
  }
  //Enter the Evils...  [[1] , [20,17,39,17,41]]
  for (x = 1; x <= jscEvil[gameVars.CurrentLevel][0]; x++) {
    if (jscEvil[gameVars.CurrentLevel][x][5] == 'right' || gameVars.EvilMap[gameVars.CurrentLevel][x][5] == 'down') {
      y = 0;
    } else if (jscEvil[gameVars.CurrentLevel][x][5] == 'left' || gameVars.EvilMap[gameVars.CurrentLevel][x][5] == 'up') {
      y = 2;
    }
    gameVars.EvilMap[gameVars.CurrentLevel][x][6] = jscEvil[gameVars.CurrentLevel][x][y];
    //copy the Evils original position to the Temp slots
    gameVars.EvilMap[gameVars.CurrentLevel][x][7] = jscEvil[gameVars.CurrentLevel][x][y + 1];
    gameVars.EvilMap[gameVars.CurrentLevel][x][8] = jscEvil[gameVars.CurrentLevel][x][5];
    var x6 = Math.floor(gameVars.EvilMap[gameVars.CurrentLevel][x][6] / 16);
    var x7 = Math.floor(gameVars.EvilMap[gameVars.CurrentLevel][x][7] / 16);
    // Take note of what the Evil will be overwriting: - this should always be Zero's in this one, but will also serve to reset the evil cache on level change.
    gameVars.EvilTemp[x][0] = gameVars.CLevel[x7][x6];
    gameVars.EvilTemp[x][1] = gameVars.CLevel[x7][(x6 + 1)];
    gameVars.EvilTemp[x][2] = gameVars.CLevel[(x7 + 1)][x6];
    gameVars.EvilTemp[x][3] = gameVars.CLevel[(x7 + 1)][(x6 + 1)];
    gameVars.EvilTemp[x][4] = gameVars.CLevel[x7][(x6 + 2)];
    gameVars.EvilTemp[x][5] = gameVars.CLevel[(x7 + 1)][(x6 + 2)];
    // Overwrite the temporary Collision map with thie Evil's co-ordinates...
    gameVars.CLevel[x7][x6] = gameVars.EvilMap[gameVars.CurrentLevel][x][4];
    gameVars.CLevel[(x7 + 1)][x6] = gameVars.EvilMap[gameVars.CurrentLevel][x][4];
    //gameVars.CLevel[x7][(Math.floor(gameVars.EvilMap[gameVars.CurrentLevel][x][6] + 1) / gameVars.blockSize)] = gameVars.EvilMap[gameVars.CurrentLevel][x][4];
    gameVars.CLevel[x7][(x6 + 1)] = gameVars.EvilMap[gameVars.CurrentLevel][x][4];
    gameVars.CLevel[(x7 + 1)][(x6 + 1)] = gameVars.EvilMap[gameVars.CurrentLevel][x][4];
    if (gameVars.EvilMap[gameVars.CurrentLevel][x][4] > 44) {
      //for the 48px Evils! all but Evil1
      gameVars.CLevel[x7][(x6 + 2)] = gameVars.EvilMap[gameVars.CurrentLevel][x][4];
      gameVars.CLevel[(x7 + 1)][(x6 + 2)] = gameVars.EvilMap[gameVars.CurrentLevel][x][4];
    }
  }
}
function renderFore() {
  var gameForeContext2d = document.getElementById('GameFore').getContext('2d');
  var srcSprite = jsCavernSprite;
  var x;
  //clear the canvas
  gameForeContext2d.clearRect(0, 0, document.getElementById('GameFore').width, document.getElementById('GameFore').height);
  //copy the background from the other canvas
  gameForeContext2d.drawImage(document.getElementById('GameBack'), 0, 0, document.getElementById('GameFore').width, document.getElementById('GameFore').height, 0, 0, document.getElementById('GameFore').width, document.getElementById('GameFore').height);
  //Draw the Bod
  gameForeContext2d.drawImage(srcSprite, jscTiles[gameVars.Bod.Image][0], jscTiles[gameVars.Bod.Image][1], gameVars.Bod.Width, gameVars.Bod.Height, gameVars.Bod.Left, gameVars.Bod.Top, gameVars.Bod.Width, gameVars.Bod.Height);
  //Jetpack:
  if (gameVars.JetPack.On) {
    gameForeContext2d.drawImage(srcSprite, jscTiles[gameVars.JetPack.Image][0], jscTiles[gameVars.JetPack.Image][1], gameVars.blockSize, (gameVars.blockSize * 2), gameVars.JetPack.Left, gameVars.JetPack.Top, gameVars.blockSize, (gameVars.blockSize * 2));
  }
  //Draw the Lifts:
  for (x = 1; x <= gameVars.LiftMap[gameVars.CurrentLevel][0]; x++) {
    gameForeContext2d.drawImage(srcSprite, jscTiles[62][0], jscTiles[62][1], (gameVars.blockSize * 4), gameVars.blockSize, //64, 16
    gameVars.LiftMap[gameVars.CurrentLevel][x][5], gameVars.LiftMap[gameVars.CurrentLevel][x][6], (gameVars.blockSize * 4), gameVars.blockSize);
  }
  //Draw the Evils:
  for (x = 1; x <= gameVars.EvilMap[gameVars.CurrentLevel][0]; x++) {
    gameForeContext2d.drawImage(srcSprite, jscTiles[gameVars.EvilMap[gameVars.CurrentLevel][x][4]][0], jscTiles[gameVars.EvilMap[gameVars.CurrentLevel][x][4]][1], (gameVars.blockSize * 3), (gameVars.blockSize * 2), //48, 32,
    gameVars.EvilMap[gameVars.CurrentLevel][x][6], gameVars.EvilMap[gameVars.CurrentLevel][x][7], (gameVars.blockSize * 3), (gameVars.blockSize * 2)//48, 32
    );
  }
  //Draw the Boats:
  for (x = 1; x <= gameVars.BoatMap[gameVars.CurrentLevel][0]; x++) {
    gameForeContext2d.drawImage(srcSprite, jscTiles[56][0], jscTiles[56][1], (gameVars.blockSize * 3), gameVars.blockSize, //48, 16,
    gameVars.BoatMap[gameVars.CurrentLevel][x][5], gameVars.BoatMap[gameVars.CurrentLevel][x][6], (gameVars.blockSize * 3), gameVars.blockSize //48, 16
    );
  }
}
function speedUp() {
  gameVars.gameSpeed = parseInt((gameVars.gameSpeed * 0.75), 10);
}
function speedNorm() {
  gameVars.gameSpeed = 58;
}
function speedDown() {
  gameVars.gameSpeed = parseInt((gameVars.gameSpeed * 1.25), 10);
}
function loadArray(zArray) {
  //3D array copy - properly non-linked.
  //initialise 1st dimention of the array
  var zCopy = [];
  for (var x = 0; x < zArray.length; x++) {
      //initialise 2nd dimention of the array
    zCopy[x] = [];
    for (var y = 0; y < zArray[x].length; y++) {
      //initialise 3rd dimention of the array
      zCopy[x][y] = [];
      for (var z = 0; z < zArray[x][y].length; z++) {
        zCopy[x][y][z] = zArray[x][y][z];
        //copy the individual array item
      }
    }
  }
  return zCopy;
}
function loadLevel() {
  gameVars.Loading = 1;

  //CLevel = jscLevelMap[CurrentLevel]; this doesn't work cos it LINKS the object instead of copying it....meaning Level[CurrentLevel] gets changes as and when changes are made to CLevel!
  //gameVars.CLevel = jscLevelMap[gameVars.CurrentLevel].slice();//non-linked method of copying an array, but doesn't work on multi-dimentional arrays :(
  //  bruteforce appoach:
  var x = 0
    , y = 0;
  //the massiveloop version....
  while (y < 28) {
    gameVars.CLevel[y][x] = jscLevelMap[gameVars.CurrentLevel][y][x];
    x++;
    if (x > 55) {
      x = 0;
      y++;
    }
  }
  renderBack();

  if (gameVars.CurrentLevel < 10) {
    gameVars.Score.innerHTML = "Level 0" + gameVars.CurrentLevel;
  } else {
    gameVars.Score.innerHTML = "Level " + gameVars.CurrentLevel;
  }

  gameVars.Loading = 0;
}

function levelStartData() {
  gameVars.Start.Left = parseInt(gameVars.Bod.Left, 10);
  gameVars.Start.Top = parseInt(gameVars.Bod.Top, 10);
  gameVars.Start.Height = parseInt(gameVars.Bod.Height, 10);
  gameVars.Start.Width = parseInt(gameVars.Bod.Width, 10);
  gameVars.Start.Detonated = parseInt(gameVars.Detonated, 10);
  gameVars.Start.JetPack.On = parseInt(gameVars.JetPack.On, 10);
  gameVars.Start.Image = parseInt(gameVars.Bod.Image, 10);
  //make sure that the bod's start doesn't get redone on this level:
  gameVars.Start.Waiting = 0;
}

function reScale() {

  if (!document.getElementById('GameFore')) {
    //skip the automatic resizing of the empy window before the sprites are loaded.
    return;
  }

  var xScale = window.innerWidth / initWidth
    , yScale = window.innerHeight / initHeight
  ;

  var zScale = (xScale <= yScale) ? xScale : yScale;
  var tScale = 50 / zScale;

  document.body.style.transform =
    'scale(' + zScale + ')'
  + ' translate(-' + tScale + '%,-' + tScale + '%)';

}

function moveBod() {
  if (gameVars.pressedKeys.indexOf(37) != -1 && !gameVars.Falling) {
    //Left
    if (gameVars.JetPack.On && (gameVars.Bod.Image == 76 || gameVars.Bod.Image == 77) && gameVars.pressedKeys.indexOf(40) == -1) {
      gameVars.Bod.Left -= 12;
    }
    if (gameVars.pressedKeys.indexOf(40) != -1 && gameVars.JetPack.On) {
      ;
    } else {
      gameVars.Bod.Left -= 8;
      if (gameVars.Bod.Height == 32) {
        if (gameVars.Bod.Image == 74 || gameVars.Bod.Image == 76) {
          gameVars.Bod.Image = 75;
        } else {
          gameVars.Bod.Image = 74;
        }
      } else if (gameVars.Bod.Height == 16) {
        if (gameVars.Bod.Image == 72 || gameVars.Bod.Image == 73) {
          gameVars.Bod.Left += 8;
        }
        if (gameVars.Bod.Image == 70 || gameVars.Bod.Image == 72) {
          gameVars.Bod.Image = 71;
        } else {
          gameVars.Bod.Image = 70;
        }
      }
    }
  }
  if (gameVars.pressedKeys.indexOf(39) != -1 && !gameVars.Falling) {
    //Right
    if (gameVars.JetPack.On && (gameVars.Bod.Image == 74 || gameVars.Bod.Image == 75) && gameVars.pressedKeys.indexOf(40) == -1) {
      gameVars.Bod.Left += 12;
    }
    if (gameVars.pressedKeys.indexOf(40) != -1 && gameVars.JetPack.On) {
      ;
    } else {
      gameVars.Bod.Left += 8;
      if (gameVars.Bod.Height == 32) {
        if (gameVars.Bod.Image == 76 || gameVars.Bod.Image == 74) {
          gameVars.Bod.Image = 77;
        } else {
          gameVars.Bod.Image = 76;
        }
      } else if (gameVars.Bod.Height == 16) {
        if (gameVars.Bod.Image == 70 || gameVars.Bod.Image == 71) {
          gameVars.Bod.Left -= 8;
        }
        if (gameVars.Bod.Image == 72 || gameVars.Bod.Image == 70) {
          gameVars.Bod.Image = 73;
        } else {
          gameVars.Bod.Image = 72;
        }
      }
    }
  }
  if (gameVars.pressedKeys.indexOf(38) != -1 && !gameVars.Falling) {
    //Up
    if (gameVars.Swimming) {
      gameVars.Bod.Top -= 4;
    }
    //if the bod is prone and only the up key is pressed:
    else if (gameVars.Bod.Height == 16 && gameVars.pressedKeys.length == 1) {
      //make the bod stand up
      gameVars.Bod.Height = 32;
      gameVars.Bod.Width = 28; //32
      gameVars.Bod.Top -= 16; //32-16
      //change the bod's image to the corresponding standing one
      if (gameVars.Bod.Image == 70) {
        gameVars.Bod.Image = 75;
      } else if (gameVars.Bod.Image == 71) {
        gameVars.Bod.Image = 74;
      } else if (gameVars.Bod.Image == 72) {
        gameVars.Bod.Image = 77;
      } else if (gameVars.Bod.Image == 73) {
        gameVars.Bod.Image = 76;
      }
      //should never see this!
      else {
        debugger;
        var stopHere = 0;
      }
    }
    // if the bod has a jetpack on:
    else if (gameVars.JetPack.On) {
      // 8 seems too slow, and 12 too fast!
      gameVars.Bod.Top -= 10;
      playSound('Jetpack');
    }
    // if the bod isn't jumping, falling, detonated, or swimming:
    else if (gameVars.Jumping == 0 && !gameVars.Falling && !gameVars.Detonated && !gameVars.Swimming) {
      if (gameVars.Jumping == 0) {
        gameVars.Jumping = 1;
      }
    }
  }
  if (gameVars.pressedKeys.indexOf(40) != -1 && !gameVars.Falling) {
    //Down
    if (gameVars.JetPack.On) {
      gameVars.Bod.Top -= 4;
    } else if (gameVars.Swimming) {
      gameVars.Bod.Top += 4;
    }
    //if the bod is standing:
    else if (gameVars.Bod.Height == 32) {
      gameVars.Bod.Height = 16;
      gameVars.Bod.Width = 44;//48
      gameVars.Bod.Top += 16;
      if (gameVars.Bod.Image == 74) {
        gameVars.Bod.Image = 71;
      } else if (gameVars.Bod.Image == 75) {
        gameVars.Bod.Image = 70;
      } else if (gameVars.Bod.Image == 76) {
        gameVars.Bod.Image = 73;
      } else if (gameVars.Bod.Image == 77) {
        gameVars.Bod.Image = 72;
      }
      //should never happen:
      else {
        debugger;
        var stopHere = 0;
      }
    }
  }
}
function moveLift(B, L, R) {
  var Lx, Lb, x;
  for (x = 1; x <= gameVars.LiftMap[gameVars.CurrentLevel][0]; x++) {
    Lx = Math.floor(gameVars.LiftMap[gameVars.CurrentLevel][x][5] / 16);
    Lb = Math.floor(gameVars.LiftMap[gameVars.CurrentLevel][x][6] / 16);
    if (!gameVars.UsedLift && B == Lb && (L == Lx || L == Lx + 1 || L == Lx + 2 || L == Lx + 3)) {
      //needs left and right as well....
      //Remove the Lift from the Collision Map:
      gameVars.CLevel[Lb][Lx] = 0;
      gameVars.CLevel[Lb][(Lx + 1)] = 0;
      gameVars.CLevel[Lb][(Lx + 2)] = 0;
      gameVars.CLevel[Lb][(Lx + 3)] = 0;
      //Move the Lift:  [[2] , [128,400,128,112,'up',128,400] , [704,304,704,208,'down',704,208]], // 04
      if (gameVars.LiftMap[gameVars.CurrentLevel][x][7] == 'up') {
        gameVars.LiftMap[gameVars.CurrentLevel][x][6] -= 16;
        gameVars.Bod.Top = gameVars.LiftMap[gameVars.CurrentLevel][x][6] - gameVars.Bod.Height;
        // + (3));
        if (gameVars.LiftMap[gameVars.CurrentLevel][x][6] == gameVars.LiftMap[gameVars.CurrentLevel][x][3]) {
          gameVars.LiftMap[gameVars.CurrentLevel][x][7] = 'down';
          gameVars.UsedLift = 1;
        }
      } else if (gameVars.LiftMap[gameVars.CurrentLevel][x][7] == 'down') {
        gameVars.LiftMap[gameVars.CurrentLevel][x][6] += 16;
        gameVars.Bod.Top = gameVars.LiftMap[gameVars.CurrentLevel][x][6] - gameVars.Bod.Height;
        // + (3));
        if (gameVars.LiftMap[gameVars.CurrentLevel][x][6] == gameVars.LiftMap[gameVars.CurrentLevel][x][1]) {
          gameVars.LiftMap[gameVars.CurrentLevel][x][7] = 'up';
          gameVars.UsedLift = 1;
        }
      }
      //renderFore();
      //redo these now that they have been moved:
      Lx = Math.floor(gameVars.LiftMap[gameVars.CurrentLevel][x][5] / 16);
      Lb = Math.floor(gameVars.LiftMap[gameVars.CurrentLevel][x][6] / 16);
      //Re-enter the Lifts into the Collision Map:
      gameVars.CLevel[Lb][Lx] = 62;
      gameVars.CLevel[Lb][(Lx + 1)] = 62;
      gameVars.CLevel[Lb][(Lx + 2)] = 62;
      gameVars.CLevel[Lb][(Lx + 3)] = 62;
    }
  }
}
function gravity() {
  // handle the floors and lack of them...
  if (gameVars.Detonated) {
    gameVars.Bod.Top -= 16;
  } else if (gameVars.Gloved != 'none' || gameVars.Swimming) {
    ;// Do nothing.. no gravity
  } else if (gameVars.Tramp[2]) {
    if (gameVars.Tramp[1] < gameVars.Tramp[0]) {
      gameVars.Bod.Top -= 4;
      gameVars.Tramp[1]++;
    } else if (gameVars.Tramp[1] == gameVars.Tramp[0]) {
      gameVars.Falling = 0;
      moveBod();
      gameVars.Tramp[1]++;
    } else {
      gameVars.Tramp[0] = 0;
      gameVars.Tramp[1] = 0;
      gameVars.Jumping = 1;
      gameVars.Falling = 0;
      gameVars.Tramp[2] = 0;
    }
  } else if (gameVars.Jumping > 0) {
    gameVars.UsedLift = 0;
    if (gameVars.Jumping <= 2) {
      gameVars.Jumping++;
      gameVars.Bod.Top -= 8;
    } else if (gameVars.Jumping >= 3 && gameVars.Jumping <= 6) {
      gameVars.Jumping++;
      // skip at apex to hover for a while
    } else if (gameVars.Jumping == 7) {
      gameVars.Jumping++;
      gameVars.Bod.Top += 8;
    } else {
      gameVars.Jumping = 0;
      gameVars.Bod.Top += 8;
      gameVars.Falling = 1;
    }
  } else {
    gameVars.Bod.Top += 4;
    // move Bod down 4px
  }
  renderFore();
}
function moveJetpack() {
  if (gameVars.JetPack.On) {
    if (gameVars.Bod.Image == 74 || gameVars.Bod.Image == 75) {
      if (gameVars.pressedKeys.indexOf(38) >= 0) {
        gameVars.JetPack.Image = 79;
      } else {
        gameVars.JetPack.Image = 78;
      }
      gameVars.JetPack.Left = (gameVars.Bod.Left + 28);
      gameVars.JetPack.Top = gameVars.Bod.Top;
    } else {
      if (gameVars.pressedKeys.indexOf(38) >= 0) {
        gameVars.JetPack.Image = 81;
      } else {
        gameVars.JetPack.Image = 80;
      }
      gameVars.JetPack.Left = (gameVars.Bod.Left - 12);
      gameVars.JetPack.Top = gameVars.Bod.Top;
    }
  }
}
function moveBoats() {
  var Lx, Lb, x, y;
  for (x = 1; x <= gameVars.BoatMap[gameVars.CurrentLevel][0]; x++) {
    Lx = Math.floor(gameVars.BoatMap[gameVars.CurrentLevel][x][5] / 16);
    Lb = Math.floor(gameVars.BoatMap[gameVars.CurrentLevel][x][6] / 16);
    //Remove the Boat from the Collision Map:
    gameVars.CLevel[Lb][Lx] = 0;
    gameVars.CLevel[Lb][(Lx + 1)] = 0;
    gameVars.CLevel[Lb][(Lx + 2)] = 0;
    //Move the Boat:  [1] , [48,416,800,416,'right',0,0,'']],
    if (gameVars.BoatMap[gameVars.CurrentLevel][x][7] == 'left') {
      gameVars.BoatMap[gameVars.CurrentLevel][x][5] -= 8;
      if (gameVars.BoatMap[gameVars.CurrentLevel][x][5] == gameVars.BoatMap[gameVars.CurrentLevel][x][0]) {
        gameVars.BoatMap[gameVars.CurrentLevel][x][7] = 'right';
      }
    } else if (gameVars.BoatMap[gameVars.CurrentLevel][x][7] == 'right') {
      gameVars.BoatMap[gameVars.CurrentLevel][x][5] += 8;
      if (gameVars.BoatMap[gameVars.CurrentLevel][x][5] == gameVars.BoatMap[gameVars.CurrentLevel][x][2]) {
        gameVars.BoatMap[gameVars.CurrentLevel][x][7] = 'left';
      }
    }
    //recalculate the Boat co-ordinates now that it has been moved:
    Lx = Math.floor(gameVars.BoatMap[gameVars.CurrentLevel][x][5] / 16);
    Lb = Math.floor(gameVars.BoatMap[gameVars.CurrentLevel][x][6] / 16);
    //Re-enter the Boat into the Collision Map:
    gameVars.CLevel[Lb][Lx] = 62;
    gameVars.CLevel[Lb][(Lx + 1)] = 62;
    gameVars.CLevel[Lb][(Lx + 2)] = 62;
  }
}
function moveEvils() {
  for (var x = 1; x <= gameVars.EvilMap[gameVars.CurrentLevel][0]; x++) {
    var clx7 = Math.floor(gameVars.EvilMap[gameVars.CurrentLevel][x][7] / 16);
    var clx6 = Math.floor(gameVars.EvilMap[gameVars.CurrentLevel][x][6] / 16);
    //Put back whatever was on the original Collision Map:
    gameVars.CLevel[clx7][clx6] = gameVars.EvilTemp[x][0];
    gameVars.CLevel[clx7][(clx6 + 1)] = gameVars.EvilTemp[x][1];
    gameVars.CLevel[(clx7 + 1)][clx6] = gameVars.EvilTemp[x][2];
    gameVars.CLevel[(clx7 + 1)][(clx6 + 1)] = gameVars.EvilTemp[x][3];
    gameVars.CLevel[clx7][(clx6 + 2)] = gameVars.EvilTemp[x][4];
    gameVars.CLevel[(clx7 + 1)][(clx6 + 2)] = gameVars.EvilTemp[x][5];
    //Move the Evil depending on it's direction:
    if (gameVars.EvilMap[gameVars.CurrentLevel][x][8] == 'right') {
      gameVars.EvilMap[gameVars.CurrentLevel][x][6] += 8;
      ;if (gameVars.EvilMap[gameVars.CurrentLevel][x][6] == gameVars.EvilMap[gameVars.CurrentLevel][x][2]) {
        gameVars.EvilMap[gameVars.CurrentLevel][x][8] = 'left';
      }
    } else if (gameVars.EvilMap[gameVars.CurrentLevel][x][8] == 'left') {
      gameVars.EvilMap[gameVars.CurrentLevel][x][6] -= 8;
      ;if (gameVars.EvilMap[gameVars.CurrentLevel][x][6] == gameVars.EvilMap[gameVars.CurrentLevel][x][0]) {
        gameVars.EvilMap[gameVars.CurrentLevel][x][8] = 'right';
      }
    } else if (gameVars.EvilMap[gameVars.CurrentLevel][x][8] == 'up') {
      gameVars.EvilMap[gameVars.CurrentLevel][x][7] -= 2;
      ;if (gameVars.EvilMap[gameVars.CurrentLevel][x][7] == gameVars.EvilMap[gameVars.CurrentLevel][x][1]) {
        gameVars.EvilMap[gameVars.CurrentLevel][x][8] = 'down';
      }
    } else if (gameVars.EvilMap[gameVars.CurrentLevel][x][8] == 'down') {
      gameVars.EvilMap[gameVars.CurrentLevel][x][7] += 2;
      ;if (gameVars.EvilMap[gameVars.CurrentLevel][x][7] == gameVars.EvilMap[gameVars.CurrentLevel][x][3]) {
        gameVars.EvilMap[gameVars.CurrentLevel][x][8] = 'up';
      }
    }
    //recalculate the Evil co-ordinates now that it has been moved:
    clx7 = Math.floor(gameVars.EvilMap[gameVars.CurrentLevel][x][7] / 16);
    clx6 = Math.floor(gameVars.EvilMap[gameVars.CurrentLevel][x][6] / 16);
    // Take note of what the Evil will be overwriting:
    gameVars.EvilTemp[x][0] = gameVars.CLevel[clx7][clx6];
    gameVars.EvilTemp[x][1] = gameVars.CLevel[clx7][(clx6 + 1)];
    gameVars.EvilTemp[x][2] = gameVars.CLevel[(clx7 + 1)][clx6];
    gameVars.EvilTemp[x][3] = gameVars.CLevel[(clx7 + 1)][(clx6 + 1)];
    gameVars.EvilTemp[x][4] = gameVars.CLevel[clx7][(clx6 + 2)];
    gameVars.EvilTemp[x][5] = gameVars.CLevel[(clx7 + 1)][(clx6 + 2)];
    // Overwrite the temporary Collision map with thie Evil's co-ordinates...
    gameVars.CLevel[clx7][clx6] = gameVars.EvilMap[gameVars.CurrentLevel][x][4];
    gameVars.CLevel[(clx7 + 1)][clx6] = gameVars.EvilMap[gameVars.CurrentLevel][x][4];
    gameVars.CLevel[clx7][(clx6 + 1)] = gameVars.EvilMap[gameVars.CurrentLevel][x][4];
    // was Math.floor(gameVars.EvilMap[gameVars.CurrentLevel][x][6] + 1) / 16) weirdly
    gameVars.CLevel[(clx7 + 1)][(clx6 + 1)] = gameVars.EvilMap[gameVars.CurrentLevel][x][4];
    if (gameVars.EvilMap[gameVars.CurrentLevel][x][4] > 44) {
      //for the 48px Evils! all but Evil1
      gameVars.CLevel[clx7][(clx6 + 2)] = gameVars.EvilMap[gameVars.CurrentLevel][x][4];
      gameVars.CLevel[(clx7 + 1)][(clx6 + 2)] = gameVars.EvilMap[gameVars.CurrentLevel][x][4];
    }
  }
}
function collision() {
  var gameBackContext2d = document.getElementById('GameBack').getContext('2d');

  //calculate the verticals - 3 squares max
  var T = Math.floor(gameVars.Bod.Top / 16);
  var B = Math.floor(((gameVars.Bod.Top + gameVars.Bod.Height) / 16));
  var M = (B - 1); //it'd either be the one between top and bottom, or top if crawling.
  //do the horizontals - 4 squares max.
  var L, Cl, Cr, R;
  //the bod's width is 28 but we want the bod's rightmost edge to be within the bod... so take a pixel off
  var bodWidth = gameVars.Bod.Width - 1;
  //calculate the horizontal squares that the bod is over
  if (gameVars.JetPack.On && (gameVars.Bod.Image == 76 || gameVars.Bod.Image == 77)) {
    //the jetpack on the left of the bod is 12 pixels wide.
    L = Math.floor(((gameVars.Bod.Left - 12) / 16));
    //the width already includes the jetpack
    R = Math.floor(((gameVars.Bod.Left - 12) + bodWidth) / 16);
    Cl = Math.floor(((gameVars.Bod.Left - 12) + (bodWidth / 3)) / 16);
    Cr = Math.floor(((gameVars.Bod.Left - 12) + (bodWidth / 1.5)) / 16);
  } else {
    L = Math.floor(gameVars.Bod.Left / 16);
    R = Math.floor((gameVars.Bod.Left + bodWidth) / 16);
    //includes the jetpack
    Cl = Math.floor((gameVars.Bod.Left + (bodWidth / 3)) / 16);
    Cr = Math.floor((gameVars.Bod.Left + (bodWidth / 1.5)) / 16);
  }
  //should never happen now
  if ((L + 1) < Cl) {
    L = Cl - 1;
  }
  //quick little fix in case Bod.top is -1 or 29..I think I saw that happen once...
  if (T < 0) {
    T = 0;
  }
  if (B > 28) {
    B = 28;
  }
  /*
    bodArea is a 4 across and 3 down array representing the area that the bod is occupying
    The bod is 32 pixels standing up, and pixels when lying down.
    T = top square
    M = middle "square"
  */
  var bodArea = [//4 x 3
      [gameVars.CLevel[T][L]
    , gameVars.CLevel[T][Cl]
    , gameVars.CLevel[T][Cr]
    , gameVars.CLevel[T][R]]

    , [gameVars.CLevel[M][L]
    , gameVars.CLevel[M][Cl]
    , gameVars.CLevel[M][Cr]
    , gameVars.CLevel[M][R]]

    , [gameVars.CLevel[B][L]
    , gameVars.CLevel[B][Cl]
    , gameVars.CLevel[B][Cr]
    , gameVars.CLevel[B][R]]
  ];

/*
  move the collision box to the new area where I 'think' the bod now is
*/

  //Check for ceiling... For now just do the GameArea Box...
  if (gameVars.Bod.Top < 1) {
    gameVars.Bod.Top = 0;
  }
  //Check for Walls... For now just do the GameArea Box...
  if (gameVars.Bod.Left < 1) {
    gameVars.Bod.Left = 0;
  } else if ((gameVars.Bod.Left + gameVars.Bod.Width) > (895)) {
    gameVars.Bod.Left = (896 - gameVars.Bod.Width);
  }
  //Gloves
  if (gameVars.Gloved == 'right') {
    gameVars.Bod.Left += 8;
  } else if (gameVars.Gloved == 'left') {
    gameVars.Bod.Left -= 8;
  }
  // Left Glove - account for the glove ending at 8 pixels into the 16 pixel block for 72px/80px
  if (!gameVars.Detonated &&
  (bodArea[0][0] === 68 && bodArea[0][1] === 68
   || bodArea[1][0] === 68 && bodArea[1][1] === 68)
  ) {
    if (gameVars.Gloved == 'left') {
      gameVars.Bod.Left += 16;
      gameVars.Gloved = 'none';
    } else {
      gameVars.Gloved = 'right';
      gameVars.Jumping = 0;
      gameVars.Detonated = 0;
      //if zooming up and hitting the glove, the glove takes over
      gameVars.Falling = 1;
      gameVars.Bod.Left += 8;
      gameVars.Bod.Top = (T * 16);
      if (gameVars.Bod.Height == 32) {
        if (gameVars.Bod.Image == 76 || gameVars.Bod.Image == 74) {
          gameVars.Bod.Image = 77;
        } else {
          gameVars.Bod.Image = 76;
        }
      } else if (gameVars.Bod.Height == 16) {
        if (gameVars.Bod.Image == 70 || gameVars.Bod.Image == 71) {
          gameVars.Bod.Left += 8;
        }
        if (gameVars.Bod.Image == 72 || gameVars.Bod.Image == 70) {
          gameVars.Bod.Image = 73;
        } else {
          gameVars.Bod.Image = 72;
        }
      }
    }
  }
  //if (TC == 67 || MC == 67 || TR == 67 || MR == 67) { // Right Glove
  if (!gameVars.Detonated &&
  (bodArea[0][3] === 67 && bodArea[0][2] === 67
   || bodArea[1][3] === 67 && bodArea[1][2] === 67)
  ) {
    // Right Glove
    if (gameVars.Gloved == 'right') {
      gameVars.Bod.Left -= 16;
      gameVars.Gloved = 'none';
    } else {
      gameVars.Gloved = 'left';
      gameVars.Jumping = 0;
      gameVars.Detonated = 0;
      //if zooming up and hitting the glove, the glove takes over
      gameVars.Falling = 1;
      gameVars.Bod.Left -= 8;
      gameVars.Bod.Top = (T * 16);
      if (gameVars.Bod.Height == 32) {
        if (gameVars.Bod.Image == 74 || gameVars.Bod.Image == 76) {
          gameVars.Bod.Image = 75;
        } else {
          gameVars.Bod.Image = 74;
        }
      } else if (gameVars.Bod.Height == 16) {
        if (gameVars.Bod.Image == 72 || gameVars.Bod.Image == 73) {
          gameVars.Bod.Left -= 8;
        }
        if (gameVars.Bod.Image == 70 || gameVars.Bod.Image == 72) {
          gameVars.Bod.Image = 71;
        } else {
          gameVars.Bod.Image = 70;
        }
      }
    }
  }
  // Diamonds:
  if (bodArea[0].indexOf(48) != -1 || bodArea[1].indexOf(48) != -1 || bodArea[2].indexOf(48) != -1) {
    //swimming/crawling seems bloxed in origional
    for (var x = 1; x <= gameVars.DiamondMap[gameVars.CurrentLevel][0]; x++) {
      if (collisionPickups(gameVars.DiamondMap[gameVars.CurrentLevel][x], T, M, B, L, Cl, Cr, R)) {
        //clear the thing
        gameBackContext2d.clearRect((gameVars.DiamondMap[gameVars.CurrentLevel][x][0] * gameVars.blockSize), (gameVars.DiamondMap[gameVars.CurrentLevel][x][1] * gameVars.blockSize), (32), gameVars.blockSize);
        gameVars.DiamondMap[gameVars.CurrentLevel][x][2] = 0;
        gameVars.CLevel[gameVars.DiamondMap[gameVars.CurrentLevel][x][1]][gameVars.DiamondMap[gameVars.CurrentLevel][x][0]] = 0;
        gameVars.CLevel[gameVars.DiamondMap[gameVars.CurrentLevel][x][1]][(gameVars.DiamondMap[gameVars.CurrentLevel][x][0] + 1)] = 0;
        gameVars.Diamonds++;
        playSound('Diamond');
        document.getElementById('Diamonds').innerHTML = 'Diamonds: ' + gameVars.Diamonds;
      }
    }
  }
  // Hearts:
  if (bodArea[0].indexOf(49) != -1 || bodArea[1].indexOf(49) != -1 || bodArea[2].indexOf(49) != -1) {
    for (x = 1; x <= gameVars.HeartMap[gameVars.CurrentLevel][0]; x++) {
      if (collisionPickups(gameVars.HeartMap[gameVars.CurrentLevel][x], T, M, B, L, Cl, Cr, R)) {
      //if ((gameVars.HeartMap[gameVars.CurrentLevel][x][1] == T || gameVars.HeartMap[gameVars.CurrentLevel][x][1] == M) && ((gameVars.HeartMap[gameVars.CurrentLevel][x][0] == L || gameVars.HeartMap[gameVars.CurrentLevel][x][0] == R) || (gameVars.HeartMap[gameVars.CurrentLevel][x][0] == L - 1 || gameVars.HeartMap[gameVars.CurrentLevel][x][0] == R - 1))) {
        //clear the thing
        gameBackContext2d.clearRect((gameVars.HeartMap[gameVars.CurrentLevel][x][0] * gameVars.blockSize), (gameVars.HeartMap[gameVars.CurrentLevel][x][1] * gameVars.blockSize), (32), gameVars.blockSize);
        gameVars.HeartMap[gameVars.CurrentLevel][x][2] = 0;
        gameVars.CLevel[gameVars.HeartMap[gameVars.CurrentLevel][x][1]][gameVars.HeartMap[gameVars.CurrentLevel][x][0]] = 0;
        gameVars.CLevel[gameVars.HeartMap[gameVars.CurrentLevel][x][1]][(gameVars.HeartMap[gameVars.CurrentLevel][x][0] + 1)] = 0;
        gameVars.Hearts++;
        playSound('Heart');
        document.getElementById('Hearts').innerHTML = 'Hearts: ' + gameVars.Hearts;
      }
    }
  }
  // Parachutes:
  if (bodArea[0].indexOf(50) != -1 || bodArea[1].indexOf(50) != -1 || bodArea[2].indexOf(50) != -1) {
    for (x = 1; x <= jscParachute[gameVars.CurrentLevel][0]; x++) {
      if (collisionPickups(jscParachute[gameVars.CurrentLevel][x], T, M, B, L, Cl, Cr, R)) {
      //if ((jscParachute[gameVars.CurrentLevel][x][1] == T || jscParachute[gameVars.CurrentLevel][x][1] == M) && ((jscParachute[gameVars.CurrentLevel][x][0] == L || jscParachute[gameVars.CurrentLevel][x][0] == R) || (jscParachute[gameVars.CurrentLevel][x][0] == L - 1 || jscParachute[gameVars.CurrentLevel][x][0] == R - 1))) {
        //clear the thing
        gameBackContext2d.clearRect((jscParachute[gameVars.CurrentLevel][x][0] * gameVars.blockSize), (jscParachute[gameVars.CurrentLevel][x][1] * gameVars.blockSize), (32), gameVars.blockSize);
        jscParachute[gameVars.CurrentLevel][x][2] = 0;
        gameVars.CLevel[jscParachute[gameVars.CurrentLevel][x][1]][jscParachute[gameVars.CurrentLevel][x][0]] = 0;
        gameVars.CLevel[jscParachute[gameVars.CurrentLevel][x][1]][(jscParachute[gameVars.CurrentLevel][x][0] + 1)] = 0;
        gameVars.Parachutes++;
        document.getElementById('Parachutes').innerHTML = 'Parachutes: ' + gameVars.Parachutes;
      }
    }
  }
  //Jetpacks:
  if (bodArea[0].indexOf(1) != -1 || bodArea[1].indexOf(1) != -1) {
    for (x = 1; x <= jscJetpack[gameVars.CurrentLevel][0]; x++) {
      if (collisionPickups(jscJetpack[gameVars.CurrentLevel][x], T, M, B, L, Cl, Cr, R)) {
      //if ((jscJetpack[gameVars.CurrentLevel][x][1] == T || jscJetpack[gameVars.CurrentLevel][x][1] == M) && ((jscJetpack[gameVars.CurrentLevel][x][0] == L || jscJetpack[gameVars.CurrentLevel][x][0] == R) || (jscJetpack[gameVars.CurrentLevel][x][0] == L - 1 || jscJetpack[gameVars.CurrentLevel][x][0] == R - 1))) {
        //clear the jetpack
        gameBackContext2d.clearRect((jscJetpack[gameVars.CurrentLevel][x][0] * gameVars.blockSize), (jscJetpack[gameVars.CurrentLevel][x][1] * gameVars.blockSize), gameVars.blockSize, gameVars.blockSize);
        gameVars.CLevel[jscJetpack[gameVars.CurrentLevel][x][1]][jscJetpack[gameVars.CurrentLevel][x][0]] = 0;
        if (!gameVars.JetPack.On) {
          //put the bod's jetpack on
          gameVars.JetPack.On = 1;
          //add the width of the jetpack to the bod's width
          gameVars.Bod.Width = 40; //the bod's own 28px + the jetpack's 12

          if (gameVars.Bod.Height == 16) {
            //make the bod's height 32 = standing up
            gameVars.Bod.Height = 32;
              gameVars.Bod.Top -= 16;
            //if bod is crouching and going left
            if (gameVars.Bod.Image == 70 || gameVars.Bod.Image == 71) {
              if (gameVars.Bod.Image == 70) {
                gameVars.Bod.Image = 75;
              } else {
                gameVars.Bod.Image = 74;
              }
              //place the jetpack on the left of the bod:
              gameVars.JetPack.Image = 79;
              gameVars.JetPack.Left = (gameVars.Bod.Left - 12) + 'px';
              gameVars.JetPack.Top = gameVars.Bod.Top + 'px';
            }//if bod is crouching and going right
            else if (gameVars.Bod.Image == 72 || gameVars.Bod.Image == 73) {
              //move the bod over by 12px to accomodate the jetpack.
              gameVars.Bod.Left += 12;
              if (gameVars.Bod.Image == 72) {
                gameVars.Bod.Image = 77;
              } else {
                gameVars.Bod.Image = 76;
              }
            }
              //place the jetpack on the right of the bod:
              gameVars.JetPack.Image = 81;
              gameVars.JetPack.Left = (gameVars.Bod.Left + 28) + 'px';
              gameVars.JetPack.Top = gameVars.Bod.Top + 'px';
          }

          //because the bod's dimentions have changed and the bod has moved, re-call collision()
          collision();
          //don't go any further on this version of the collision.
          break;
        }
      }
    }
  }
  /*
  //In case there has been something taken off, redo the collision bits now:
  TL = gameVars.CLevel[T][L];
  TC = gameVars.CLevel[T][C];
  TR = gameVars.CLevel[T][R];
  ML = gameVars.CLevel[M][L];
  MC = gameVars.CLevel[M][C];
  MR = gameVars.CLevel[M][R];
*/
  // Check for Laser thingy that takes the jetpack off...
  //if ((TL == 53 || TC == 53 || TR == 53 || ML == 53 || MC == 53 || MR == 53) && gameVars.JetPack.On) {
  if ((bodArea[0].indexOf(53) != -1 || bodArea[1].indexOf(53) != -1) && gameVars.JetPack.On) {
    gameVars.JetPack.On = 0;
    gameVars.Bod.Width = 28;
  }
  //Check for the SwimCrystal in Level 39...
  //if (MC == 69) {
  if (bodArea[0].indexOf(69) != -1 || bodArea[1].indexOf(69) != -1) {
    // put the bod clear of the massive SwimCrystal Picture
    gameVars.Bod.Top += 48;
    //only swimming
    gameVars.Swimming = 1;
    gameVars.Falling = 0;
    gameVars.Jumping = 0;
    //make the bod prone
    gameVars.Bod.Height = 16;
    gameVars.Bod.Width = 44;
    gameVars.Bod.Top += 16;

    if (gameVars.Bod.Image == 74 || gameVars.Bod.Image == 75) {
      if (gameVars.Bod.Image == 74) {
        gameVars.Bod.Image = 71;
      } else {
        gameVars.Bod.Image = 70;
      }
    } else if (gameVars.Bod.Image == 76 || gameVars.Bod.Image == 77) {
      gameVars.Bod.Left -= 16;
      if (gameVars.Bod.Image == 76) {
        gameVars.Bod.Image = 73;
      } else {
        gameVars.Bod.Image = 72;
      }
    }
  }
  //Check for Floor Tile:
  //if (
  //((BL == 2 || (BL > 4 && BL < 17) || BL == 51 || BL == 56 || BL == 62 || BL == 66) ||
  //(BC == 2 || (BC > 4 && BC < 17) || BC == 51 || BC == 56 || BC == 62) ||
  //(BR == 2 || (BR > 4 && BR < 17) || BR == 51 || BR == 56 || BR == 62 || BR == 66)) && gameVars.Gloved == 'none'
  //) {
  if (((bodArea[2][0] == 2 || (bodArea[2][0] > 4 && bodArea[2][0] < 17) || bodArea[2][0] == 51 || bodArea[2][0] == 56 || bodArea[2][0] == 62 || bodArea[2][0] == 66) || (bodArea[2][1] == 2 || (bodArea[2][1] > 4 && bodArea[2][1] < 17) || bodArea[2][1] == 51 || bodArea[2][1] == 56 || bodArea[2][1] == 62) || (bodArea[2][2] == 2 || (bodArea[2][2] > 4 && bodArea[2][2] < 17) || bodArea[2][2] == 51 || bodArea[2][2] == 56 || bodArea[2][2] == 62) || (bodArea[2][3] == 2 || (bodArea[2][3] > 4 && bodArea[2][3] < 17) || bodArea[2][3] == 51 || bodArea[2][3] == 56 || bodArea[2][3] == 62 || bodArea[2][3] == 66)) && gameVars.Gloved == 'none') {
    //now that the bod is on a floor:
    if (gameVars.Start.Waiting) {
      levelStartData();
    }
    if ((bodArea[2][0] == 62 && bodArea[2][3] == 62) && gameVars.Bod.Height == 32) {
      if (gameVars.UsedLift) {
        gameVars.Bod.Top = (T * 16);
        gameVars.Falling = 0;
      } else {
        moveLift(B, L, R);
        //shouldn't change
        gameVars.Falling = 1;
      }
    }//else if (((BL == 51 || BC == 51 || BR == 51) || (BL == 2 || BC == 2 || BR == 2)) && gameVars.Jumping > 0) {
    else if ((bodArea[2].indexOf(51) != -1 || bodArea[2].indexOf(2) != -1) && gameVars.Jumping > 0) {
      ;
    }// keep jumping and ignore the stairs
    //else if ((ML == 0 && MC == 0 && MC == 0 && TL == 0 && TC == 0 && TR == 0) && (ML != 47 && MC != 47 && MR != 47 && TL != 47 && TC != 47 && TR != 47) && gameVars.Detonated) {
    else if ((bodArea[1].indexOf(0) != -1 && bodArea[0].indexOf(0) != -1) && (bodArea[2].indexOf(47) == -1 && bodArea[0].indexOf(47) == -1) && gameVars.Detonated) {
      gameVars.Detonated = 0;
      gameVars.UsedLift = 0;
      gameVars.Bod.Top = (T * 16);
      gameVars.Falling = 0;
    } else if (!gameVars.Detonated) {
      gameVars.UsedLift = 0;
      gameVars.Bod.Top = (T * 16);
      gameVars.Falling = 0;
      //if (BC != 66 || gameVars.Bod.Height == 16) {
      if ((bodArea[2][1] != 66 && bodArea[2][2] != 66) || gameVars.Bod.Height == 16) {
        gameVars.Tramp[0] = 0;
        gameVars.Tramp[1] = 0;
        gameVars.Tramp[2] = 0;
      }
    }
  } else if ((((gameVars.Bod.Top + gameVars.Bod.Height) < 448) && gameVars.Jumping == 0) && !gameVars.JetPack.On && !gameVars.Swimming && !gameVars.Tramp[2]) {
    // For right now, this is the 'floor'
    gameVars.Falling = 1;
    gameVars.Tramp[0]++;
  } else {
    if (((gameVars.Bod.Top + gameVars.Bod.Height) > (447)) && !gameVars.Detonated) {
      gameVars.Bod.Top = (448 - gameVars.Bod.Height);
      gameVars.Falling = 0;
    }
  }
  //Trampoline - Only if standing - crouching done in floor checking.
  //if (BC == 66 && gameVars.Bod.Height == 32) {
  if ((bodArea[2][1] == 66 || bodArea[2][2] == 66) && gameVars.Bod.Height == 32) {
    var TmpNumber = Math.floor((gameVars.Tramp[0] + 1) / 4);
    gameVars.Tramp[0] = (4 + (4 * Math.floor((gameVars.Tramp[0] + 1) / 4)));
    gameVars.Tramp[1] = 1;
    gameVars.Tramp[2] = 1;
    gameVars.Falling = 1;
  }
  //Check for walking into a stair...
  if (//((TL == 2 || TC == 2 || TR == 2 || ML == 2 || MC == 2 || MR == 2) ||
  ((bodArea[0].indexOf(2) != -1 || bodArea[1].indexOf(2) != -1) || //(TL == 51 || TC == 51 || TR == 51 || ML == 51 || MC == 51 || MR == 51)
  (bodArea[0].indexOf(51) != -1 || bodArea[1].indexOf(51) != -1)) && (gameVars.Jumping == 0 || gameVars.Jumping > 11) && !gameVars.Detonated && gameVars.Gloved == 'none') {
    gameVars.Bod.Top -= 16;
    gameVars.Falling = 0;
  }


  //Detonator:
  if (gameVars.Gloved == 'none' &&
    (
      gameVars.Bod.Height === 32 &&
      ((bodArea[0][0] === 47 && bodArea[0][2] === 47)
      ||
      (bodArea[1][0] === 47 && bodArea[1][2] === 47))
    )
    ||
    (
      gameVars.Bod.Height === 16 &&
      (
        bodArea[0].indexOf(47) != -1 || bodArea[1].indexOf(47) != -1
      )
    )

  ) {
    gameVars.Detonated = 1;
    gameVars.Falling = 1;
    gameVars.Jumping = 0;
    gameVars.Gloved = 'none';
    //Level 01 has a detonator in the way.
    if (gameVars.Bod.Image == 70 || gameVars.Bod.Image == 71) {
      gameVars.Bod.Height = 32;
      gameVars.Bod.Width = 28;
      gameVars.Bod.Top -= 16;

      if ((gameVars.Bod.Left % 16) == 0) {
        gameVars.Bod.Image = 75;
      } else if ((gameVars.Bod.Left % 16) != 0) {
        gameVars.Bod.Image = 74;
      }
    } else if (gameVars.Bod.Image == 72 || gameVars.Bod.Image == 73) {
      gameVars.Bod.Height = 32;
      gameVars.Bod.Width = 28;
      gameVars.Bod.Top -= 16;
      gameVars.Bod.Left += 16;

      if ((gameVars.Bod.Left % 16) != 0) {
        gameVars.Bod.Image = 77;
      } else if ((gameVars.Bod.Left % 16) == 0) {
        gameVars.Bod.Image = 76;
      }
    }
    //don't check for anything else - level 22 had a detonator right beside a down arrow!
    return;
  }

  //Arrows:
  if ((//Down Arrow:
  //MC == 42 ||
  bodArea[1].indexOf(42) != -1 || //Left Arrow:
  //(((TC == 43 || MC == 43) && (gameVars.Bod.Image == 70 || gameVars.Bod.Image == 71 || gameVars.Bod.Image == 74 || gameVars.Bod.Image == 75)) ||
  (((bodArea[0].indexOf(43) != -1 || bodArea[1].indexOf(43) != -1) && (gameVars.Bod.Image == 70 || gameVars.Bod.Image == 71 || gameVars.Bod.Image == 74 || gameVars.Bod.Image == 75)) || //Right arrow:
  //((TC == 44 || MC == 44) && (gameVars.Bod.Image == 72 || gameVars.Bod.Image == 73 || gameVars.Bod.Image == 76 || gameVars.Bod.Image == 76)) &&
  ((bodArea[0].indexOf(44) != -1 || bodArea[1].indexOf(44) != -1) && (gameVars.Bod.Image == 72 || gameVars.Bod.Image == 73 || gameVars.Bod.Image == 76 || gameVars.Bod.Image == 76)) && !gameVars.Jumping))//Up Arrow:
  //|| TC == 45
  || bodArea[0].indexOf(45) != -1) {
    for (x = 1; x <= jscArrow[gameVars.CurrentLevel][0]; x++) {
      var AL = jscArrow[gameVars.CurrentLevel][x][1]
        , AT = jscArrow[gameVars.CurrentLevel][x][2];
      if ((AT == T || AT == M || AT == B) && //((AL == L || AL == C || AL == R) || (AL == (L - 1) || AL == (C - 1) || AL == (R - 1)))
      ((AL == L || AL == Cl || AL == Cr || AL == R))) {
        //document.getElementById('Diamonds').innerHTML = 'Goto Level ' + jscArrow[gameVars.CurrentLevel][x][3];
        if (jscArrow[gameVars.CurrentLevel][x][0] == 42) {
          //down
          gameVars.Bod.Top = 12;
          // Down
        } else if (jscArrow[gameVars.CurrentLevel][x][0] == 43) {
          // Left
          gameVars.Bod.Left = (896 - gameVars.Bod.Width);
        } else if (jscArrow[gameVars.CurrentLevel][x][0] == 44) {
          // Right
          gameVars.Bod.Left = 0;
        } else if (jscArrow[gameVars.CurrentLevel][x][0] == 45) {
          //up
          gameVars.Bod.Top = (448 - (gameVars.Bod.Height - 16));
          gameVars.Detonated = 1;
          gameVars.Jumping = 0;
        }
        if (gameVars.JetPack.On && (jscArrow[gameVars.CurrentLevel][x][0] == 44 || jscArrow[gameVars.CurrentLevel][x][0] == 43)) {
          gameVars.Bod.Left += 12;
          // Right
        }
        gameVars.CurrentLevel = jscArrow[gameVars.CurrentLevel][x][3];
        loadStartCheck();
        loadLevel();
        break;
      }
    }
  }
  //Teleports:
  //if (MC == 64) { // for now just check for that...
  if (bodArea[1].indexOf(64) != -1 || bodArea[1].indexOf(65) != -1) {
    for (x = 0; x < 13; x++) {
      if (jscTeleport[x][0] == gameVars.CurrentLevel) {
        if (gameVars.CurrentLevel == 49 && gameVars.Diamonds == 395) {
          // Game Complete...
          gameVars.CurrentLevel = 0;
          gameVars.Bod.Left = 780;
          gameVars.Bod.Top = 302;
        } else {
          gameVars.CurrentLevel = jscTeleport[x][1];
        }
        gameVars.Bod.Left = jscTeleport[x][2];
        gameVars.Bod.Top = jscTeleport[x][3];
        if (gameVars.CurrentLevel == 4) {
          gameVars.JetPack.On = 0;
          gameVars.Bod.Width = 28;
        } else if (gameVars.CurrentLevel == 28) {
          gameVars.Detonated = 0;
        } else if (gameVars.CurrentLevel == 43) {
          gameVars.Swimming = 0;
          gameVars.Bod.Height = 32;
          gameVars.Bod.Width = 28;
          gameVars.Bod.Top -= 16;
          if (gameVars.Bod.Image == 70) {
            gameVars.Bod.Image = 75;
          } else {
            gameVars.Bod.Image = 74;
          }
        }
        loadStartCheck();
        loadLevel();
        break;
      }
    }
  }
  //Completion Condtion!
  if (gameVars.CurrentLevel == 0 && gameVars.Diamonds == 395 && (bodArea[1].indexOf(3) != -1)) {
    // you've picked up all Diamonds and are standing in the endgame Teleporter!
    //Unfortunately, I dont know what the end looks like!!!
    alert('Awesome!!! You have completed this remake of QL Cavern.');
  }
  if (gameVars.Gloved == 'none') {
    checkForDeath(bodArea);
  }
/*
  //WTF is happening... display it for debugging etc...
  var zStuff = 'Jumping:' + gameVars.Jumping + ' | Falling:' + gameVars.Falling +
  '<br/>Tramp[0]: ' + gameVars.Tramp[0] + ' | Tramp[1]: ' + gameVars.Tramp[1] + ' | Tramp[2]: ' + gameVars.Tramp[2] +
  '<br/>';

  for (var x = 0; x< gameVars.pressedKeys.length; x++) {
    zStuff += 'Key ' + x + ': ' + gameVars.pressedKeys[x];
  }

  if (gamePadVars[0]) {
    zStuff +=  '<br/><br/>'
    for (var x = 0; x< gamePadVars[0].buttons.length; x++) {
      if (gamePadVars[0].buttons[x].value) {
        zStuff += 'Button ' + x + ': ' + gamePadVars[0].buttons[x].value;
      }
    }
  }

  zStuff +=  '<br/> Bod.Left:' + (gameVars.Bod.Left) + ' | Bod.Top:' + gameVars.Bod.Top
  + '<br/>TL: ' + bodArea[0][0] + ' | TCl: ' + bodArea[0][1] + ' | TCr: ' + bodArea[0][2] + ' | TR: ' + bodArea[0][3]
  + '<br/>ML: ' + bodArea[1][0] + ' | MCl: ' + bodArea[1][1] + ' | MCr: ' + bodArea[1][2] + ' | MR: ' + bodArea[1][3]
  + '<br/>BL: ' + bodArea[2][0] + ' | BCl: ' + bodArea[2][1] + ' | BCr: ' + bodArea[2][2] + ' | BR: ' + bodArea[2][3]
  + '<br/>Bod.Image:' + gameVars.Bod.Image;

  zStuff += '<br/> Level: ' + gameVars.CurrentLevel;

  var as = document.getElementById('Score');
  as.innerHTML = zStuff;
  as.style.position = 'absolute';
  as.style.width = '100%';
  as.style.top = '0';
  as.style.left = '0';
*/
}

function collisionPickups(a, T, M, B, L, Cl, Cr, R) {
  //is this object within the bod's bounds?
  return (
    // check for verticals
    (a[1] == T || a[1] == M || a[1] == B)
     && // both must match
    // check for horizontals
    (a[0] == L - 1 || a[0] == L || a[0] == Cl || a[0] == Cr || a[0] == R)
  );
}

function checkForDeath(bodArea) {
  // Bottoms are not death as you are not touching them... wait until you go THROUGH!
  var bodDead = 0;
  for (var x = 0; x < 2; x++) {
    for (var y = 0; y < 4; y++) {
      if (
        !gameVars.Detonated && ((bodArea[x][y] > 3 && bodArea[x][y] < 42) || bodArea[x][y] === 66)
        || bodArea[x][y] === 46 || bodArea[x][y] === 55 || (bodArea[x][y] > 56 && bodArea[x][y] < 64)
      )  {
        bodDead = 1;
        break;
      }
    }
  }
  if (bodDead) {
    playSound('Death');
    gameVars.Hearts--;
    if (gameVars.Hearts < 0) {
      //Game over!!!
      document.getElementById('Hearts').innerHTML = 'Hearts: x';
      gameVars.paused = 1;
      gameVars.deathKeys.push(80);
      menuShow();
    } else {
      //Lose a Life/Heart
      document.getElementById('Hearts').innerHTML = 'Hearts: ' + gameVars.Hearts;
      gameVars.Bod.Left = parseInt(gameVars.Start.Left, 10);
      gameVars.Bod.Top = parseInt(gameVars.Start.Top, 10);
      gameVars.Bod.Height = parseInt(gameVars.Start.Height, 10);
      gameVars.Bod.Width = parseInt(gameVars.Start.Width, 10);
      gameVars.Detonated = parseInt(gameVars.Start.Detonated, 10);
      gameVars.JetPack.On = parseInt(gameVars.Start.JetPack.On, 10);
      gameVars.Bod.Image = parseInt(gameVars.Start.Image, 10);
      gameVars.Jumping = 0;
      //copy the current inputs - these imputs will be ignored until they stop.
      gameVars.deathKeys = gameVars.pressedKeys.slice(0);
      gameVars.pressedKeys = [];
      loadLevel();// to replace Jetpacks and Parachutes
    }
  }
}

function loadStartCheck() {
  //make the bod falling if not detonated or jetpack.On and do the start stuff when bod lands.
  // if not swimming or jetpack, then falling, and add the start data when falling = false
  if (gameVars.JetPack.On || gameVars.Swimming) {
    //immediately copy the bod's data to Start
    levelStartData();
  } else {
    // wait until the bod reaches a floor - assume bod can never fall on to death!
    gameVars.Falling = 1;
    gameVars.Start.Waiting = 1;
  }
}


function soundInit() {
  audioCtx = new window.AudioContext()
  audioVolume = audioCtx.createGain();
  //now that the audio has ben initialized, run the app.
  //runApp();
}
function soundVolUpdate() {
  audioVolume.gain.value = globVol;
}
function soundPlay(a) {
  if (a && !isMuted) {
    var newSound = audioCtx.createBufferSource();
    var newGain = audioCtx.createGain();
    //specify the sound buffer to use
    //newSound.buffer = audioSprite;
    newSound.buffer = gameVars[a].src;
    //connect the volume to the audiobuffer
    newSound.connect(audioVolume);
    //connect the gain to the destination
    newGain.connect(audioCtx.destination);
    //set the (gain) volume of the sound
    newGain.gain.value = soundVol(gameVars.aVolume);
    //play the sound, specifying when to start and how long to play for
    //newSound.start(0, a.aStart, a.aDuration);//  - audioCtx.currentTime
    newSound.start(); //play all from the start instantly.
  }
}

function soundVol(num) {
  if (globVol == 0) {
    return 0;
  }
  else {
    num *= (globVol / 100); //make the volume comform to the globally set volume
    return (num * .5); //make it half loud again.
  }
}

function initSound() {
  for (const zElem of zAudios) {
    gameVars[zElem] = document.createElement('audio');
    //could just use mp3 but firefox STILL doesn't allow native
    //even though the patents ran out. It supports through OS.
    gameVars[zElem].src = 'audio/' + zElem + '.mp3';
    gameVars[zElem].src = 'audio/' + zElem + '.ogg';

    gameVars[zElem].volume = 0.01; //pretty much inaudable!
    gameVars[zElem].play(); //make sure everything is loaded up
  }
  //isMuted is -1 but now that the audios are initialized, set it to 0
  isMuted = 0;
  //put the volumes to where they should be after 2 seconds.
  window.setTimeout(function() {
    updateSoundVolume();
  }, 2000);
}
function playSound(zElem) {
  gameVars[zElem].pause();
  //if (gameVars[zElem].readyState > 0) {
    gameVars[zElem].currentTime = 0;
  //}

  try {
    gameVars[zElem].play();
  }
  catch (e) {
    debugger;
  }
}

function updateSoundVolume() {
  for (const zElem of zAudios) {
    gameVars[zElem].volume = gameVars.aVolume;
  }
}

//from globalscripts  2019-09-27:


function addEventListeners() {
  //let's useCapture on these :D
  window.addEventListener('resize', reScale, true);
  window.addEventListener('contextmenu', bubbleStop, true);
  window.addEventListener('dblclick', bubbleStop, true);
  window.addEventListener('wheel', mouseWheel, true);
  window.addEventListener('touchstart', touchDown, true);
  window.addEventListener('touchmove', touchMove, true);
  window.addEventListener('touchcancel', touchUp, true);
  window.addEventListener('touchend', touchUp, true);
  window.addEventListener('touchleave', touchUp, true);
  window.addEventListener('mousedown', mouseDown, true);
  window.addEventListener('mousemove', mouseMove, true);
  window.addEventListener('mouseup', mouseUp, true);
  window.addEventListener('keydown', keyDown, true);
  window.addEventListener('keyup', keyUp, true);
  window.addEventListener('beforeunload', stopTimer, true);
}
function bubbleStop(e) {
  //apparently this should NEVER fail
  e.stopPropagation(); //stop the event bubbling

  //stopping the event/browser's default
  if (e.cancelable) {
    e.preventDefault();//stop browser doing it's default action.
  }
}
function findTarget(e) {
  if (!e) {
    e = window.event;
  }
  var targ = e.target || e.srcElement;
  if (targ.nodeType != 1) {
    //element nodes are 1, attribute, text, comment, etc. nodes are other numbers... I want the element.
    targ = targ.parentNode;
  }
  return targ;
}

function mouseClear() {
  if (mouseVars.clickTimer) {
    window.clearTimeout(mouseVars.clickTimer);
  }
  mouseVars = {
      button: null
    , type: null
    , cursorStyle: null
    , clickTimer: null
    , current:{target:null, time:null, x:null, y:null}
    , last:{target:null, time:null, x:null, y:null}
    , start:{target:null, time:null, x:null, y:null}
    , moved: 0
  }
  document.body.style.cursor = 'default';
}

function scrollClear() {
  scrollVars = {
    targ: null,
    leftDiff: null,
    TopDiff: null,
  }
}

function stopTimer() {
  //stop the timer ticks
  clearInterval(gameVars.tickTimer);
}
function timerUpdate() {
  //when the user changes the speed of the game, update it here:
  //first stop the timer:
  stopTimer();
  //then create a new version of the timer with the updated speed:
  gameVars.tickTimer = setInterval(mainLoop, gameVars.gameSpeed);
}


function gamePadUpdate() {
  var gamePads = navigator.getGamepads();
  for (var x = 0; x < gamePads.length; x++) {
    if (gamePads[x]) {
      //only add if the gamepad exists - NOT FOOLPROOF!
      //initialize/clear the gamePadVar
      gamePadVars[x] = [];
      //only shallow-copy the buttons and axes - don't need the rest (yet!)
      gamePadVars[x].buttons = gamePads[x].buttons.slice(0);
      gamePadVars[x].axes = gamePads[x].axes.slice(0);
    }
  }
}
function gamePadsButtonEventCheck() {
  //only worry about gamePadVar[0] for this version
  var oldButtons = []
  if (gamePadVars[0]) {
    //shallow-copy cos it is an (object) array:
    for (var x = 0; x < gamePadVars[0].buttons.length; x++) {
      oldButtons[x] = gamePadVars[0].buttons[x].pressed;
    }
  }
  gamePadUpdate();
  //if there is at least 1 gamepad being used:
  if (gamePadVars[0]) {
    //if there has been any change to the buttons:
    if (oldButtons.length === gamePadVars[0].buttons.length) {
      //cycle through the newButtons, comparing them to the oldButtons
      for (var x = 0; x < gamePadVars[0].buttons.length; x++) {
        if (oldButtons[x] !== gamePadVars[0].buttons[x].pressed) {
          if (gamePadVars[0].buttons[x].pressed) {
            gamePadsButtonDown(x);
          } else {
            gamePadsButtonUp(x);
          }
          anEvent();
        }
      }
    }
  }
  //because there are no events for a gamepad, I must check for them myself...

  if (gamePadVars[0]) {
    //use animationFrame when there is a gamepad being used.
    window.requestAnimationFrame(function() {
      gamePadsButtonEventCheck();
    });
  } else {
    //there are no current gamepads, so just check for a new one every second.
    window.setTimeout(function() {
      gamePadsButtonEventCheck();
    }, 1000);
  }
}
function keyNum(e) {
  return e.keyCode || window.event.keyCode;
}
function keyDown(e) {
  var theKey = keyNum(e);
  if (!document.activeElement.classList.contains('editEnable')) {
    if (keysIgnore.indexOf(theKey) === -1) {
      if (isMuted === -1) {
        initSound();
      }
      else {
        bubbleStop(e);
      }

      //simply add the newly pressed key into the keysCurrent array.
      keyVars.push(theKey);
      keyDownGameEvents(theKey);
      anEvent();
    }
  }
  else {
    //if user presses Return or Tab, remove input focus.
    if (theKey == 13 || theKey == 9) {
      if (isMuted === -1) {
        initSound();
      }
      else {
        bubbleStop(e);
      }
      document.activeElement.blur();
    }
    else {
      keyDownEvents();
    }
  }
}
function keyUp(e) {
  var theKey = keyNum(e);
  if (!document.activeElement.classList.contains('editEnable')) {
    if (keysIgnore.indexOf(theKey) === -1) {
      bubbleStop(e);
      while (keyVars.indexOf(theKey) != -1) {
        //updates array length while delete() doesn't
        keyVars.splice(keyVars.indexOf(theKey), 1);
      }
      keyUpGameEvents(theKey);
      anEvent();
    }
  }
  else {
    keyUpEvents();
  }
}
function mouseDown(e) {
  var targ = findTarget(e);

  mouseVars.button = null == e.which ? e.button : e.which;
  mouseVars.type = 'click';
  mouseVars.clickTimer = window.setTimeout(function() {
    mouseLongClick()
  }, 500);
  mouseVars.current.target = targ;
  mouseVars.current.time = new Date().getTime();
  mouseVars.current.x = e.clientX;
  mouseVars.current.y = e.clientY;
  mouseVars.last.target = targ;
  mouseVars.last.time = new Date().getTime();
  mouseVars.last.x = e.clientX;
  mouseVars.last.y = e.clientY;
  mouseVars.start.target = targ;
  mouseVars.start.time = new Date().getTime();
  mouseVars.start.x = e.clientX;
  mouseVars.start.y = e.clientY;

  if (targ.classList.contains('editEnable')) {
    return;
  }

  if (isMuted === -1) {
    initSound();
  }
  else {
    bubbleStop(e);
  }

  mouseDownEvents();
  anEvent();
}
var mMoved = 0;
function mouseMove(e) {
  //make sure that only one mouse movement is done per frame to reduce cpu usage.
  if (mouseVars.moved) {
    alert('movedFast');
    return;
  }
  mMoved = 1;
  window.requestAnimationFrame(function() {
    mMoved = 0;
  });


  var zTime = new Date().getTime();

  var targ = findTarget(e);

  if (mouseVars.current.target) {
    if (mouseVars.current.target.classList.contains('editEnable')) {
      mouseVars.current = {target:targ, time:zTime, x:e.clientX, y:e.clientY};
      return;
    }
  }

  bubbleStop(e);

  //update the last mouse events - copy current to last
  mouseVars.last = {
      target:mouseVars.current.target
    , time:mouseVars.current.time
    , x:mouseVars.current.x
    , y:mouseVars.current.y};
  //then update current.
  mouseVars.current = {target:targ, time:zTime, x:e.clientX, y:e.clientY};

  //now the mouse version
  if (mouseVars.current.target !== mouseVars.last.target){
    if (mouseVars.type === 'click') {
      mouseVars.type = 'drag';
      window.clearTimeout(mouseVars.clickTimer);
    }
    if (mouseVars.last.target) {
      mouseMoveOut(mouseVars.last.target, e);
    }
    if (targ) {
      mouseMoveEnter(targ, e);
    }
  }

  //now onmouseover - this one is done always.
  mouseMoveOver(targ, e);

  mouseMoveEvents();
}
function mouseUp(e) {
  if (mouseVars.current.target == null || mouseVars.current.target.classList.contains('editEnable')) {
    return;
  }
  //if the pointer is not on an input, take the focus off of
  //the focused element. This should remove focus from input elements
  //when the user clicks off of them.
  document.activeElement.blur();

  bubbleStop(e);
  mouseUpEvents();
  //do any mouseup stuff here, eg. flinging or animated panning
  if (mouseVars.type == 'click') {
    if (mouseVars.button == 1) {
      mouseClick();
    } else if (mouseVars.button == 2) {
      mouseLongClick();
    }
  }

  mouseClear();
  anEvent();
}
function mouseWheel(e) {//for zooming in/out, changing speed, etc.
  var targ = findTarget(e);

  bubbleStop(e);

  var delta = e.deltaY ? -e.deltaY : e.wheelDelta;
  delta = delta > 0 ? 1 : -1;

  mouseWheelEvents(targ, delta);

}

function mouseClick() {
  var targID = mouseVars.current.target.id;
  /*if (targID.slice(0, 4) === 'stor') { //storage question.
    storageChoose(targID.slice(-1));
    upNotClose();
  } else */if (targID === 'fsI' || targID === 'fs') {//fullscreen button
    fullScreenToggle();
  } else {
    mouseClickEvents();
  }
}
function mouseLongClick() {//this is also the right-click.
//for right click, and long taps.
}
function touchChange(e) {
  return {
    button: 1
    /* moving outside the body/window will give null for elementFromPoint */
  , target: (document.elementFromPoint(e.clientX, e.clientY) || e.target)
  , id: e.identifier
  , clientX: e.clientX
  , clientY: e.clientY
  , preventDefault: function() {}
  , stopPropagation: function() {}
  };
  //return a new event object back with only the things I want in it :)
}
function touchDown(e) {
  var cTouches = e.changedTouches;
  for (var x = 0; x < cTouches.length; x++) {
    var zID = cTouches[x].identifier;
    touchVars[zID] = touchChange(cTouches[x]);
    //would overwrite existing event if a finger was not deleted - from aen error for example.
    if (touchVars[zID].target) {
      if (zID == 0) {
        if (!touchVars[zID].target.classList.contains('editEnable')) {
          if (isMuted === -1) {
            initSound();
          }
          else {
            bubbleStop(e);
          }
          //should change the mouse cursor if needed.
          mouseMove(touchVars[zID]);
          //only do the mouse events on the first finger.
          mouseDown(touchVars[zID]);
        }
      }
      else {
        bubbleStop(e);
      }
    }
  }
}
function touchMove(e) {
  bubbleStop(e);
  var cTouches = e.changedTouches;

  for (var x = 0; x < cTouches.length; x++) {
    var zID = cTouches[x].identifier;
    if (zID >= 0) {
      //touchVars.splice(zID, 1, touchChange(cTouches[x]));
      // swap in the new touch record
      //why not do:
      touchVars[zID] = touchChange(cTouches[x])
    }

    if (zID == 0) {
      if (!touchVars[zID].target.classList.contains('editEnable')) {
        bubbleStop(e);
        //only do the mouse events on the first finger.
         mouseMove(touchVars[zID]);
      }
    }
    else {
      bubbleStop(e);
    }
  }
}
function touchUp(e) {
  var cTouches = e.changedTouches;
  //new array for all current events
  for (var x = 0; x < cTouches.length; x++) {
    var zID = cTouches[x].identifier;
    if (zID >= 0) {
      if (touchVars[zID]) {
        mouseMoveOut(touchVars[zID].target, e);
      } else {
        touchVars[zID].target = document.body;
        console.log('touchEnd touchVars[zID] false!!!!');
      }

      if (zID == 0) {
        if (!touchVars[zID].target.classList.contains('editEnable')) {
          bubbleStop(e);
          mouseUp(touchVars[zID]);
        }
      } else {
        bubbleStop(e);
      }

      //should change the mouse cursor if needed.
      delete touchVars[zID];
    }
  }
}

function findUpperScrollable(targ) {
  /*
    Go through the parentNodes of the targ element,
    making a note of each element as we go,
    until we reach the outermost element that
    has 'letScroll' in its classList.
    Make targ that element.
  */
  if (targ.parentNode) {
    while (targ.parentNode.classList.contains('letScroll')) {
      targ = targ.parentNode;
      //check whether there is another parentNode!
      if (!targ.parentNode) {
        break;
      }
    }
  }
  return targ;
}



// a copy of an events file that links to inputs
function keyDownEvents() {
  //this is for an editEnable input element
}
function keyDownGameEvents(theKey) {
  //this is for in-game events.
}
function keyUpEvents() {
  //this is for an editEnable input element
}
function keyUpGameEvents(theKey) {
  //this is for in-game events.
  if (gameVars.paused) {
    if (theKey === 32 || theKey === 13) {
      //button A - select...
      menuSelect();
    }
    //needs work probably, but if user lets up, allow user to move menu again.
    gameVars.menuMove = 0;
  }

}
function mouseClickEvents() {
  if (document.getElementById('menu') && mouseVars.current.target.id.slice(0,2) === 'm-') {
    menuSelect();
  }
}
function mouseDownEvents() {
  //custom mouse/touch down events for your app go here
}
function mouseMoveEvents() {
  //custom mouse/touch move events for your app go here
}
function mouseMoveEnter(targ, e) {
  /*
   * use this for hovering over things.
   * eg. when you enter a new thing, highlight it.
  */
  if (document.getElementById('menu') && targ.id.slice(0,2) === 'm-' && targ.style.opacity != 0.4) {
    //enumerate all menuSelected elements
    var SMI = document.getElementById('menu').getElementsByClassName('menuSelected');
    for (const a of SMI) {
      //remove the menu item's selected class
      a.classList.remove('menuSelected');
    }
    //now add the selected class to the element currently hovered over.
    targ.classList.add('menuSelected');
  }
}
function mouseMoveOut(targ, e) {
  /*
   * opposite of enter...
   * eg. unhighlight something as the mouse moves off of it.
   *
  */
}
function mouseMoveOver(targ, e) {
  /*
   * for actively tracking while on an object.
   * eg. moving, dynamic tooltip.
  */
}
function mouseUpEvents() {
  //custom mouse/touch up events for your app go here
}

function mouseWheelEvents(targ, d) {
  //mouse scrolling through'letScroll' is handled by globalScripts.
}

function gamePadsButtonDown(zButton) {
  //custom gamepad button down events for your app go here
  if (isMuted === -1) {
    initSound();
  }
}
function gamePadsButtonUp(zButton) {
  //custom gamepad button down events for your app go here
  if (zButton === 0 && gameVars.paused) {
    //button A - select...
    menuSelect();
  }
}

function anEvent() {
  /*
    this one is for evergy-saving with static games.
    If your game waits for an input and then does something,
    then put something here to set it going.
  */

  /*
    If your game has a running animation loop, you can use this var
    in your main loop to trigger stuff happening!
  */
  //gameVars.go = 1; //obviously, you can call it whatever you want...lol
}


function resizeEvents() {
  //resizeRatio(16, 9); //for making it a specific aspect ratio...
}
//This should be the only function that has to be edited for sliders :)
function sliderEvents(sliderPercent, sve) {

}



// fullscreen handling from webtop then simplified for this project...
function fullScreenToggle() {
  var isFS = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
  if (isFS) {
    killFS.call(document, function() {});
    if (document.getElementById('fs')) {
      document.getElementById('fs').classList.remove('fsd')
      document.getElementById('fs').classList.add('fsu');
    }
  } else {
    getFS.call(document.documentElement, function() {});
    if (document.getElementById('fs')) {
      document.getElementById('fs').classList.remove('fsu')
      document.getElementById('fs').classList.add('fsd');
    }
  }
}

// save and load from globalscripts (2019-10-02)

function storageCheck() {
  try {
    if (window.localStorage) {
      if (window.localStorage.length) {
        //something is stored
        var dataToLoad = storageLoad('AllowSave');
        if (dataToLoad == 1) {
          //user has said YES to saving.
          saveY = 1;
        } else if (dataToLoad == 0) {
          //user has said NO to saving.
          saveY = -1;
        } else {
          //either there is nothing saved yet, or something is amiss!
          saveY = 0;
        }
      } else {
        saveY = 0;
      }
    }
    else {
      upNotOpen('Saving appears to be unavailable in this browser.<br>Please try enabening cookies for this page.','');
      saveY = -1;
    }
  }
  catch(e) {
    upNotOpen('Saving appears to be unavailable in this browser. <br>Please try enabening cookies for this page.','');
    saveY = -1;
  }
}
function storageChoose(zChoice) {
  if (zChoice === 'Y') {
    var a = saveY[0]
      , b = saveY[1];
    saveY = 1;
    storageSave('AllowSave', 1);
    storageSave(a, b);
  } else {
    //disable saving for this session.
    saveY = -1;
  }
  //later on if it is called for by anyone, I can add a 'never' save that disables saving, except for saving the preference to never save :D
  upNotClose();
}
function storageLoad(toLoad) {
  if (saveY !== -1) {
    var dataToLoad = 0;

    try {
      dataToLoad = window.localStorage.getItem(zAppPrefix + toLoad);
    } catch (ex) {}

    return dataToLoad;
  }
}
function storageSave(toSave, dataToSave) {
  if (saveY !== -1) {
    //user must have selected to save the game... so there is the user's choice.
    window.localStorage.setItem(zAppPrefix + toSave, dataToSave);
    if (saveY === 0) {
      saveY = 1;
      storageSave('AllowSave', 1);
    }
  }
}

function upNotCheck(msg) {
  //wait for everything to load and the webapp to be displayed.
  if (!document.getElementById('loading')) {
    //the main content has been added to the document, so it
    //is safe to add the 'toast' popup now.
    if (msg.length < 3) {
      if (msg === 'i') {
        if (isUpdating === 'u') {
          // replace the changelog with the newest verion.
          fReplaceSimple("texts.js", "texts", "upNotUpdate")
        }
        // only if the app files and globalscripts are all installed can the app be available offline.
        /*
          if webapp is installed first time, and globalscripts are installed in any way (initial, installed, or updated)
        */
        else if (isUpdating === 'i') {
          upNotOpen('JS Cavern files cached.<br>You can play while offline!','');
        }
      }
    }
    else {
      upNotOpen(msg, '');
    }
  }
  else {
    //not yet initialized, so wait a bit then check again.
    window.setTimeout(function() {
      upNotCheck(msg);
    }, 500);
  }
}
function upNotOpen(msg, extras) {
  if (document.getElementById('toastContainer')) {
    //for the moment, only allow one popup.
    document.body.removeChild(document.getElementById('toastContainer'));
    /*
      When I get round to it, I could make each toast popup
      go above the last popup.
    */
  }

  var newWindow = document.createElement('div');
  newWindow.id = 'toastContainer';
  document.body.appendChild(newWindow);

  newWindow.innerHTML =
  '<div id="toastPopup">' +
  '<div id="toastClose" class="buttonClose">X</div>' +
  '<div id="unp">' + msg + '</div>' + extras + '</div>';

  upSetClass(newWindow);
  newWindow.style.top = (document.body.offsetHeight - (document.getElementById('unp').offsetHeight + document.getElementById('unp').offsetTop + 6)) + 'px';
  newWindow.style.height = (document.getElementById('unp').offsetHeight + document.getElementById('unp').offsetTop + 6) + 'px';
}

function upNotUpdate() {
  //now that the changelog file is replaced, open the toast popup.
  upNotOpen(
    'update installed.<br>'
    + '<button id="grdf" class="uButtons uButtonGreen"'
    + ' type="button"'
    + '>Restart for updated version</button>'
    + '<br><br>scroll up to see what&apos;s new:'
    , JsCavernCL
  );
  //if this doesn't work, just don't bother with the changelog..
  //put it back into upNotCheck just with the reload button.
}

function upSetClass(zElem) {
  var zElemChildList = zElem.children;
  for (var zChilds = 0; zChilds < zElemChildList.length; zChilds++) {
    if (zElemChildList[zChilds].nodeName.toLowerCase() != 'br') {
      zElemChildList[zChilds].classList.add('letScroll');
    }
    if (zElemChildList[zChilds].nodeName.toLowerCase() == 'a') {
      //new bit to make links black in the dialogue!
      zElemChildList[zChilds].style.color = '#000';
    }
    if (zElemChildList[zChilds].childElementCount > 0) {
      upSetClass(zElemChildList[zChilds]);
    }
  }
}
function upNotClose() {
  if (document.getElementById('toastPopup')) {
    document.getElementById('toastPopup').style.transition = '.4s ease-in';
    document.getElementById('toastPopup').style.top = '100%';
    window.setTimeout(function() {
      if (document.getElementById('toastContainer')) {
        //after a second, once the element is hidden, remove it.
        document.body.removeChild(document.getElementById('toastContainer'));
      }
    }, 500);
  }
}


function fReplaceSimple(zSrc, fileName, funky) {
  /*
    firstly, single out all the scripts in case a div or something
    has the same ID
  */
  var zScripts = document.getElementsByTagName('script');
  var oldScript;// = zScripts.getElementById(fileName);
  // look for the old file name in the zScripts list
  /*
  for (var scrpt in zScripts) {
    if (zScripts[scrpt].id === fileName) {
      oldScript = zScripts[scrpt];
    }
  }
  */
  for (const a of zScripts) {
    if (a.id === fileName) {
      oldScript = a;
    }
  }
  if (oldScript) {
    var newScript = document.createElement('script');
    newScript.id = fileName + 'l';
    newScript.src = zSrc;
    newScript.addEventListener('load', function() {
      this.id = this.id.slice(0, -1);
      window[funky](); //call a function when the script is loaded/replaced.
    });
    oldScript.parentNode.replaceChild(newScript, oldScript)
  }
}























var jscLevelMap = [[// Level 00
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 27, 0, 0, 0, 0, 26, 37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 41, 41, 0, 0, 26, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 27, 0, 0, 41, 41, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 40, 40, 37, 37, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 37, 37, 40, 40, 27, 0, 0, 0, 0, 0, 63, 63, 63, 63, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 28, 37, 37, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 37, 37, 28, 27, 0, 0, 0, 0, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 41, 41, 0, 0, 0, 0, 0, 0, 0, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 37, 37, 27, 0, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 26, 37, 37, 28, 28, 37, 37, 33, 31, 0, 0, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 27, 5, 6, 6, 6, 6, 6, 2, 2, 0, 0, 0, 0], [0, 0, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 37, 37, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 2, 2, 0, 0], [37, 37, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 63, 63, 63, 38, 28, 2, 2], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 65, 65, 65, 65, 38, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 64, 64, 64, 64, 38, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 39, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 38, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 28, 28, 28, 28], []], [// 01
[0, 14, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 15], [0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16], [0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16], [0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16], [0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16], [0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16], [0, 11, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 12], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 4, 4, 4, 0, 4, 4, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [14, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [16, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [16, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [16, 16, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [16, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0], [16, 16, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0], [16, 16, 9, 9, 9, 9, 9, 9, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [16, 16, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [16, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51], [16, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0], [16, 16, 68, 68, 68, 68, 68, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 67, 67, 67, 67, 67], [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 9, 10, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 8, 9, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 28, 68, 68, 68, 68, 68, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 39, 8, 9, 9, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 10, 66, 66, 66, 66, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9], [28, 39, 0, 0, 0, 0, 0, 0, 61, 61, 61, 61, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 40, 40, 2, 2, 2, 2, 2, 2, 40, 40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], []], [// 02
[8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 63, 63, 63, 63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14, 13, 13, 13, 13, 13, 13, 13, 13, 13, 15, 8, 9, 9, 9, 9, 10], [9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 10, 0, 16, 63, 63, 63, 63, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 65, 65, 65, 65, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 64, 64, 64, 64, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0], [0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 13, 13, 13, 13, 13, 13, 13, 13, 13, 12, 0, 0, 0, 0, 0, 0], [9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 66, 66, 66, 66, 0, 18, 0, 18, 0, 18, 0, 18, 0, 18, 0, 18, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 51, 51, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 47, 47], [8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 61, 61, 61, 61, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9], [0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 17, 0, 0, 0, 0, 0, 0, 0, 17, 0, 0, 0, 0, 0, 0, 0, 17, 0, 0, 0, 0, 0, 0, 0, 17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 51, 51, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 9, 9, 10, 0, 0, 0, 0], [51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 8, 9, 9, 10, 0, 0, 0, 0], [9, 9, 9, 10, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 51, 51, 28, 28, 28, 28, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 61, 61, 61, 61], [0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 51, 51, 28, 28, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 28, 39, 0, 0, 38, 28, 51, 51, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 28, 28, 28, 39, 0, 0, 38, 28, 28, 28, 51, 51, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 28, 28, 28, 28, 28, 39, 0, 0, 38, 28, 28, 28, 28, 28, 51, 51, 0, 0], [51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 51, 51, 51, 51, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 38, 28, 28, 28, 28, 28, 28, 39, 0, 0], [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 61, 61, 61, 61, 9, 9, 61, 61, 61, 61, 9, 9, 61, 61, 61, 61, 9, 9, 61, 61, 61, 61, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 47, 47, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0], []], [// 03
[28, 28, 28, 28, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 28, 28, 28, 28], [28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 8, 10, 8, 10, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 63, 63, 63, 63, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 38, 28], [28, 39, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 38, 28], [28, 39, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 38, 28], [28, 39, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 38, 28], [28, 28, 37, 27, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7, 0, 0, 0, 0, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 26, 37, 28, 28], [28, 28, 28, 28, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 27, 0, 0, 0, 0, 26, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 6, 6, 6, 6, 6, 6, 0, 0, 0, 0, 6, 6, 6, 6, 6, 6], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 37, 37, 37, 37, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 24, 23, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 23, 23, 23, 23], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 24, 23, 23, 23, 23, 23, 23, 23, 28, 28, 28, 28, 28, 28, 23, 23, 23, 23, 23, 25, 0, 0, 0, 0, 38, 28, 0, 0, 0, 0], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 0, 0, 0, 0], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 8, 9, 9, 10], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 38, 28, 37, 37, 37, 37], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 61, 61, 61, 61, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 61, 61, 61, 61, 38, 28, 28, 28, 28, 28], []], [// 04
[28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 23, 23, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 23, 25, 24, 23, 23, 25, 0, 0, 24, 23, 28, 28, 28, 28, 28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 24, 23, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 23, 23, 29, 35, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 23, 23, 23, 23], [28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 36, 30, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 25, 0, 0, 0, 0], [28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 28, 28, 28, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 51, 51, 0, 0, 0, 0, 51, 51, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [23, 23, 29, 35, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 51, 51, 51, 51, 51, 51, 0, 0, 0, 0, 51, 51, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0], [9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9], [37, 37, 37, 37, 37, 37, 37, 27, 0, 0, 0, 0, 26, 28, 28, 28, 28, 39, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 39, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 51, 51, 6, 6, 6, 6, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0], [28, 28, 28, 28, 23, 23, 23, 25, 0, 0, 0, 0, 38, 28, 28, 28, 28, 39, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 61, 61, 61, 61, 9, 9, 9, 9, 9, 9, 9, 9], [23, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 10, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9], [0, 0, 4, 4, 4, 4, 51, 51, 61, 61, 61, 61, 51, 51, 4, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 51, 51, 4, 4, 4, 4, 4, 4, 51, 51], [8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9], []], [// 05
[28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28, 28, 28, 28, 28, 28, 28], [23, 23, 23, 23, 23, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 5, 6, 6, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 23, 23, 23, 23, 23], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 14, 15, 0, 0, 14, 15, 0, 0, 14, 15, 0, 0, 14, 15, 0, 0, 14, 15, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 47, 47, 16, 16, 4, 4, 16, 16, 4, 4, 16, 16, 4, 4, 16, 16, 4, 4, 16, 16, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [9, 9, 9, 9, 9, 9, 9, 9, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 51, 51, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 0, 0, 0, 0, 0, 47, 47, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [63, 63, 63, 63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9], [65, 65, 65, 65, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 9, 10, 0, 0, 0, 0, 0, 0, 8, 9, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [64, 64, 64, 64, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 51, 51, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 51, 51, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0], [8, 9, 9, 9, 9, 9, 9, 9, 51, 51, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 51, 51, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10], [0, 4, 0, 4, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9], []], [// 06
[28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 23, 25, 0, 0, 24, 23, 28, 28, 28, 28, 28, 39, 0, 0], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28, 28, 39, 0, 0], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 23, 23, 23, 23, 23, 23, 23, 23, 28, 28, 28, 28, 23, 23, 23, 23, 23, 23, 23, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 25, 0, 0], [28, 28, 28, 28, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [23, 23, 29, 35, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 63, 63, 63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 65, 65, 65, 65, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14, 15, 0, 0, 14, 15, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 64, 64, 64, 64, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 16, 0, 0, 16, 16, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 16, 16, 0, 0, 16, 16, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 16, 0, 0, 16, 16, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 16, 0, 0, 16, 16, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 16, 0, 0, 16, 16, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 16, 0, 0, 16, 16, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 16, 0, 0, 16, 16, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 16, 0, 0, 16, 16, 0, 0, 0, 0, 0, 0, 0, 0], [9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 10, 2, 2, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 2, 2, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 16, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 16, 0, 0, 0, 0], [9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 16, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 9, 9, 9, 9, 47, 47, 9, 9, 9, 9, 51, 51, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0], [9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 51, 51, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 61, 61, 61, 61, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 61, 61, 61, 61, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10], [9, 10, 0, 0, 0, 0, 0, 0, 51, 51, 28, 28, 28, 28, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 51, 51, 28, 28, 51, 51, 51, 51, 28, 28, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9], []], [// 07
[38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23], [38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [24, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 25, 0, 0, 0, 0, 0, 0, 5, 6, 6, 6, 6, 6], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 54, 54, 26, 37, 28, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 53, 38, 28, 28, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 53, 38, 28, 28, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 53, 38, 28, 28, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 6, 6, 7, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 53, 24, 23, 28, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 53, 0, 0, 38, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 53, 0, 0, 38, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 6, 6, 7, 0, 0, 0, 0, 5, 6, 6, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 53, 26, 37, 28, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 53, 38, 28, 28, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 53, 38, 28, 28, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 6, 6, 7, 0, 0, 0, 0, 6, 6, 6, 7, 0, 0, 0, 0, 5, 6, 6, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 53, 38, 28, 28, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 52, 52, 24, 23, 28, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 6, 6, 6, 6, 6], [0, 0, 0, 0, 0, 0, 0, 0, 5, 6, 6, 7, 0, 0, 0, 0, 5, 6, 6, 7, 0, 0, 0, 0, 5, 6, 6, 7, 0, 0, 0, 0, 5, 6, 6, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 5, 6, 6, 7, 0, 0, 0, 0, 5, 6, 6, 7, 0, 0, 0, 0, 5, 6, 6, 7, 0, 0, 0, 0, 5, 6, 6, 7, 0, 0, 0, 0, 5, 6, 6, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 10, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 61, 61, 61, 61, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10], []], [// 08
[23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 28, 28, 28, 28, 28, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28, 28, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 39, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7, 0, 0, 0, 0, 0, 0, 0, 0, 5, 6, 6, 6, 6, 6, 6, 6, 38, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 24, 23, 23, 23, 23, 23, 5, 7, 5, 7, 5, 7, 5, 7, 37, 37, 37, 37, 37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 6, 6, 6, 7, 0, 0, 0, 0, 0, 0, 0, 0, 5, 6, 6, 6, 6, 6, 38, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 6, 6, 6, 7, 0, 0, 0, 0, 0, 0, 0, 0, 5, 6, 6, 6, 6, 6, 38, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 6, 6, 6, 7, 0, 0, 0, 0, 0, 0, 0, 0, 5, 6, 6, 6, 6, 6, 38, 28, 28, 28, 28, 28], [28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28], [28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7, 37, 37, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 37, 37, 37, 37, 5, 7, 5, 7, 5, 7, 5, 7, 5, 7, 23, 23, 23, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 23, 25, 63, 63, 63, 63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 65, 65, 65, 65, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 64, 64, 64, 64, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 66, 66, 66, 66, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 38, 28, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 28, 28, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 28, 28, 28, 28, 28, 28], []], [// 09
[28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 28, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 28, 28, 28, 28, 28, 28], [28, 28, 28, 28, 23, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28, 28, 28], [28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 68, 68, 68, 68, 68, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 67, 67, 67, 67, 67, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 28, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 37, 37, 37, 37, 37, 27, 41, 41, 26, 37, 37, 37, 37, 37, 37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 37, 37, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 23, 23, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 23, 23, 23, 23, 25, 0, 0, 24, 23, 23, 23, 23, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 10, 0, 0, 0, 0, 8, 10, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 63, 63, 63, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 65, 65, 65, 65, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 64, 64, 64, 64, 0, 0, 0, 0, 38, 28], [28, 28, 37, 27, 8, 10, 66, 66, 66, 66, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 26, 37, 28, 28], [28, 28, 28, 28, 37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 37, 37, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 28, 28, 28, 28, 28, 28, 28, 28], []], [// 10
[28, 28, 28, 28, 28, 28, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 28, 28, 28, 28, 28, 28], [28, 28, 28, 28, 29, 35, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 36, 30, 28, 28, 28, 28], [28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 39, 8, 9, 9, 9, 9, 9, 9, 9, 51, 51, 51, 51, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 24, 23, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 39, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 39, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 18, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 39, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6], [28, 39, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28, 28, 28, 23, 23, 23, 23, 23, 23], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 51, 51, 0, 0, 0, 18, 0, 0, 0, 0, 0, 18, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0], [28, 39, 0, 0, 0, 0, 51, 51, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 66, 66, 66, 66, 0, 0, 0, 18, 0, 0, 24, 23, 28, 39, 8, 9, 9, 9, 9, 9], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 28, 5, 7, 5, 7, 5, 7, 5, 7], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 39, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 53, 0, 0, 0, 0, 0, 0, 0, 0, 53, 53, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 39, 68, 68, 68, 68, 68, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 53, 0, 0, 0, 0, 0, 0, 0, 0, 53, 53, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 67, 67, 67, 67, 67], [28, 28, 37, 27, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 51, 51, 0, 0, 0, 0, 8, 9, 9, 9, 51, 51, 0, 0, 0, 0, 51, 51, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 26, 37, 37, 37], [28, 28, 28, 28, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 51, 51, 51, 51, 0, 0, 37, 37, 37, 37, 37, 37, 51, 51, 51, 51, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 28, 28, 28, 28], []], [// 11
[28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 28, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 23, 23, 23, 23, 23, 23, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 23, 23, 23, 23, 23, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28], [28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28, 28, 28, 28, 28, 28, 28, 29, 35, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28], [28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28], [23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28, 28, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [6, 6, 33, 31, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [23, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14, 13, 13, 13, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 18, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 18, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 13, 13, 13, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 28, 28], [37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 28, 28, 28, 28], []], [// 12
[28, 28, 28, 28, 28, 28, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 28, 28], [28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 28, 37, 37, 37, 37, 37, 37, 37, 37, 37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 28, 28], [28, 28, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 5, 7, 0, 0, 0, 0, 5, 7, 5, 7, 5, 7, 5, 7, 0, 0, 0, 0, 5, 7, 5, 7, 5, 7, 5, 7, 5, 7, 5, 7, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 28, 28], [23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9], [28, 28, 37, 37, 37, 37, 37, 37, 37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 28, 28], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 37, 37, 37, 37, 37, 37, 37, 37, 37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 28, 28, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 23, 23, 23, 23, 23, 23, 23, 23, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 36, 30, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 36, 30, 28, 28, 37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28, 37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 10, 0, 0, 0, 0, 38, 28, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 10, 0, 0, 0, 0, 38, 28, 28, 28], [28, 28, 37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 28, 28, 28, 37, 37, 37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 61, 61, 61, 61, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 28, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 28, 28, 28, 28], []], [// 13
[28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 28, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 25, 0, 0, 24, 23, 23, 23, 23, 23, 28, 28, 28, 28], [28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 39, 8, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 10, 38, 28, 28, 28], [28, 28, 37, 37, 37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 28, 28, 28, 28], [28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28], [23, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 36, 30, 23, 23, 23, 23], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 54, 54, 0, 0, 0, 0, 0, 0, 0, 0, 54, 54, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 54, 54, 53, 53, 0, 0, 0, 0, 0, 0, 0, 0, 53, 53, 54, 54, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 53, 53, 53, 0, 0, 0, 0, 0, 0, 0, 0, 53, 53, 53, 53, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 53, 53, 53, 8, 9, 9, 9, 9, 9, 9, 10, 53, 53, 53, 53, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 53, 53, 53, 0, 0, 0, 0, 0, 0, 0, 0, 53, 53, 53, 53, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37], [9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 53, 53, 53, 0, 0, 0, 0, 0, 0, 0, 0, 53, 53, 53, 53, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 28, 28, 28, 28, 28, 37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 53, 53, 53, 0, 0, 0, 0, 0, 0, 0, 0, 53, 53, 53, 53, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 28, 28, 28, 28, 28, 28, 28, 37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 52, 52, 52, 52, 0, 0, 0, 0, 0, 0, 0, 0, 52, 52, 52, 52, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 37, 27, 0, 0, 0, 0, 0, 0, 26, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 28, 28, 28, 23, 23, 23, 23, 23, 23, 23, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 25, 54, 54, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 53, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 53, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 53, 51, 51, 9, 9, 9, 9, 9, 9, 37, 37, 37, 37, 28, 28, 28, 28], [28, 28, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 9, 9, 51, 51, 51, 51, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], []], [// 14
[28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 23, 23, 23, 23, 23], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 28, 28, 28, 28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 28, 28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 18, 0, 18, 0, 18, 0, 18, 0, 18, 0, 18, 0, 18, 0, 18, 0, 18, 0, 18, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [23, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 4, 0, 0, 0, 0, 0, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 4, 4, 4, 0, 0, 0, 0, 0, 4, 4, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 41, 41, 0, 4, 4, 4, 0, 0, 0, 0, 0, 4, 41, 41, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 28, 37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 4, 4, 4, 4, 4, 4, 0, 0, 0, 0, 0, 0, 4, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 28, 28, 28, 37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 53, 53, 53, 53, 53, 4, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9], [28, 28, 28, 28, 28, 28, 37, 37, 37, 37, 37, 37, 37, 37, 37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 28, 28], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 6, 7, 51, 51, 51, 51, 51, 51, 51, 51, 6, 6, 6, 6, 6, 7, 0, 0, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], []], [// 15
[28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 28, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 28, 28, 28, 28, 28, 28, 28, 28], [23, 23, 23, 23, 23, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 23, 23, 23, 23, 23], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 13, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 13, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14, 13, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [9, 9, 9, 9, 9, 9, 37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 9, 9, 9, 9, 9, 9], [28, 28, 28, 28, 28, 28, 28, 28, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], []], [// 16
[28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [23, 23, 23, 23, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [0, 0, 0, 0, 24, 23, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [0, 0, 0, 0, 0, 0, 24, 23, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 23, 23, 23, 23, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 24, 23, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 9, 9, 9, 9], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 37, 37, 37, 37, 37, 37, 37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 37, 37, 37, 37, 37, 37, 28, 28, 28, 28, 28, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 37, 37, 37, 37, 37, 37, 37, 27, 0, 0, 0, 0, 26, 37, 37, 37, 37, 37, 37, 37, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 37, 37, 37, 37, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [0, 0, 0, 0, 0, 0, 26, 37, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [9, 9, 9, 9, 37, 37, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], []], [// 17
[28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 23, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 23, 23, 23, 23, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 23, 23, 23, 23, 23, 23, 25, 0, 0, 0, 0, 24, 23, 23, 23, 23, 23, 23, 23, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 28, 23, 23, 23, 23, 23, 23, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 51, 51, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 51, 51, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 23, 23, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 23, 25, 0, 0, 24, 23, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 23, 23, 23, 23, 25, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 37, 27, 0, 0, 0, 0, 0, 0, 26, 37, 28, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 25, 0, 0, 0, 0, 24, 23, 23, 23, 23, 23, 23, 25, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [9, 9, 9, 9, 9, 9, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 27, 0, 0, 5, 7, 5, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 28, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], []], [// 18
[28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 23, 23, 23, 23, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 28, 28, 28, 28, 28, 28], [28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 24, 23, 28, 28, 28, 28, 28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 23], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [23, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 54, 54, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 53, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 53, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 53, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 53, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 28, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 53, 53, 0, 0, 0, 0, 0, 0, 26, 37, 28, 28, 28, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 23, 23, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 26, 37, 37, 27, 52, 52, 0, 0, 26, 37, 37, 37, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 37, 37, 37, 37, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 23, 23, 23, 23, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 28, 37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 54, 54, 28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 24, 23, 23, 23, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 27, 0, 0, 26, 37, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 53, 53, 24, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 37, 37, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 53, 53, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 51, 51, 51, 51, 0, 0, 38, 28, 28, 28], []], [// 19
[28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 28, 28, 28, 28, 28, 28], [28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 63, 63, 63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 65, 65, 65, 65, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [23, 23, 29, 35, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 64, 64, 64, 64, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 28, 28, 28, 37, 27, 5, 7, 5, 7, 5, 7, 0, 0, 5, 7, 5, 7, 5, 7, 0, 0, 5, 7, 5, 7, 5, 7, 0, 0, 5, 7, 5, 7, 5, 7, 0, 0, 5, 7, 5, 7, 5, 7, 0, 0, 5, 7, 5, 7, 26, 37, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 28, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], []], [// 20
[0, 0, 0, 0, 0, 0, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 24, 23, 23, 25, 0, 0, 0, 0, 24, 23, 28, 28, 28, 28, 28, 28, 28, 28, 23, 23, 23, 23, 23, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 36, 30, 23, 23, 23, 23, 29, 35, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [6, 6, 6, 7, 0, 0, 5, 7, 0, 0, 5, 7, 0, 0, 5, 6, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 5, 6, 6, 6, 6, 6, 6, 6], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 6, 6, 6, 6, 6, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 66, 66, 66, 66, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 6, 6, 6, 7, 0, 0, 0, 0, 5, 6, 6, 7, 0, 0, 0, 0, 5, 6, 6, 6, 6, 6], [0, 0, 0, 0, 5, 7, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 61, 61, 61, 61, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 5, 6, 6, 6, 6, 7, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 6, 6, 6, 6, 6, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [6, 6, 6, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 6, 7, 0, 0, 0, 0, 5, 6, 6, 6, 6, 7, 0, 0, 5, 6, 6, 7], [0, 0, 0, 0, 0, 0, 5, 7, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 51, 51, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 7, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 6, 6, 6, 6, 6, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 5, 6, 6, 6, 6, 6, 6, 7, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 39, 0, 0], [0, 0, 0, 0, 0, 0, 5, 6, 6, 7, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 39, 0, 0], [0, 0, 5, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 5, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 39, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 39, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 66, 66, 66, 66, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 39, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 5, 6, 6, 6, 6, 6, 6, 6, 6, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 23, 25, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 23, 28, 28, 28, 28, 28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 25, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 25, 24, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 2, 2, 28, 28], [66, 66, 66, 66, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 51, 51, 0, 0, 0, 0, 51, 51, 9, 9, 9, 9, 2, 2, 28, 28, 28, 28], [0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 4, 4, 8, 10, 4, 4, 8, 10, 4, 4, 8, 10, 4, 4, 4, 4, 8, 9, 9, 9, 9, 9, 51, 51, 61, 61, 61, 61, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], []], [// 21
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 23, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 23, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [6, 6, 6, 6, 6, 6, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 6, 6, 6, 7, 0, 0, 0, 0, 51, 51, 51, 51], [63, 63, 63, 63, 0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 6, 6, 6, 6, 6, 6, 7, 0, 0, 51, 51, 28, 28, 51, 51, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0], [0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 51, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 51, 51, 0, 0, 8, 9, 9, 9, 9, 9, 9, 10], [0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 9, 9, 9, 9, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 6, 6, 6, 6, 6, 6, 6, 51, 51, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 6, 6, 6, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 6, 6, 6, 6, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [61, 61, 61, 61, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 9, 9, 9, 9, 9, 9, 9, 9, 51, 51, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 61, 61, 61, 61], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14, 13, 15, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 13, 12, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [6, 6, 6, 6, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 28, 28, 28, 28, 28, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 51, 51, 6, 6, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 28, 28, 51, 51, 9, 9, 9, 9], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 9, 9, 9, 9, 9, 10, 4, 4, 8, 10, 4, 4, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 51, 51, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], []], [// 22
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 23, 23, 23, 23, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 8, 10, 8, 10, 8, 10, 8, 10, 0, 0, 8, 10, 8, 10, 8, 10, 8, 10, 0, 0, 0, 0, 0, 0, 8, 10, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 6, 6, 6, 6, 6, 6], [0, 0, 0, 0, 8, 10, 8, 10, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 8, 10, 8, 10, 0, 0, 0, 0, 8, 10, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 28, 28, 28, 28, 28, 28, 28, 28], [0, 0, 8, 10, 8, 10, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 8, 10, 8, 10, 0, 0, 8, 10, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28, 28, 28, 28, 28, 28, 28], [0, 0, 8, 10, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 8, 10, 0, 0, 8, 10, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28], [0, 0, 8, 10, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 8, 10, 8, 10, 0, 0, 8, 10, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28], [0, 0, 8, 10, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 6, 7, 0, 0, 0, 0, 0, 0, 8, 10, 8, 10, 0, 0, 8, 10, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28], [0, 0, 8, 10, 8, 10, 0, 0, 5, 6, 6, 6, 6, 7, 40, 40, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 8, 10, 0, 0, 8, 10, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28], [0, 0, 8, 10, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 8, 10, 0, 0, 8, 10, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28], [0, 0, 8, 10, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 6, 6, 6, 6, 7, 0, 0, 8, 10, 8, 10, 0, 0, 8, 10, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28], [0, 0, 8, 10, 8, 10, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 8, 10, 0, 0, 8, 10, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28], [0, 0, 8, 10, 8, 10, 0, 0, 5, 6, 6, 6, 6, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 8, 10, 0, 0, 8, 10, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 23, 23, 23, 23, 23], [0, 0, 8, 10, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 8, 10, 8, 10, 0, 0, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 18, 0, 0, 0, 0], [0, 0, 8, 10, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 51, 51, 0, 0, 8, 10, 8, 10, 0, 0, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 8, 10, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 8, 10, 8, 10, 8, 10, 0, 0, 8, 10, 8, 10, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 8, 10, 51, 51, 0, 0, 47, 47, 51, 51, 8, 10, 8, 10, 0, 0, 0, 0, 0, 0, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 66, 66, 66, 66, 8, 10, 5, 6, 6, 7, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 8, 10, 8, 10, 8, 10, 0, 0, 8, 10, 8, 10, 8, 10, 0, 0, 0, 0, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 6, 6, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [51, 51, 0, 0, 0, 0, 51, 51, 47, 47, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 4, 4, 4, 4, 2, 2, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0], [5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7, 47, 47, 0, 0, 5, 6, 6, 6, 6, 6, 2, 2, 51, 51, 51, 51, 2, 2, 0, 0, 51, 51, 2, 2, 61, 61, 61, 61], []], [// 23
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 7, 41, 41, 0, 0, 0, 0, 0, 0, 41, 41, 0, 0, 38, 28, 28, 28, 23, 23, 23, 23, 28, 28, 28, 28], [6, 6, 6, 6, 51, 51, 51, 51, 0, 0, 5, 6, 6, 6, 6, 6, 6, 7, 0, 0, 5, 6, 6, 6, 6, 6, 6, 7, 0, 0, 5, 7, 8, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 39, 0, 0, 38, 28, 28, 28, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 38, 28, 28, 28, 28, 39, 0, 0, 38, 28, 28, 28, 0, 0, 24, 23, 23, 25, 0, 0, 0, 0, 38, 28, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 6, 6, 6, 6, 6, 6, 6, 6, 7, 24, 23, 28, 28, 28, 39, 0, 0, 38, 28, 28, 28, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 25, 0, 0, 24, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 28, 27, 0, 0, 0, 0, 0, 5, 6, 6, 7, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 28, 28, 27, 0, 0, 0, 0, 38, 28, 28, 28, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 66, 66, 66, 66, 38, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0, 51, 51, 28, 28, 0, 0, 0, 0, 38, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 51, 51, 0, 0, 51, 51, 51, 51, 47, 47, 0, 0, 0, 0, 51, 51, 28, 28, 28, 28, 6, 6, 6, 6, 6, 7, 0, 0, 51, 51, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 51, 51, 28, 28, 28, 28, 51, 51, 0, 0, 51, 51, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 51, 51, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 24, 23, 23, 23, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 39, 0, 0, 47, 47, 51, 51, 51, 51, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], []], [// 24
[28, 28, 28, 28, 23, 25, 24, 23, 23, 23, 23, 23, 28, 28, 23, 23, 23, 23, 28, 28, 23, 23, 23, 23, 23, 25, 0, 0, 0, 0, 24, 23, 23, 23, 23, 23, 28, 28, 28, 28, 23, 23, 23, 23, 28, 28, 28, 28, 23, 23, 23, 23, 28, 28, 28, 28], [28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 18, 0, 0, 0, 0, 0, 18, 0, 18, 0, 0, 0, 0, 24, 23, 28, 28], [23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23], [0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 51, 51, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 51, 51, 47, 47, 51, 51, 51, 51, 23, 23, 23, 23, 23, 23, 23, 23, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 51, 51, 0, 0, 0, 0], [37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 51, 51, 0, 0], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 6, 6], [28, 39, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 51, 51, 0, 0, 0, 17, 0, 0, 0, 17, 0, 0, 0, 17, 0, 0, 0, 17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 23, 23, 23, 23, 23, 28, 28, 28, 28, 28, 28], [28, 39, 0, 0, 61, 61, 61, 61, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 51, 51, 0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28], [28, 28, 37, 27, 0, 0, 63, 63, 63, 63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 18, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 7, 0, 0, 5, 7, 0, 0, 0, 0], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 26, 37], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 51, 51, 26, 37, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 26, 37, 28, 28, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 47, 47, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 47, 47, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28], [28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28], [28, 39, 0, 0, 0, 0, 61, 61, 61, 61, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 24, 23, 28, 28, 28, 28], [23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 51, 51, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 28, 28, 28, 28, 4, 4, 28, 28, 28, 28, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 0, 0, 28, 28, 51, 51, 66, 66, 66, 66, 51, 51, 51, 51, 0, 0, 51, 51, 51, 51, 51, 51, 47, 47, 51, 51, 51, 51, 51, 51, 0, 0], [0, 0, 51, 51, 51, 51, 51, 51, 51, 51, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 47, 47, 28, 28, 28, 28, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37], []], [// 25
[28, 28, 28, 28, 28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 23, 23, 23, 23, 23], [28, 28, 28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [23, 23, 23, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 6, 6, 6, 6, 6, 6, 47, 47, 6, 6, 6, 6, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 0, 0, 51, 51], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 6, 6, 6, 6, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 51, 51, 6, 6, 6, 6, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [51, 51, 6, 6, 6, 6, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 5, 7, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 28, 28, 23, 25, 61, 61, 61, 61, 0, 0], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 5, 6, 6, 6, 6, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 51, 51, 23, 23, 23, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0], [28, 39, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 28, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 51, 51, 51, 51, 0, 0, 51, 51, 51, 51, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 23, 23, 23, 23, 23, 51, 51, 23, 23, 23, 23, 51, 51, 0, 0, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0], [23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0], [0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 51, 51, 51, 51, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 6, 6, 6, 6, 6, 6, 23, 25, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [66, 66, 66, 66, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 28, 28, 28, 28, 28, 28, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 8, 10, 28, 28, 28, 28, 28, 28, 8, 10, 51, 51, 51, 51, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 10, 0, 0, 51, 51, 51, 51, 51, 51, 23, 23, 23, 23, 23, 23, 23, 23, 28, 28, 28, 28, 51, 51, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 23, 51, 51, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [51, 51, 51, 51, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 28, 28, 28, 28, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0], [28, 28, 28, 39, 0, 0, 38, 28, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 47, 47, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 51, 51, 51, 51, 51, 51, 28, 28, 28, 28, 28, 28, 51, 51, 51, 51, 51, 51, 47, 47], []], [// 26
[63, 63, 63, 63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 51, 51, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 51, 51], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 51, 51, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0], [0, 0, 0, 0, 51, 51, 51, 51, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [61, 61, 61, 61, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 14, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 15, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 11, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 12, 0, 16, 47, 47, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 13, 13, 13, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [8, 10, 14, 15, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 14, 15, 0, 0, 0, 0, 0, 14, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 15, 0, 0, 0, 0, 0, 0], [0, 0, 16, 16, 68, 68, 68, 68, 68, 0, 0, 0, 0, 0, 0, 0, 0, 67, 67, 67, 67, 67, 16, 16, 0, 0, 0, 0, 0, 11, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 12, 0, 0, 0, 0, 0, 0], [0, 0, 16, 16, 68, 68, 68, 68, 68, 0, 0, 0, 0, 0, 0, 0, 0, 67, 67, 67, 67, 67, 16, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 16, 16, 68, 68, 68, 68, 68, 0, 0, 0, 0, 0, 0, 0, 0, 67, 67, 67, 67, 67, 16, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 16, 16, 68, 68, 68, 68, 68, 0, 0, 0, 0, 0, 0, 0, 0, 67, 67, 67, 67, 67, 16, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 16, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 16, 16, 9, 9, 9, 9, 9, 9, 66, 66, 66, 66, 9, 9, 9, 9, 9, 9, 9, 9, 16, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 16, 0, 0, 0, 0, 51, 51, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 51, 51, 0, 0, 51, 51], [0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 16, 16, 0, 0, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 51, 51], [8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10], []], [// 27
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [51, 51, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 51, 51, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 13, 13, 13, 13, 13, 13, 0, 0, 13, 13, 13, 13, 13, 13, 51, 51, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 5, 6, 6, 6, 6, 6, 6, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 51, 51, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 13, 13, 13, 13, 13, 13, 0, 0, 13, 13, 13, 13, 13, 13, 51, 51, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 15, 66, 66, 66, 66], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 12, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [51, 51, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13], []], [// 28
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14, 63, 63, 63, 63, 13, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 65, 65, 65, 65, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 64, 64, 64, 64, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14, 13, 13, 13, 13, 13, 12, 13, 13, 13, 13, 0, 11, 13, 13, 13, 13, 13, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 13, 13, 13, 13, 13, 15, 0, 0, 0, 0, 0, 14, 13, 13, 13, 13, 13, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 47, 47, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 13, 13, 13, 13, 13, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 51, 51, 51, 51, 28, 28, 28, 28, 28, 28, 28, 28, 51, 51, 51, 51, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 51, 51], [51, 51, 51, 51, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 51, 51, 51, 51], []], [// 29
[28, 28, 28, 28, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 28, 28, 28, 28], [28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 63, 63, 63, 63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 39, 0, 0, 0, 0, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 0, 13, 13, 13, 13, 13, 15, 0, 0], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 13, 12, 0, 0], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 28, 28, 28, 28, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 28, 28, 28, 28, 28, 28, 28, 28, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0], [51, 51, 0, 0, 0, 0, 51, 51, 51, 51, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0], [28, 28, 61, 61, 61, 61, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10], []], [// 30
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14, 15, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 16, 16, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 18, 0, 18, 0, 18, 0, 18, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 16, 16, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 16, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 16, 16, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 63, 63, 63, 0, 0, 0, 0, 5, 7, 5, 7, 5, 7], [0, 0, 0, 0, 0, 0, 16, 16, 16, 16, 51, 51, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 9, 9, 9, 10, 66, 66, 66, 66, 8, 9, 9, 9, 9, 10, 0, 0, 0, 0, 8, 9, 47, 47, 9, 9, 9, 9, 9, 10], [9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [68, 68, 68, 68, 68, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 67, 67, 67, 67, 67], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14, 13, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 16, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 10, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 13, 13, 13, 13, 13, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 61, 61, 61, 61, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 13, 13, 13, 13, 13, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 47, 47, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2], [0, 19, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 22, 0], []], [// 31
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10], [0, 0, 0, 0, 0, 0, 51, 51, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 2, 2, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [51, 51, 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [51, 51, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 51, 51, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [8, 9, 9, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10], [0, 0, 0, 0, 0, 0, 61, 61, 61, 61, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [51, 51, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 61, 61, 61, 61, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 2, 2, 2, 2, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [5, 6, 6, 6, 6, 7, 0, 0, 0, 0, 5, 6, 47, 47, 6, 7, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 5, 6, 6, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 61, 61, 61, 61, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 2, 2, 2, 2, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 2, 2, 2, 2, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2], [0, 19, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 22, 0], []], [// 32
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 63, 63, 63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 63, 63, 63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [8, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 63, 63, 63, 63, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 47, 47, 9, 10], [0, 0, 68, 68, 68, 68, 68, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 67, 67, 67, 67, 67, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 8, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 63, 63, 63, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 68, 68, 68, 68, 68, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 67, 67, 67, 67, 67], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 8, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 61, 61, 61, 61, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 61, 61, 61, 61, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 61, 61, 61, 61, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [47, 47, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2], [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2], [0, 19, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 22, 0], []], [// 33
[0, 0, 0, 0, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 0, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 0, 51, 51], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51], [0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 51, 51], [0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51], [0, 0, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 51, 51], [0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51], [0, 0, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 51, 51], [0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51], [0, 0, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 51, 51], [0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51], [0, 0, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 51, 51], [0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51], [0, 0, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 51, 51], [0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51], [0, 0, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 51, 51], [0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 51, 51], [0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51], [0, 0, 0, 0, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51], [51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 10, 0, 0, 0, 0], [51, 51, 51, 51, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 19, 22, 0, 0, 19, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 22, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9], []], [// 34
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 15], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 13, 13, 13, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14, 13, 12], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 12, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 63, 63, 63, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 47, 47, 8, 10, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 14, 13, 13, 13, 13], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 47, 47, 47, 47, 0, 16, 0, 16, 47, 47, 47, 47, 0, 16, 0, 16, 47, 47, 47, 47, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 13, 13, 13, 13, 13, 12, 0, 11, 13, 13, 13, 13, 13, 12, 0, 11, 13, 13, 13, 13, 13, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 13, 13, 13, 13], [0, 0, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 61, 61, 61, 61, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9], [9, 9, 9, 9, 9, 9, 47, 47, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 51, 51, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], []], [// 35
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 9, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 2, 2, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 2, 2], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 68, 68, 68, 68, 68, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 67, 67, 67, 67, 67, 2, 2, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 51, 51], [0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 2, 2, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51], [0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0], [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 47, 47, 9, 9, 9, 9, 9, 9, 47, 47, 9, 9, 47, 47, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 9, 9, 9, 9, 9, 9], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 10, 0, 0, 8, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 47, 47, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 47, 47, 9, 10, 0, 0, 0, 0, 40, 40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [47, 47, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [2, 2, 2, 2, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2], [2, 2, 2, 2, 0, 0, 2, 2, 2, 2, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 2, 2], []], [// 36
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 63, 63, 63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 8, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 10], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [68, 68, 68, 68, 68, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 67, 67, 67, 67, 67], [8, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 10, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 8, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 10], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 61, 61, 61, 61, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [8, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 10], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [68, 68, 68, 68, 68, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 67, 67, 67, 67, 67], [8, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 10, 0, 0, 0, 0, 8, 9, 47, 47, 9, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 10], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 8, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 10, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0], [2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2], [2, 2, 2, 2, 2, 2, 2, 2, 9, 9, 9, 9, 9, 10, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 8, 9, 9, 9, 9, 9, 2, 2, 2, 2, 2, 2, 2, 2], []], [// 37
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51], [0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47], [51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 51, 51], [0, 0, 51, 51, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 51, 51, 51, 51, 51, 51], [0, 0, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 51, 51], [51, 51, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 51, 51, 0, 0, 51, 51, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 51, 51, 51, 51, 51, 51], [51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 0, 0, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51], [51, 51, 51, 51, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 51, 51, 51, 51], []], [// 38
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 51, 51, 0, 0, 0, 0, 0, 0], [63, 63, 63, 63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9], [61, 61, 61, 61, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [24, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 51, 51], [0, 0, 0, 0, 8, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [61, 61, 61, 61, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 2, 2], [2, 2, 2, 2, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 2, 2, 61, 61, 61, 61, 2, 2], []], [// 39
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 63, 63, 63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 8, 10, 14, 15, 0, 0, 14, 15], [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 16, 16, 0, 0, 16, 16], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 16, 16, 0, 0, 16, 16], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 16, 16, 0, 0, 16, 16], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 16, 16, 0, 0, 16, 16], [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 16, 16, 0, 0, 16, 16], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 61, 61, 61, 61, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 16, 16, 0, 0, 16, 16], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 63, 63, 63, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 69, 69, 69, 69, 69, 69], [51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 0, 0], [0, 0, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 51, 51, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 0, 0], [51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 0, 0], [0, 0, 51, 51, 14, 15, 0, 0, 14, 15, 0, 0, 14, 15, 0, 0, 14, 15, 0, 0, 14, 15, 0, 0, 14, 15, 0, 0, 14, 15, 0, 0, 14, 15, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 0, 0], [0, 0, 51, 51, 16, 16, 0, 0, 16, 16, 0, 0, 16, 16, 0, 0, 16, 16, 0, 0, 16, 16, 0, 0, 16, 16, 0, 0, 16, 16, 0, 0, 16, 16, 51, 51, 61, 61, 61, 61, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 16, 16, 0, 0, 16, 16, 0, 0, 16, 16, 0, 0, 16, 16, 0, 0, 16, 16, 0, 0, 16, 16, 0, 0, 16, 16, 0, 0, 16, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 16, 16, 0, 0, 16, 16, 0, 0, 16, 16, 0, 0, 16, 16, 0, 0, 16, 16, 0, 0, 16, 16, 0, 0, 16, 16, 0, 0, 16, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 16, 16, 0, 0, 16, 16, 0, 0, 16, 16, 0, 0, 16, 16, 0, 0, 16, 16, 0, 0, 16, 16, 0, 0, 16, 16, 0, 0, 16, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 8, 10, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0], [2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 28, 28, 28, 28, 28, 28, 51, 51, 0, 0, 0, 0, 0, 0], [28, 28, 28, 28, 2, 2, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0], []], [// 40
[63, 63, 63, 63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 51, 51, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 63, 63, 63, 63, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10], [0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 63, 63, 63, 63, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 47, 47, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 51, 51, 0, 0, 0, 0, 0, 0], [61, 61, 61, 61, 0, 0, 0, 0, 0, 0, 24, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 51, 51], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [8, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 9, 9, 10, 0, 0, 51, 51, 61, 61, 61, 61, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 61, 61, 61, 61, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 54, 54, 63, 63, 63, 63, 0, 0, 0, 0], [47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 0, 0, 53, 53, 0, 0, 0, 0, 0, 0, 0, 0], [8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 53, 53, 0, 0, 0, 0, 0, 0, 0, 0], [63, 63, 63, 63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 53, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 53, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 53, 0, 0, 0, 0, 0, 0, 51, 51], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 53, 53, 0, 0, 0, 0, 51, 51, 0, 0], [0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 8, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 16, 0, 0, 0, 0, 16, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 61, 61, 61, 61, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 16, 16, 16, 16, 16, 16, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [61, 61, 61, 61, 9, 9, 9, 9, 51, 51, 51, 51, 51, 51, 51, 51, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9], []], [// 41
[0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 11, 13, 13, 0, 0, 13, 13, 13, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 25, 0, 0, 0, 0, 51, 51, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 51, 51, 51, 51, 47, 47, 9, 9, 9, 9, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47], [0, 0, 0, 0, 51, 51, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 10, 0, 0, 8, 9, 9, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10], [51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 61, 61, 61, 61, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 54, 54, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 53, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 53, 0, 0, 0, 0], [47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 53, 0, 0, 0, 0], [8, 9, 9, 9, 9, 10, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 41, 41, 0, 0, 0, 0, 41, 41, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 40, 40, 0, 0, 0, 0, 40, 40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 17, 0, 0, 0, 0, 0, 17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 17, 0, 0, 0, 0, 0, 17, 0, 0, 0, 0, 0, 0], [2, 2, 2, 2, 2, 2, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 47, 47, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 8, 9, 9, 9, 9, 10], []], [// 42
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7, 0, 0, 5, 6, 6, 7, 0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [63, 63, 63, 63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 51, 51, 0, 0, 0, 0, 5, 6, 6, 7, 0, 0, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51], [0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 47, 47, 9, 9, 9, 9, 9, 9, 9, 10], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 63, 63, 63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 63, 63, 63], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 65, 65, 65, 65], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 64, 64, 64, 64], [0, 0, 0, 0, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 51, 51, 0, 0, 0, 0, 0, 0, 51, 51, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10], [61, 61, 61, 61, 0, 0, 46, 46, 0, 0, 0, 0, 0, 0, 46, 46, 51, 51, 0, 0, 0, 0, 0, 0, 51, 51, 46, 46, 0, 0, 0, 0, 0, 0, 46, 46, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 46, 46, 0, 0, 0, 0, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7, 0, 0, 0, 0, 46, 46, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 63, 63, 63], [0, 0, 0, 0, 0, 0, 46, 46, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 46, 46, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 46, 46, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 46, 46, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7, 0, 0, 0, 0, 5, 6, 6, 6, 6, 6, 6, 6, 6, 7, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 61, 61, 61, 61, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 61, 61, 61, 61], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0], [9, 9, 9, 9, 2, 2, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 2, 2, 6, 6, 6, 6], []], [// 43
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [6, 6, 6, 7, 0, 0, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7, 0, 0, 0, 0, 5, 7, 0, 0, 0, 0, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 46, 46, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 46, 46, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [6, 6, 6, 6, 6, 6, 6, 6, 68, 68, 68, 68, 68, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 67, 67, 67, 67, 67], [0, 0, 8, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 8, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 63, 63, 63, 63, 2, 2, 2, 2, 47, 47, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 47, 47, 9, 9, 9, 10, 0, 0, 8, 10, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46, 63, 63, 63, 63, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46, 65, 65, 65, 65, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46, 64, 64, 64, 64, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 51, 51], [0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 8, 10, 0, 0, 8, 9, 9, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 6, 6], [0, 0, 61, 61, 61, 61, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [9, 9, 9, 9, 9, 9, 9, 9, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 47, 47, 47, 47, 9, 9, 9, 9, 9, 9, 9, 10, 61, 61, 61, 61, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 8, 9, 9, 10], []], [// 44
[28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 23, 23, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28, 28, 28, 28, 28, 23, 25, 0, 0, 24, 23, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 23, 25, 24, 23, 28, 28], [28, 28, 28, 28, 28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 23, 23, 23, 23, 23, 25, 0, 0, 0, 0, 38, 28], [28, 28, 28, 28, 28, 28, 29, 35, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 37, 37, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 24, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 28, 28, 28, 28, 28, 37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 28, 28, 28, 23, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23], [28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28, 28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 28, 28, 28, 37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37], [28, 28, 23, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 26, 37, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 37, 37, 37, 37], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 28, 28, 28, 28, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 28, 28, 28, 28, 28, 28, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 37, 27, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 26, 37, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 28, 37, 37, 37, 37, 37, 37, 28, 28, 28, 28, 37, 37, 37, 37, 37, 37, 28, 28, 28, 28, 37, 37, 37, 37, 37, 37, 37, 37, 28, 28, 28, 28, 37, 37, 37, 37, 37, 37, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], []], [// 45
[28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0], [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0], [28, 28, 28, 28, 23, 23, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 28, 28, 39, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37], [28, 28, 28, 39, 0, 0, 24, 23, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 23, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 26, 37, 28, 28], [28, 28, 28, 39, 0, 0, 0, 0, 24, 23, 28, 28, 28, 28, 23, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28], [28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 23, 23, 25, 0, 0, 0, 0, 0, 0, 26, 37, 28, 28, 28, 28], [23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 37, 27, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 28, 28, 28, 28, 37, 37, 37, 37, 37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28], [37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 26, 37, 37, 27, 0, 0, 0, 0, 0, 0, 24, 23, 28, 28, 28, 28, 23, 23, 23, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23], [28, 39, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 39, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 34, 37, 37, 37, 37, 37, 37, 37, 37, 37, 27, 0, 0, 0, 0, 0, 0], [28, 39, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 36, 30, 23, 23, 23, 23, 28, 28, 28, 28, 29, 35, 0, 0, 0, 0, 0, 0], [28, 39, 0, 0, 0, 0, 0, 0, 24, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23, 23, 25, 0, 0, 0, 0, 0, 0, 0, 0], [23, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10, 8, 10], [37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 37, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 0, 0, 0, 0, 26, 37, 4, 4, 8, 10, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 0, 0, 0, 0, 38, 28, 4, 4, 8, 10, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 0, 0, 0, 0, 38, 28, 4, 4, 8, 10, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 26, 37, 28, 28, 28, 39, 4, 4, 4, 4, 0, 0, 0, 0, 0, 0, 38, 28, 4, 4, 0, 0, 38, 28, 4, 4, 8, 10, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 37, 27, 0, 0, 0, 0, 38, 28, 28, 28, 28, 28, 37, 37, 37, 37, 37, 27, 0, 0, 26, 37, 28, 28, 37, 37, 37, 37, 28, 28, 4, 4, 8, 10, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [28, 28, 28, 28, 37, 37, 37, 37, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 37, 37, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 4, 4, 8, 10, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], []], [// 46
[46, 46, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46, 0, 0, 0, 0, 0, 0, 0, 0], [46, 46, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46, 0, 0, 0, 0, 0, 0, 0, 0], [46, 46, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46, 0, 0, 0, 0, 0, 0, 0, 0], [5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 7, 0, 0, 5, 6, 6, 6, 6, 6], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 6, 6, 6, 6, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [2, 2, 0, 0, 63, 63, 63, 63, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [2, 2, 0, 0, 65, 65, 65, 65, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 51, 51, 51, 51, 51, 51, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [2, 2, 0, 0, 64, 64, 64, 64, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 0, 0, 5, 7, 0, 0, 5, 7], [2, 2, 0, 0, 5, 6, 6, 6, 6, 6, 6, 6, 6, 7, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 5, 6, 6, 6, 6, 6, 6, 7, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47], [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 5, 6, 6, 6, 6, 6, 6, 7, 0, 0, 0, 0, 5, 7, 0, 0, 5, 7], [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 63, 63, 63, 63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 65, 65, 65, 65, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 5, 6, 6, 6, 6, 6, 6, 7, 0, 0, 2, 2, 0, 0, 64, 64, 64, 64, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 5, 6, 6, 6, 6, 6, 6, 7, 0, 0, 0, 0, 47, 47, 6, 6, 6, 7], [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [2, 2, 0, 0, 5, 6, 6, 6, 6, 6, 6, 6, 6, 7, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0, 0, 0, 5, 6, 6, 7, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 5, 6, 6, 6, 6, 6, 6, 7, 0, 0, 0, 0, 5, 6, 6, 6, 6, 7], [2, 2, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [6, 6, 6, 6, 47, 47, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 47, 47, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 47, 47, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6], []], [// 47
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46, 0, 0, 0, 0, 0, 0, 0, 0], [51, 51, 51, 51, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 51, 51, 51, 51, 0, 0, 5, 6, 6, 6, 6, 7], [51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0], [51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0], [51, 51, 0, 0, 0, 0, 0, 0, 0, 17, 0, 0, 0, 0, 0, 0, 0, 17, 0, 0, 0, 0, 0, 0, 0, 17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0], [46, 46, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 47, 47, 6, 6, 6, 6, 46, 46, 0, 0, 0, 0, 0, 0, 0, 0], [46, 46, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46, 0, 0, 0, 0, 0, 0, 0, 0], [46, 46, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46, 0, 0, 0, 0, 5, 6, 47, 47], [46, 46, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46, 0, 0, 0, 0, 0, 0, 0, 0], [46, 46, 47, 47, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 47, 47, 6, 6, 6, 6, 46, 46, 0, 0, 0, 0, 0, 0, 0, 0], [46, 46, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46, 0, 0, 0, 0, 0, 0, 0, 0], [46, 46, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46, 0, 0, 0, 0, 47, 47, 6, 7], [46, 46, 0, 0, 0, 0, 0, 0, 0, 17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46, 0, 0, 0, 0, 0, 0, 0, 0], [46, 46, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 47, 47, 6, 6, 47, 47, 46, 46, 0, 0, 0, 0, 0, 0, 0, 0], [46, 46, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46, 0, 0, 0, 0, 0, 0, 0, 0], [46, 46, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46, 0, 0, 0, 0, 5, 6, 47, 47], [46, 46, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46, 0, 0, 0, 0, 0, 0, 0, 0], [46, 46, 47, 47, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 47, 47, 6, 6, 6, 6, 46, 46, 0, 0, 0, 0, 0, 0, 0, 0], [46, 46, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 18, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46, 0, 0, 0, 0, 0, 0, 0, 0], [46, 46, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46, 0, 0, 0, 0, 47, 47, 6, 7], [46, 46, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46, 0, 0, 0, 0, 0, 0, 0, 0], [5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7, 0, 0, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 47, 47, 6, 6, 47, 47, 6, 7, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 47, 47, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 47, 47], []], [// 48
[28, 28, 28, 28, 23, 23, 23, 23, 23, 23, 23, 25, 0, 0, 24, 23, 23, 23, 23, 23, 28, 28, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 28, 28, 28, 39, 0, 0, 38, 28, 28, 28], [28, 28, 23, 25, 63, 63, 63, 63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 28, 23, 25, 0, 0, 38, 28, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 63, 63, 63, 63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 39, 0, 0, 0, 0, 36, 30, 28, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 65, 65, 65, 65, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 39, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28, 64, 64, 64, 64, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 39, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 5, 6, 6, 6, 47, 47, 0, 0, 0, 0, 0, 0, 24, 23, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 23, 25, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 5, 6, 6, 6, 6, 6, 6, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 6, 6, 6, 7, 0, 0, 0, 0, 5, 6, 6, 7, 0, 0, 0, 0, 5, 6, 6, 6, 6, 6, 6, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 6, 6, 6, 47, 47, 6, 6, 6, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 61, 61, 61, 61, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 38, 28], [28, 39, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 6, 6, 6, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 23], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 61, 61, 61, 61, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51], [28, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 51, 51, 0, 0, 0, 0, 51, 51, 0, 0], [28, 39, 0, 0, 0, 0, 0, 0, 5, 7, 5, 7, 2, 2, 0, 0, 0, 0, 2, 2, 5, 7, 5, 7, 5, 7, 5, 7, 5, 7, 5, 7, 5, 7, 5, 7, 5, 7, 5, 7, 5, 7, 5, 7, 5, 7, 5, 7, 5, 7, 5, 7, 0, 0, 26, 37], [28, 39, 0, 0, 61, 61, 61, 61, 0, 0, 0, 0, 2, 2, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 37, 28, 28], [28, 0, 37, 37, 37, 37, 37, 37, 37, 27, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 28, 28, 28, 28], []], [// 49
[5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 23, 25, 0, 0, 24, 23, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 46, 46], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46], [0, 0, 0, 0, 5, 6, 6, 7, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14, 13, 15, 46, 46], [0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 2, 2, 2, 2, 47, 47, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 28, 28, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 28, 0, 16, 46, 46], [0, 0, 0, 0, 8, 10, 2, 2, 8, 10, 2, 2, 8, 10, 2, 2, 8, 10, 2, 2, 2, 2, 6, 7, 0, 0, 0, 11, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 12, 46, 46], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46], [0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46], [0, 0, 0, 0, 8, 10, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 46, 46], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 63, 63, 63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46], [0, 0, 0, 0, 47, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46], [0, 0, 0, 0, 8, 10, 0, 0, 5, 6, 6, 7, 0, 0, 0, 0, 5, 6, 6, 7, 0, 0, 0, 0, 0, 14, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 15, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 10, 0, 0, 46, 46], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 63, 63, 63, 63, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 65, 65, 65, 65, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 64, 64, 64, 64, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 13, 13, 13, 13, 0, 0, 0, 0, 13, 13, 13, 13, 13, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46], [0, 0, 51, 51, 5, 7, 5, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46], [5, 7, 68, 68, 68, 68, 68, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 67, 67, 67, 67, 67, 5, 7, 46, 46], [8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 10, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 10, 0, 0, 46, 46], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 61, 61, 61, 61, 0, 0, 0, 0, 0, 0, 61, 61, 61, 61, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 46], [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 47, 47, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 46, 46], []]];
var jscDiamondMap = [// Tile 48
/*00*/
[[1], [36, 24, 1]], /*01*/
[[6], [10, 8, 1], [32, 9, 1], [32, 13, 1], [32, 17, 1], [10, 18, 1], [16, 22, 1]], /*02*/
[[8], [48, 0, 1], [46, 5, 1], [46, 6, 1], [4, 12, 1], [22, 12, 1], [8, 16, 1], [20, 16, 1], [54, 22, 1]], /*03*/
[[8], [8, 4, 1], [34, 4, 1], [38, 4, 1], [42, 4, 1], [46, 4, 1], [44, 11, 1], [50, 11, 1], [52, 23, 1]], /*04*/
[[9], [6, 6, 1], [46, 6, 1], [22, 9, 1], [2, 10, 1], [42, 10, 1], [18, 17, 1], [4, 22, 1], [44, 22, 1], [18, 26, 1]], /*05*/
[[9], [28, 4, 1], [18, 7, 1], [38, 7, 1], [8, 12, 1], [52, 12, 1], [50, 15, 1], [22, 20, 1], [26, 20, 1], [30, 20, 1]], /*06*/
[[6], [22, 4, 1], [32, 4, 1], [6, 11, 1], [4, 24, 1], [32, 25, 1], [36, 25, 1]], /*07*/
[[6], [20, 6, 1], [22, 6, 1], [10, 16, 1], [26, 16, 1], [32, 25, 1], [36, 25, 1]], /*08*/
[[12], [34, 8, 1], [46, 8, 1], [34, 12, 1], [46, 12, 1], [8, 13, 1], [24, 15, 1], [34, 16, 1], [46, 16, 1], [12, 18, 1], [20, 18, 1], [30, 23, 1], [48, 23, 1]], /*09*/
[[4], [44, 2, 1], [44, 3, 1], [16, 17, 1], [48, 17, 1]], /*10*/
[[9], [2, 6, 1], [4, 6, 1], [2, 10, 1], [30, 16, 1], [50, 16, 1], [50, 17, 1], [48, 21, 1], [50, 21, 1], [46, 23, 1]], /*11*/
[[7], [8, 5, 1], [12, 5, 1], [8, 8, 1], [12, 8, 1], [0, 20, 1], [28, 24, 1], [40, 24, 1]], /*12*/
[[8], [10, 3, 1], [22, 3, 1], [40, 3, 1], [50, 3, 1], [46, 12, 1], [48, 19, 1], [38, 22, 1], [38, 25, 1]], /*13*/
[[10], [4, 4, 1], [14, 4, 1], [36, 4, 1], [18, 12, 1], [36, 12, 1], [46, 17, 1], [46, 19, 1], [46, 21, 1], [8, 25, 1], [20, 25, 1]], /*14*/
[[9], [20, 3, 1], [24, 3, 1], [28, 3, 1], [32, 3, 1], [36, 3, 1], [40, 3, 1], [44, 3, 1], [28, 23, 1], [30, 23, 1]], /*15*/
[[3], [26, 15, 1], [30, 15, 1], [34, 15, 1]], /*16*/
[[8], [24, 11, 1], [28, 11, 1], [12, 14, 1], [16, 14, 1], [36, 14, 1], [40, 14, 1], [24, 16, 1], [28, 16, 1]], /*17*/
[[6], [48, 10, 1], [26, 12, 1], [24, 13, 1], [6, 18, 1], [10, 18, 1], [46, 18, 1]], /*18*/
[[7], [34, 3, 1], [40, 3, 1], [46, 3, 1], [20, 5, 1], [8, 7, 1], [34, 13, 1], [8, 23, 1]], /*19*/
[[10], [24, 9, 1], [34, 9, 1], [24, 14, 1], [34, 14, 1], [8, 23, 1], [16, 23, 1], [24, 23, 1], [32, 23, 1], [40, 23, 1], [46, 23, 1]], /*20*/
[[9], [0, 1, 1], [4, 6, 1], [54, 6, 1], [54, 11, 1], [12, 13, 1], [38, 14, 1], [2, 17, 1], [38, 19, 1], [54, 23, 1]], /*21*/
[[4], [54, 1, 1], [24, 7, 1], [36, 16, 1], [24, 17, 1]], /*22*/
[[6], [18, 6, 1], [10, 8, 1], [20, 10, 1], [10, 12, 1], [32, 14, 1], [30, 22, 1]], /*23*/
[[8], [20, 1, 1], [22, 4, 1], [46, 8, 1], [50, 10, 1], [48, 12, 1], [42, 19, 1], [16, 20, 1], [24, 21, 1]], /*24*/
[[5], [24, 11, 1], [16, 13, 1], [24, 13, 1], [38, 16, 1], [40, 20, 1]], /*25*/
[[7], [28, 2, 1], [2, 8, 1], [26, 14, 1], [0, 15, 1], [36, 16, 1], [26, 20, 1], [0, 24, 1]], /*26*/
[[15], [30, 0, 1], [36, 0, 1], [14, 4, 1], [12, 12, 1], [14, 19, 1], [14, 20, 1], [14, 21, 1], [14, 22, 1], [14, 23, 1], [30, 20, 1], [32, 20, 1], [34, 20, 1], [44, 20, 1], [46, 20, 1], [48, 20, 1]], /*27*/
[[3], [12, 3, 1], [6, 11, 1], [14, 19, 1]], /*28*/
[[19], [16, 24, 1], [18, 24, 1], [20, 24, 1], [22, 24, 1], [24, 24, 1], [12, 25, 1], [14, 25, 1], [16, 25, 1], [18, 25, 1], [20, 25, 1], [22, 25, 1], [24, 25, 1], [12, 26, 1], [14, 26, 1], [16, 26, 1], [18, 26, 1], [20, 26, 1], [22, 26, 1], [24, 26, 1]], /*29*/
[[12], [16, 5, 1], [38, 5, 1], [20, 7, 1], [32, 7, 1], [12, 12, 1], [16, 12, 1], [38, 12, 1], [42, 12, 1], [16, 17, 1], [38, 17, 1], [42, 19, 1], [10, 20, 1]], /*30*/
[[6], [12, 0, 1], [6, 2, 1], [52, 4, 1], [4, 7, 1], [52, 7, 1], [2, 24, 1]], /*31*/
[[7], [40, 0, 1], [46, 0, 1], [46, 7, 1], [40, 11, 1], [40, 15, 1], [2, 17, 1], [2, 21, 1]], /*32*/
[[6], [26, 3, 1], [44, 4, 1], [40, 7, 1], [4, 8, 1], [48, 11, 1], [32, 13, 1]], /*33*/
[[10], [10, 6, 1], [18, 6, 1], [26, 6, 1], [34, 6, 1], [42, 6, 1], [10, 10, 1], [18, 10, 1], [26, 10, 1], [34, 10, 1], [42, 10, 1]], /*34*/
[[2], [52, 11, 1], [30, 17, 1]], /*35*/
[[13], [32, 0, 1], [42, 0, 1], [54, 4, 1], [44, 5, 1], [52, 5, 1], [16, 6, 1], [40, 6, 1], [50, 6, 1], [48, 7, 1], [46, 8, 1], [44, 9, 1], [10, 17, 1], [48, 20, 1]], /*36*/
[[15], [2, 4, 1], [4, 4, 1], [2, 5, 1], [4, 5, 1], [50, 5, 1], [52, 5, 1], [54, 5, 1], [50, 6, 1], [52, 6, 1], [54, 6, 1], [28, 7, 1], [34, 7, 1], [0, 15, 1], [2, 15, 1], [6, 17, 1]], /*37*/
[[7], [0, 4, 1], [54, 4, 1], [50, 11, 1], [52, 11, 1], [50, 17, 1], [52, 17, 1], [54, 17, 1]], /*38*/
[[6], [8, 9, 1], [14, 9, 1], [22, 9, 1], [28, 9, 1], [36, 9, 1], [42, 9, 1]], /*39*/
[0], /*40*/
[[11], [44, 0, 1], [50, 0, 1], [12, 1, 1], [14, 5, 1], [50, 6, 1], [14, 12, 1], [46, 12, 1], [42, 13, 1], [38, 14, 1], [26, 20, 1], [12, 24, 1]], /*41*/
[[3], [8, 0, 1], [14, 20, 1], [46, 20, 1]], /*42*/
[[10], [0, 0, 1], [4, 0, 1], [20, 13, 1], [20, 14, 1], [10, 16, 1], [10, 17, 1], [30, 17, 1], [2, 19, 1], [12, 20, 1], [34, 20, 1]], /*43*/
[[10], [18, 1, 1], [4, 6, 1], [10, 10, 1], [14, 10, 1], [10, 14, 1], [26, 14, 1], [28, 14, 1], [10, 19, 1], [40, 19, 1], [26, 20, 1]], /*44*/
[[7], [16, 2, 1], [22, 16, 1], [12, 17, 1], [4, 22, 1], [16, 22, 1], [28, 22, 1], [42, 22, 1]], /*45*/
[[8], [32, 2, 1], [4, 6, 1], [18, 7, 1], [52, 17, 1], [34, 19, 1], [26, 22, 1], [4, 23, 1], [20, 24, 1]], /*46*/
[[7], [4, 0, 1], [38, 4, 1], [10, 8, 1], [50, 8, 1], [28, 10, 1], [28, 14, 1], [8, 17, 1]], /*47*/
[[14], [14, 4, 1], [14, 8, 1], [14, 12, 1], [14, 16, 1], [14, 20, 1], [36, 4, 1], [36, 8, 1], [36, 12, 1], [36, 16, 1], [36, 20, 1], [52, 6, 1], [52, 10, 1], [52, 14, 1], [52, 18, 1]], /*48*/
[[4], [42, 2, 1], [16, 5, 1], [38, 9, 1], [40, 9, 1]], /*49*/
[[7], [30, 10, 1], [34, 10, 1], [38, 10, 1], [42, 10, 1], [8, 13, 1], [50, 13, 1], [36, 22, 1]]];
var jscHeartMap = [// Tile 49
/*00*/
[0], /*01*/
[0], /*02*/
[[3], [18, 2, 1], [0, 17, 1], [2, 17, 1]], /*03*/
[[1], [4, 4, 1]], /*04*/
[[1], [18, 8, 1]], /*05*/
[[2], [50, 7, 1], [52, 18, 1]], /*06*/
[[1], [44, 10, 1]], /*07*/
[0], /*08*/
[[3], [18, 3, 1], [48, 3, 1], [18, 8, 1]], /*09*/
[[1], [22, 16, 1]], /*10*/
[[10], [4, 3, 1], [6, 3, 1], [8, 3, 1], [10, 3, 1], [12, 3, 1], [14, 3, 1], [16, 3, 1], [18, 3, 1], [20, 3, 1], [28, 16, 1]], /*11*/
[0], /*12*/
[[2], [10, 20, 1], [10, 23, 1]], /*13*/
[[3], [44, 4, 1], [24, 8, 1], [30, 8, 1]], /*14*/
[[1], [6, 22, 1]], /*15*/
[[2], [26, 9, 1], [30, 9, 1]], /*16*/
[0], /*17*/
[[1], [10, 7, 1]], /*18*/
[[3], [42, 9, 1], [44, 9, 1], [46, 9, 1]], /*19*/
[[5], [46, 10, 1], [46, 12, 1], [46, 13, 1], [46, 14, 1], [46, 16, 1]], /*20*/
[0], /*21*/
[[1], [32, 6, 1]], /*22*/
[[1], [18, 16, 1]], /*23*/
[[3], [20, 7, 1], [26, 7, 1], [28, 13, 1]], /*24*/
[[3], [18, 18, 1], [12, 20, 1], [36, 20, 1]], /*25*/
[[1], [32, 17, 1]], /*26*/
[[4], [10, 19, 1], [6, 23, 1], [38, 22, 1], [40, 22, 1]], /*27*/
[[2], [22, 6, 1], [24, 6, 1]], /*28*/
[[1], [10, 26, 1]], /*29*/
[0], /*30*/
[[1], [28, 17, 1]], /*31*/
[[3], [24, 2, 1], [26, 2, 1], [36, 11, 1]], /*32*/
[[4], [28, 16, 1], [32, 16, 1], [30, 17, 1], [30, 24, 1]], /*33*/
[[6], [6, 8, 1], [14, 8, 1], [22, 8, 1], [30, 8, 1], [38, 8, 1], [46, 8, 1]], /*34*/
[[3], [52, 7, 1], [30, 15, 1], [30, 19, 1]], /*35*/
[[1], [38, 0, 1]], /*36*/
[0], /*37*/
[0], /*38*/
[[1], [48, 9, 1]], /*39*/
[[1], [48, 1, 1]], /*40*/
[[6], [2, 13, 1], [16, 20, 1], [16, 26, 1], [18, 26, 1], [20, 26, 1], [22, 26, 1]], /*41*/
[[3], [52, 15, 1], [28, 20, 1], [30, 20, 1]], /*42*/
[0], /*43*/
[0], /*44*/
[[3], [34, 3, 1], [34, 4, 1], [52, 4, 1]], /*45*/
[0], /*46*/
[[2], [42, 19, 1], [52, 19, 1]], /*47*/
[0], /*48*/
[[2], [10, 17, 1], [12, 17, 1]], /*49*/
[[22], [0, 0, 1], [0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1], [0, 5, 1], [0, 6, 1], [0, 7, 1], [0, 8, 1], [0, 9, 1], [0, 10, 1], [0, 11, 1], [0, 12, 1], [0, 13, 1], [0, 14, 1], [0, 15, 1], [0, 16, 1], [0, 17, 1], [0, 18, 1], [0, 25, 1], [0, 26, 1], [26, 17, 1]]];
var jscParachute = [// Tile 50
/*00*/
[[2], [26, 16], [28, 16]], /*01*/
[[2], [18, 11], [40, 9]], /*02*/
[[1], [4, 19]], /*03*/
[0], /*04*/
[[4], [26, 3], [28, 3], [12, 7], [28, 21]], /*05*/
[[2], [12, 4], [8, 21]], /*06*/
[[2], [38, 10], [54, 12]], /*07*/
[[1], [40, 9]], /*08*/
[[9], [10, 5], [36, 10], [42, 10], [22, 11], [36, 14], [42, 14], [8, 16], [36, 18], [42, 18]], /*09*/
[[8], [26, 9], [28, 9], [4, 11], [40, 13], [34, 17], [36, 17], [42, 22], [44, 22]], /*10*/
[0], /*11*/
[0], /*12*/
[0], /*13*/
[0], /*14*/
[0], /*15*/
[0], /*16*/
[0], /*17*/
[0], /*18*/
[0], /*19*/
[0], /*20*/
[[7], [0, 8], [46, 9], [12, 16], [44, 16], [32, 18], [0, 20], [38, 21]], /*21*/
[[1], [38, 19]], /*22*/
[[4], [44, 2], [22, 11], [14, 13], [6, 19]], /*23*/
[[5], [8, 7], [18, 7], [46, 12], [4, 20], [40, 22]], /*24*/
[[2], [52, 13], [14, 14]], /*25*/
[[3], [18, 8], [10, 11], [30, 13]], /*26*/
[[5], [0, 15], [32, 15], [36, 15], [40, 15], [44, 15]], /*27*/
[[6], [30, 3], [30, 8], [40, 8], [30, 13], [30, 18], [40, 18]], /*28*/
[0], /*29*/
[[2], [6, 7], [54, 23]], /*30*/
[[3], [28, 0], [4, 11], [52, 20]], /*31*/
[0], /*32*/
[0], /*33*/
[[17], [0, 4], [0, 6], [0, 8], [0, 10], [0, 12], [0, 14], [0, 16], [0, 18], [0, 20], [2, 5], [2, 7], [2, 9], [2, 11], [2, 13], [2, 15], [2, 17], [2, 19]], /*34*/
[[5], [0, 2], [2, 2], [0, 7], [2, 7], [52, 17]], /*35*/
[[8], [0, 3], [2, 2], [4, 3], [6, 2], [8, 3], [18, 12], [42, 16], [18, 18]], /*36*/
[0], /*37*/
[0], /*38*/
[0], /*39*/
[0], /*40*/
[[6], [28, 12], [28, 17], [30, 17], [32, 17], [34, 17], [26, 23]], /*41*/
[[1], [6, 3]], /*42*/
[[2], [14, 3], [40, 4]], /*43*/
[[2], [0, 12], [0, 15]], /*44*/
[0], /*45*/
[0], /*46*/
[[7], [22, 8], [22, 12], [22, 16], [48, 3], [48, 13], [48, 17], [48, 21]], /*47*/
[[2], [48, 13], [50, 13]], /*48*/
[[8], [50, 4], [8, 8], [10, 19], [12, 19], [22, 20], [24, 20], [30, 20], [32, 20]], /*49*/
[0]];
var jscJetpack = [/*00*/
[0], /*01*/
[0], /*02*/
[0], /*03*/
[0], /*04*/
[0], /*05*/
[0], /*06*/
[0], /*07*/
[[2], [52, 10], [52, 11]], /*08*/
[0], /*09*/
[0], /*10*/
[[2], [18, 25], [48, 25]], /*11*/
[0], /*12*/
[0], /*13*/
[[3], [48, 4], [26, 11], [24, 26]], /*14*/
[[1], [18, 26]], /*15*/
[0], /*16*/
[0], /*17*/
[[1], [30, 5]], /*18*/
[[1], [32, 26]], /*19*/
[0], /*20*/
[0], /*21*/
[0], /*22*/
[0], /*23*/
[0], /*24*/
[0], /*25*/
[0], /*26*/
[0], /*27*/
[0], /*28*/
[0], /*29*/
[0], /*30*/
[0], /*31*/
[0], /*32*/
[0], /*33*/
[0], /*34*/
[0], /*35*/
[0], /*36*/
[0], /*37*/
[0], /*38*/
[0], /*39*/
[0], /*40*/
[0], /*41*/
[0], /*42*/
[0], /*43*/
[0], /*44*/
[0], /*45*/
[0], /*46*/
[0], /*47*/
[0], /*48*/
[0], /*49*/
[0]];
var jscArrow = [//Down = 42, Left = 43, Right = 44, Up = 45
/*00*/
[[3], [42, 26, 27, 4], [42, 28, 27, 4], [44, 54, 21, 1]], /*01*/
[[5], [43, 0, 21, 0], [44, 54, 15, 2], [44, 54, 19, 2], [44, 54, 24, 2], [44, 54, 25, 2]], /*02*/
[[4], [42, 54, 27, 6], [43, 0, 14, 1], [43, 0, 19, 1], [43, 0, 24, 1]], /*03*/
[[2], [44, 54, 11, 4], [44, 54, 23, 4]], /*04*/
[[8], [42, 44, 27, 13], [43, 0, 11, 3], [43, 0, 23, 3], [44, 54, 7, 5], [44, 54, 11, 5], [44, 54, 12, 5], [44, 54, 19, 5], [44, 54, 23, 5]], /*05*/
[[9], [43, 0, 7, 4], [43, 0, 11, 4], [43, 0, 19, 4], [43, 0, 23, 4], [44, 54, 7, 6], [44, 54, 13, 6], [44, 54, 16, 6], [44, 54, 23, 6], [44, 54, 26, 6]], /*06*/
[[7], [43, 0, 13, 5], [43, 0, 16, 5], [43, 0, 19, 5], [43, 0, 26, 5], [45, 44, 0, 2], [44, 54, 22, 7], [44, 54, 25, 7]], /*07*/
[[2], [43, 0, 22, 6], [44, 54, 2, 8]], /*08*/
[[5], [42, 2, 27, 17], [42, 4, 27, 17], [42, 6, 27, 17], [42, 8, 27, 17], [43, 0, 2, 7]], /*09*/
[0], /*10*/
[[11], [42, 28, 27, 23], [44, 54, 7, 11], [44, 54, 8, 11], [44, 54, 9, 11], [44, 54, 10, 11], [44, 54, 13, 11], [44, 54, 14, 11], [44, 54, 15, 11], [44, 54, 21, 11], [44, 54, 22, 11], [44, 54, 23, 11]], /*11*/
[[10], [43, 0, 7, 10], [43, 0, 8, 10], [43, 0, 9, 10], [43, 0, 10, 10], [43, 0, 18, 10], [44, 54, 9, 12], [44, 54, 10, 12], [44, 54, 11, 12], [44, 54, 12, 12], [44, 54, 13, 12]], /*12*/
[[4], [43, 0, 10, 11], [43, 0, 12, 11], [44, 54, 10, 13], [44, 54, 12, 13]], /*13*/
[[4], [42, 28, 27, 24], [43, 0, 10, 12], [43, 0, 12, 12], [44, 54, 10, 14]], /*14*/
[[13], [42, 32, 27, 25], [43, 0, 10, 13], [44, 54, 4, 15], [44, 54, 6, 15], [44, 54, 8, 15], [44, 54, 10, 15], [44, 54, 12, 15], [44, 54, 14, 15], [44, 54, 16, 15], [44, 54, 18, 15], [44, 54, 20, 15], [44, 54, 22, 15], [44, 54, 24, 15]], /*15*/
[[22], [43, 0, 4, 14], [43, 0, 6, 14], [43, 0, 8, 14], [43, 0, 10, 14], [43, 0, 12, 14], [43, 0, 14, 14], [43, 0, 16, 14], [43, 0, 18, 14], [43, 0, 20, 14], [43, 0, 22, 14], [43, 0, 24, 14], [44, 54, 4, 16], [44, 54, 6, 16], [44, 54, 8, 16], [44, 54, 10, 16], [44, 54, 12, 16], [44, 54, 14, 16], [44, 54, 16, 16], [44, 54, 18, 16], [44, 54, 20, 16], [44, 54, 22, 16], [44, 54, 24, 16]], /*16*/
[[16], [43, 0, 4, 15], [43, 0, 6, 15], [43, 0, 8, 15], [43, 0, 10, 15], [43, 0, 12, 15], [43, 0, 14, 15], [43, 0, 16, 15], [43, 0, 18, 15], [43, 0, 20, 15], [43, 0, 22, 15], [43, 0, 24, 15], [44, 54, 11, 17], [44, 54, 13, 17], [44, 54, 15, 17], [44, 54, 17, 17], [44, 54, 19, 17]], /*17*/
[[6], [43, 0, 11, 16], [43, 0, 13, 16], [43, 0, 15, 16], [43, 0, 17, 16], [43, 0, 19, 16], [44, 54, 11, 18]], /*18*/
[[3], [42, 50, 27, 26], [43, 0, 11, 17], [44, 54, 9, 19]], /*19*/
[[1], [43, 0, 9, 18]], /*20*/
[[2], [44, 54, 1, 21], [44, 54, 22, 21]], /*21*/
[[3], [43, 0, 1, 20], [43, 0, 23, 20], [44, 54, 24, 22]], /*22*/
[[4], [42, 30, 27, 30], [42, 46, 27, 30], [43, 0, 25, 21], [44, 54, 1, 23]], /*23*/
[[4], [42, 4, 27, 31], [42, 40, 27, 31], [43, 0, 1, 22], [45, 24, 0, 10]], /*24*/
[[3], [42, 0, 27, 34], [44, 54, 4, 25], [45, 26, 0, 13]], /*25*/
[[3], [42, 4, 27, 35], [43, 0, 5, 24], [45, 22, 0, 14]], /*26*/
[[3], [44, 54, 1, 27], [44, 54, 23, 27], [45, 46, 0, 18]], /*27*/
[[3], [43, 0, 1, 26], [43, 0, 24, 26], [44, 54, 25, 28]], /*28*/
[[2], [43, 0, 26, 27], [44, 54, 25, 29]], /*29*/
[[1], [43, 0, 24, 28]], /*30*/
[[3], [44, 54, 4, 31], [44, 54, 25, 31], [45, 48, 0, 22]], /*31*/
[[6], [43, 0, 4, 30], [43, 0, 20, 30], [43, 0, 25, 30], [44, 54, 7, 32], [44, 54, 25, 32], [45, 6, 0, 23]], /*32*/
[[3], [43, 0, 24, 31], [44, 54, 1, 33], [44, 54, 22, 33]], /*33*/
[[2], [43, 0, 22, 32], [44, 54, 26, 34]], /*34*/
[[6], [42, 24, 27, 40], [42, 26, 27, 40], [43, 0, 26, 33], [44, 54, 11, 35], [44, 54, 24, 35], [45, 4, 0, 24]], /*35*/
[[7], [42, 4, 27, 41], [43, 0, 25, 34], [43, 0, 10, 34], [44, 54, 2, 36], [44, 54, 14, 36], [44, 54, 25, 36], [45, 18, 0, 25]], /*36*/
[[7], [42, 14, 27, 42], [42, 40, 27, 42], [43, 0, 25, 35], [43, 0, 6, 35], [43, 0, 2, 35], [44, 54, 2, 37], [44, 54, 25, 37]], /*37*/
[[4], [43, 0, 25, 36], [43, 0, 2, 36], [44, 54, 2, 38], [44, 54, 25, 38]], /*38*/
[[7], [43, 0, 25, 37], [43, 0, 2, 37], [44, 54, 3, 39], [44, 54, 7, 39], [44, 54, 11, 39], [44, 54, 16, 39], [44, 54, 25, 39]], /*39*/
[[8], [42, 50, 27, 45], [42, 52, 27, 45], [42, 54, 27, 45], [43, 0, 25, 38], [43, 0, 16, 38], [43, 0, 11, 38], [43, 0, 7, 38], [43, 0, 3, 38]], /*40*/
[[3], [44, 54, 6, 41], [44, 54, 20, 41], [44, 54, 26, 41]], /*41*/
[[5], [42, 48, 27, 47], [43, 0, 26, 40], [43, 0, 19, 40], [43, 0, 6, 40], [44, 54, 26, 42]], /*42*/
[[4], [43, 0, 26, 41], [44, 54, 2, 43], [44, 54, 5, 43], [44, 54, 26, 43]], /*43*/
[[4], [42, 50, 27, 48], [43, 0, 26, 42], [43, 0, 6, 42], [43, 0, 3, 42]], /*44*/
[[9], [43, 0, 21, 43], [43, 0, 20, 43], [43, 0, 19, 43], [44, 54, 8, 45], [44, 54, 9, 45], [44, 54, 10, 45], [44, 54, 19, 45], [44, 54, 20, 45], [44, 54, 21, 45]], /*45*/
[[6], [43, 0, 21, 44], [43, 0, 20, 44], [43, 0, 19, 44], [43, 0, 10, 44], [43, 0, 9, 44], [43, 0, 8, 44]], /*46*/
[[3], [44, 54, 2, 47], [44, 54, 26, 47], [45, 10, 0, 40]], /*47*/
[[2], [43, 0, 26, 46], [43, 0, 2, 46]], /*48*/
[[2], [44, 54, 22, 49], [45, 12, 0, 43]], /*49*/
[[1], [45, 14, 0, 48]]];
var jscLift = [// LiftUpper.png = 62
/*00*/
[0], // 00
/*01*/
[[1], [128, 416, 128, 368, 'up', 0, 0, '']], // 01
/*02*/
[[6], [160, 416, 160, 304, 'down', 0, 0, ''], [256, 416, 256, 304, 'up', 0, 0, ''], [352, 416, 352, 304, 'down', 0, 0, ''], [448, 416, 448, 304, 'up', 0, 0, ''], [480, 160, 480, 64, 'down', 0, 0, ''], [832, 304, 832, 240, 'up', 0, 0, '']], // 02
/*03*/
[[2], [320, 416, 320, 112, 'up', 0, 0, ''], [736, 416, 736, 224, 'down', 0, 0, '']], // 03
/*04*/
[[2], [128, 400, 128, 112, 'up', 0, 0, ''], [704, 304, 704, 208, 'down', 0, 0, '']], // 04
/*05*/
[0], // 05
/*06*/
[[2], [160, 320, 160, 112, 'up', 0, 0, ''], [416, 320, 416, 112, 'up', 0, 0, '']], // 06
/*07*/
[[1], [736, 384, 736, 64, 'up', 0, 0, '']], // 07
/*08*/
[0], /*09*/
[0], /*10*/
[0], /*11*/
[0], /*12*/
[0], /*13*/
[0], /*14*/
[0], /*15*/
[0], /*16*/
[0], /*17*/
[0], /*18*/
[0], /*19*/
[0], /*20*/
[[2], [640, 416, 640, 192, 'up', 0, 0, ''], [608, 112, 608, 64, 'up', 0, 0, '']], /*21*/
[[2], [0, 256, 0, 128, 'down', 0, 0, ''], [832, 272, 832, 208, 'down', 0, 0, '']], /*22*/
[[1], [832, 416, 832, 272, 'up', 0, 0, '']], /*23*/
[0], /*24*/
[[2], [64, 112, 64, 64, 'down', 0, 0, ''], [96, 336, 96, 224, 'down', 0, 0, '']], /*25*/
[[1], [800, 96, 800, 64, 'down', 0, 0, '']], /*26*/
[[1], [0, 128, 0, 64, 'down', 0, 0, '']], /*27*/
[0], /*28*/
[0], /*29*/
[[1], [32, 416, 32, 224, 'up', 0, 0, '']], /*30*/
[[1], [672, 272, 672, 160, 'up', 0, 0, '']], /*31*/
[[3], [96, 208, 96, 160, 'up', 0, 0, ''], [320, 288, 320, 208, 'up', 0, 0, ''], [96, 352, 96, 288, 'up', 0, 0, '']], /*32*/
[[4], [128, 208, 128, 144, 'down', 0, 0, ''], [192, 304, 192, 64, 'down', 0, 0, ''], [256, 240, 256, 80, 'down', 0, 0, ''], [768, 416, 768, 208, 'down', 0, 0, '']], //last one gets overwritten by boat in original and you die! I wander if mine will be the same?
/*33*/
[0], /*34*/
[[1], [736, 272, 736, 144, 'down', 0, 0, '']], /*35*/
[0], /*36*/
[[1], [480, 192, 480, 128, 'up', 0, 0, '']], /*37*/
[0], /*38*/
[[3], [0, 192, 0, 128, 'down', 0, 0, ''], [0, 336, 0, 288, 'down', 0, 0, ''], [800, 416, 800, 352, 'down', 0, 0, '']], /*39*/
[[2], [576, 128, 576, 64, 'down', 0, 0, ''], [576, 288, 576, 224, 'down', 0, 0, '']], /*40*/
[[5], [0, 112, 0, 64, 'down', 0, 0, ''], [480, 208, 480, 112, 'up', 0, 0, ''], [800, 224, 800, 128, 'down', 0, 0, ''], [768, 368, 768, 320, 'up', 0, 0, ''], [0, 416, 0, 368, 'up', 0, 0, '']], /*41*/
[[1], [544, 208, 544, 128, 'up', 0, 0, '']], /*42*/
[[3], [0, 208, 0, 128, 'up', 0, 0, ''], [608, 304, 608, 208, 'up', 0, 0, ''], [832, 352, 832, 304, 'up', 0, 0, '']], /*43*/
[[2], [32, 352, 32, 272, 'up', 0, 0, ''], [480, 416, 480, 272, 'up', 0, 0, '']], /*44*/
[0], /*45*/
[0], /*46*/
[0], /*47*/
[0], /*48*/
[[3], [64, 400, 64, 80, 'up', 0, 0, ''], [416, 320, 416, 256, 'up', 0, 0, ''], [768, 256, 768, 192, 'up', 0, 0, '']], /*49*/
[[2], [480, 384, 480, 320, 'up', 0, 0, ''], [640, 384, 640, 256, 'up', 0, 0, '']]];
var jscEvil = [//
/*00*/
[[1], [0, 0, 848, 0, 59, 'right', 0, 0, '']], /*01*/
[0], /*02*/
[[2], [640, 0, 848, 0, 60, 'right', 0, 0, ''], [0, 80, 432, 80, 60, 'right', 0, 0, '']], /*03*/
[[1], [64, 80, 784, 80, 57, 'right', 0, 0, '']], /*04*/
[[1], [312, 272, 624, 272, 55, 'right', 0, 0, '']], /*05*/
[0], /*06*/
[[1], [320, 368, 624, 368, 58, 'right', 0, 0, '']], /*07*/
[[4], [0, 160, 656, 160, 59, 'right', 0, 0, ''], [0, 208, 656, 208, 59, 'right', 0, 0, ''], [0, 256, 656, 256, 59, 'right', 0, 0, ''], [0, 304, 656, 304, 59, 'right', 0, 0, '']], /*08*/
[[1], [352, 32, 704, 32, 60, 'right', 0, 0, '']], /*09*/
[[2], [192, 336, 528, 336, 57, 'right', 0, 0, ''], [544, 64, 544, 240, 57, 'down', 0, 0, '']], /*10*/
[[1], [96, 32, 672, 32, 55, 'right', 0, 0, '']], /*11*/
[0], /*12*/
[0], /*13*/
[[1], [192, 192, 592, 193, 55, 'right', 0, 0, '']], /*14*/
[[1], [192, 112, 752, 112, 55, 'right', 0, 0, '']], /*15*/
[[1], [192, 352, 624, 352, 55, 'right', 0, 0, '']], /*16*/
[0], /*17*/
[0], /*18*/
[0], /*19*/
[[1], [160, 352, 496, 352, 55, 'right', 0, 0, '']], /*20*/
[0], /*21*/
[0], /*22*/
[0], /*23*/
[0], /*24*/
[0], /*25*/
[0], /*26*/
[0], /*27*/
[0], /*28*/
[0], /*29*/
[0], /*30*/
[[3], [240, 0, 240, 96, 55, 'down', 0, 0, ''], [320, 0, 320, 96, 55, 'down', 0, 0, ''], [256, 288, 256, 368, 55, 'down', 0, 0, '']], /*31*/
[[2], [416, 192, 752, 192, 55, 'right', 0, 0, ''], [416, 272, 672, 272, 55, 'right', 0, 0, '']], /*32*/
[[4], [480, 0, 480, 208, 55, 'down', 0, 0, ''], [544, 80, 752, 80, 55, 'right', 0, 0, ''], [256, 224, 624, 224, 55, 'right', 0, 0, ''], [320, 240, 592, 240, 55, 'right', 0, 0, '']], /*33*/
[[5], [64, 144, 240, 144, 55, 'right', 0, 0, ''], [288, 144, 496, 144, 55, 'right', 0, 0, ''], [544, 144, 816, 144, 55, 'right', 0, 0, ''], [64, 176, 816, 176, 55, 'right', 0, 0, ''], [32, 352, 816, 352, 55, 'left', 0, 0, '']], /*34*/
[[5], [128, 0, 128, 192, 55, 'down', 0, 0, ''], [256, 48, 256, 112, 55, 'down', 0, 0, ''], [384, 48, 384, 104, 55, 'down', 0, 0, ''], [512, 48, 512, 112, 55, 'down', 0, 0, ''], [640, 48, 640, 104, 55, 'down', 0, 0, '']], /*35*/
[[5], [384, 0, 384, 160, 55, 'down', 0, 0, ''], [448, 32, 528, 32, 55, 'right', 0, 0, ''], [608, 0, 608, 160, 55, 'down', 0, 0, ''], [352, 224, 528, 224, 55, 'right', 0, 0, ''], [384, 336, 816, 336, 55, 'right', 0, 0, '']], /*36*/
[[5], [128, 64, 128, 400, 55, 'down', 0, 0, ''], [256, 64, 256, 400, 55, 'down', 0, 0, ''], [384, 64, 384, 400, 55, 'down', 0, 0, ''], [576, 64, 576, 400, 55, 'down', 0, 0, ''], [704, 64, 704, 400, 55, 'down', 0, 0, '']], /*37*/
[[1], [96, 32, 688, 32, 55, 'right', 0, 0, '']], /*38*/
[[3], [96, 0, 752, 0, 55, 'right', 0, 0, ''], [96, 64, 352, 64, 55, 'right', 0, 0, ''], [64, 208, 752, 208, 55, 'right', 0, 0, '']], /*39*/
[[2], [96, 48, 496, 48, 55, 'right', 0, 0, ''], [96, 112, 496, 112, 55, 'right', 0, 0, '']], /*40*/
[0], /*41*/
[0], /*42*/
[0], /*43*/
[0], /*44*/
[0], /*45*/
[0], /*46*/
[[4], [320, 48, 656, 48, 55, 'right', 0, 0, ''], [192, 240, 192, 320, 55, 'down', 0, 0, ''], [384, 352, 512, 352, 55, 'right', 0, 0, ''], [96, 416, 560, 416, 55, 'right', 0, 0, '']], /*47*/
[0], /*48*/
[[5], [416, 32, 592, 32, 55, 'right', 0, 0, ''], [352, 96, 352, 320, 55, 'down', 0, 0, ''], [480, 96, 480, 320, 55, 'down', 0, 0, ''], [224, 272, 272, 272, 55, 'right', 0, 0, ''], [128, 352, 496, 352, 55, 'right', 0, 0, '']], /*49*/
[[2], [320, 128, 656, 128, 57, 'right', 0, 0, ''], [256, 272, 256, 400, 57, 'down', 0, 0, '']]];
var jscBoat = [//
/*00*/
[0], /*01*/
[0], /*02*/
[0], /*03*/
[0], /*04*/
[0], /*05*/
[0], /*06*/
[0], /*07*/
[0], /*08*/
[0], /*09*/
[0], /*10*/
[0], /*11*/
[0], /*12*/
[0], /*13*/
[0], /*14*/
[0], /*15*/
[0], /*16*/
[0], /*17*/
[0], /*18*/
[0], /*19*/
[0], /*20*/
[0], /*21*/
[0], /*22*/
[0], /*23*/
[0], /*24*/
[0], /*25*/
[0], /*26*/
[0], /*27*/
[0], /*28*/
[0], /*29*/
[0], /*30*/
[[1], [48, 416, 800, 416, 'right', 0, 0, '']], /*31*/
[[1], [48, 416, 800, 416, 'right', 0, 0, '']], /*32*/
[[1], [48, 416, 800, 416, 'right', 0, 0, '']], /*33*/
[[1], [112, 416, 608, 416, 'right', 0, 0, '']], /*34*/
[0], /*35*/
[[1], [176, 416, 800, 416, 'right', 0, 0, '']], /*36*/
[0], /*37*/
[[4], [80, 244, 736, 244, 'right', 0, 0, ''], [48, 320, 288, 320, 'right', 0, 0, ''], [464, 320, 736, 320, 'right', 0, 0, ''], [80, 416, 768, 416, 'right', 0, 0, '']], /*38*/
[[1], [80, 416, 704, 416, 'right', 0, 0, '']], /*39*/
[[1], [112, 416, 576, 416, 'right', 0, 0, '']], /*40*/
[0], /*41*/
[0], /*42*/
[[1], [112, 416, 736, 416, 'right', 0, 0, '']], /*43*/
[0], /*44*/
[0], /*45*/
[0], /*46*/
[0], /*47*/
[0], /*48*/
[0], /*49*/
[0]];


var jscTeleport = [// [Current Level , Destination Level , x , y]
[0, 5, 352, 336], [2, 2, 672, 320], [5, 0, 672, 384], [6, 9, 640, 368], [9, 8, 352, 368], [8, 6, 288, 192], [19, 4, 432, 224], [28, 28, 448, 400], [42, 42, 288, 272], [43, 43, 800, 240], [46, 46, 96, 16], [48, 48, 544, 224], [49, 4, 432, 224]];


var jscTiles = [//16x16 pics
[0, 0], //I have put in a Blank 16x16 square for 0 this time
[24, 0], [48, 0], [72, 0], [96, 0], [120, 0], [144, 0], [168, 0], [192, 0], //8
[216, 0], [240, 0], [264, 0], [288, 0], [312, 0], [336, 0], [360, 0], [384, 0], //16
//2ND ROW:
[0, 28], //17  bullet under
[24, 28], //18  bullet over
[48, 28], //19
[72, 28], //20
[96, 28], //
[120, 28], //
[144, 28], //
[168, 28], //
[192, 28], //25
[216, 28], //
[240, 28], //
[264, 28], //
[288, 28], //
[312, 28], //30
[336, 28], //
[360, 28], //32?!?
[384, 28], //
//3RD ROW:
[0, 53], //
[24, 53], //35
[48, 53], //
[72, 53], //
[96, 53], //
[120, 53], //
[144, 53], //40
[168, 53], //
//32x16
[192, 53], //42  arrow-down
[232, 53], //43  arrow-left
[272, 53], //44  arrow-right
[312, 53], //45  arrow-up
[352, 53], //46  water-tile
//4TH ROW:
[0, 78], //detonator
[40, 78], //crystal
[80, 78], //heart
[120, 78], //parachute
[160, 78], //stair
[200, 78], //laser-bottom
[240, 78], //laser-middle
[280, 78], //laser-top
//32x32
[104, 196, 167, 196], //55    new special one for evil no. 55 - it has animated eyes - do both sets of co-ordinates...
//48x16
[320, 78], //56  boat
//48x32
[104, 236], //57  Evil-joystick
[164, 236], //58  Evil-grabber
[279, 196], //59  Evil-TV
[223, 196], //60  Evil-yellow ghost
//64x16
[0, 126], //61  lift-base
[0, 102], //62  lift
[72, 102], //63  teleport-top
[144, 102], //64  teleport-middle
[216, 102], //65  teleport-bottom
//64x32
[0, 156], //66  trampoline
//72x16
[222, 243], //67  boxing glove-Right
[310, 243], //68  boxing glove-left
//96x48!!!!!
[0, 196], //69  swimming crystal
//Bod images = 70 - 77
[72, 126], //BCL1    70
[124, 126], //BCL2  71
[176, 126], //BCR1  72
[228, 126], //BCR2  73
[78, 156], //BL1    74  82 - 4
[130, 156], //BL2    75  134
[186, 156], //BR1    76  186
[240, 156], //BR2    77  240
//JetPack images = 78 - 81
[294, 102], //LeftOff    78
[322, 102], //LeftON    79
[354, 102], //RightOff  80  354
[384, 102]//RightON    81    384
];


var jscTilesOLD = [//16x16 pics
[0, 0], //I have put in a Blank 16x16 square for 0 this time
[16, 0], [32, 0], [48, 0], [64, 0], [80, 0], [96, 0], [112, 0], [128, 0], [144, 0], [160, 0], [176, 0], [192, 0], [208, 0], [224, 0], [240, 0], [256, 0], [0, 16], [16, 16], [32, 16], [48, 16], [64, 16], [80, 16], [96, 16], [112, 16], [128, 16], [144, 16], [160, 16], [176, 16], [192, 16], [208, 16], [224, 16], [240, 16], [256, 16], [0, 32], [16, 32], [32, 32], [48, 32], [64, 32], [80, 32], [96, 32], [112, 32], //32x16
[128, 32], [160, 32], [192, 32], [224, 32], [0, 48], [32, 48], [64, 48], [96, 48], [128, 48], [160, 48], [192, 48], [224, 48], [0, 64], //32x32
//[32,64],
[168, 192, 216, 192], //new special one for evil no. 55 - it has animated eyes - do both sets of co-ordinates...
//48x16
[48, 112], //48x32
[112, 64], [160, 64], [208, 64], [0, 96], //64x16
[48, 96], [112, 96], [176, 96], [112, 112], [176, 112], //64x32
[0, 128], //80x16
[64, 128], [144, 128], //96x48!!!!!
[0, 160], //Bod images = 70  77
[64, 144], //BCL1   70
[112, 144], //BCL2  71
[160, 144], //BCR1  72
[208, 144], //BCR2  73
[96, 160], //BL1    74
[132, 160], //BL2   75
[164, 160], //BR1   76
[196, 160], //BR2   77
//JetPack images = 78  81
[96, 192], //LeftOff    78
[112, 192], //LeftON    79
[132, 192], //RightOff  80
[152, 192]//RightON  81
];


var JsCavernCL =
''
;
