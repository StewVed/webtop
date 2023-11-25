/**
 * @license Copyright © 2023 Stewart J. Robinson (AKA StewVed, Ved)
 * To show your appreciation of my work, feel free to talk about, and link to my website(s)
 * If you wish to copy/use code from [any part of] my website(s), please contact me. Thankyou.
*/

/*
  -- GOOGLE CLOSURE STUFF --

cd "C:\Users\StewVed\Google Drive\Website stuff\webtop\wordSearch"

java -jar closure-compiler-v20181210.jar --js_output_file 190508.js --compilation_level ADVANCED_OPTIMIZATIONS --js main.js --js wordList_141222.js

for CSS:
java -jar closure-stylesheets-150.jar --allowed-unrecognized-property user-select style.css > 190508.css
©
*/


// use google closure to add the wordlist to this file. take the file off index.html.

//cancel fullscreen:
var killFS = (document.exitFullscreen || document.mozCancelFullScreen || document.webkitExitFullscreen || document.msExitFullscreen)
//kick up fullscreen:
, getFS = (document.documentElement.requestFullscreen || document.documentElement.mozRequestFullScreen || document.documentElement.webkitRequestFullscreen || document.documentElement.msRequestFullscreen)
//mousewheel event, based on the all-encompassing mozDev version
, mouseWheelType = 'onwheel' in document.createElement('div') ? 'wheel' : document.onmousewheel ? 'mousewheel' : 'DOMMouseScroll'
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
//Gamepad:
, gamePadVars = []
, gamepadReMap = [2, 3, 0, 1]
//keyboard:
, keyVars = []
//For touch-enabled devices
, touchVars = []
// for scaling, once the game is drawn, make a note of it's size.
, initScreenWidth = 0
, initScreenHeight = 0

//create the gameVars object to keep all vars in one place
//this shouldn't be needed once decoupled completely.
, gameVars = []
, settingsDimentions = {left:0,top:0,width:0,height:0}

;


/*
  ToDo:
  Add ability to 'circle' non-listed words that are in the word database.
    make them a different color and add them to the wordlist so they can be defined.
    compress the code!!!!!
  use globalScript for the low-level code?
*/

//using Google Closure, this is needed.
window['init'] = init;

function init() {
  gameVars.Vars = {
    zArray: [],
    zWords: [],
    crrcts: [],
    selecting: false,
    StartCell: '',
    f0und: 0,
    grdSze: '',
    dims: [12, 16, 12],
    selD: []
  };
  //words:12, zWidth:16, zHeight:12

  document.body.innerHTML +=
      '<div id="' + '_gridCont" class="wordSearch_gridCont">'
      + '<div id="gridTest" class="wordSearch_grid">X</div>'
    + '</div>'
    + '<div id="_clue" class="wordSearch_clue"></div>'
  //add fullscreen toggler to the window (Container, and after Box so it should be above)
    + '<div id="fs" class="wordSearch_Cluse fsButton" style="right:1.3em;bottom:0;">&#9974;</div>'
      + '<div id="sets" class="wordSearch_Cluse fsButton" style="right:4.3em;bottom:0;">'
      + '<div id="setsOpen">&#9776;</div>'
      + '<div id="settInner" class="settInner" style="visibility:hidden;top:0px;">'
      + '<div id="setsClose" class="buttonClose">X</div>'
      //+ '<div id="bAbout" class="uButtons uButtonGrey">About</div>'
      + wordSearch_Options()
      + '<br><div id="gameChange" class="uButtons uButtonDisabled" style="margin-top:0.4em;">Apply Changes</div>'
      //+ '<br><br><div id="bChange" class="uButtons uButtonGrey">Wordsearch ChangeLog</div>'
      + '<hr>' //Now for the Support buttons:
      + supportStewved
      + appAbout
      + appBugs
      + appCP
      + '</div>'
    + '</div>';
  ;
  var gridSize = document.getElementById('gridTest').offsetWidth;

  if (gridSize < document.getElementById('gridTest').offsetHeight) {
    gridSize = document.getElementById('gridTest').offsetHeight;
  }

  gameVars.Vars.grdSze = gridSize;

  //add eventListners for the select elements, because they are editEnable
  document.getElementById('WSOption_0').addEventListener('change',wordSearch_menuSelect, false);
  document.getElementById('WSOption_1').addEventListener('change',wordSearch_menuSelect, false);
  document.getElementById('WSOption_2').addEventListener('change',wordSearch_menuSelect, false);


  //Add event listeners to the game element
  addEventListeners();
  //initialize the mouse event
  mouseClear();
  //initialize the scroll vars
  scrollClear();

  //integrate this into this file for production? bout 700KB total
  //fLoadSimple('wordList_141222.js', 'script', 'wordList', 'Word List', 'init2');
  init2();
}

function init2() {
  //debugger;

  //find out how big each grid peice would be
  /*
    create a single grid square and put a letter in it.
    with the font set as whatever the user uses, the box should then
    resize itself.
    I can then see ize of the default sized box and work out the rest from there.
  */
  var zGrid = '';

  for (var x = 0; x < gameVars.Vars.dims[1]; x++) {
    gameVars.Vars.zArray[x] = [];
    for (var y = 0; y < gameVars.Vars.dims[2]; y++) {
      gameVars.Vars.zArray[x][y] = '';
      zGrid += '<div id="' + '_' + x + 'I' + y
      + '" class="wordSearch_grid" style="'
      + 'left:' + (x * gameVars.Vars.grdSze) + 'px;'
      + 'top:' + (y * gameVars.Vars.grdSze) + 'px;'
      + 'height:' + gameVars.Vars.grdSze + 'px;'
      + 'width:' + gameVars.Vars.grdSze + 'px;'
      + '"\>X</div>'
    }
  }
  //add the selecter div to the grid:
  zGrid += '<div id="Slct" class="wordSearch_Slct"</div>'
  //set the width and height of the grid container:
  document.getElementById('_gridCont').style.width =
    4 + (gameVars.Vars.grdSze * gameVars.Vars.dims[1]) + 'px';
  document.getElementById('_gridCont').style.height =
    (gameVars.Vars.grdSze * gameVars.Vars.dims[2]) + 'px';
  //add the letters and selecter to the grid container:
  document.getElementById('_gridCont').innerHTML = zGrid;

  //now for the clues:
  //make generic buttons then sort them when completing the puzzle.
  var menuString = '<div id="clueInner" style="position:relative;">'
    + '<div id="Cl-0" class="wordSearch_Cluse" style="color:#FFFEDD;">&nbsp;MWMWMWMW&nbsp;</div>'
  ;
  for (var x = 1; x < gameVars.Vars.dims[0]; x++) {
    menuString += '<div id="Cl-' + x + '" class="wordSearch_Cluse">&nbsp;</div>';
  }
  document.getElementById('_clue').innerHTML = menuString + '</div>';

  upSetClass(document.getElementById('_clue'));

  gameVars.Vars.selD.Start = '';
  gameVars.Vars.selD.End = '';

  getGame();
  redraw();
}
function anim() {
  for (var x = 0; x < gameVars.Vars.dims[1]; x++) {
    for (var y = 0; y < gameVars.Vars.dims[2]; y++) {
      document.getElementById('_' + x + 'I' + y).innerHTML = String.fromCharCode((Math.random() * 26) + 65);// '<p class="wordSearch_ctr">' + String.fromCharCode((Math.random() * 26) + 65) + '</p>';
    }
  }
  if (gameVars.Vars.AnimNum < 6 || gameVars.Vars.zWords.length < gameVars.Vars.dims[0]) {
    gameVars.Vars.AnimNum++;
    gameVars.Vars.Ftimer = window.setTimeout(function() {
      anim()
    }, 100);
  } else {
    completePuzzle();
  }
}
function createPuzzle() {
  //randomise the starting point of the word
  //x to the left and y to the sky.
  var sX = Math.floor(Math.random() * gameVars.Vars.dims[1]);
  //HORIZONTAL
  var sY = Math.floor(Math.random() * gameVars.Vars.dims[2]);
  //VERTICAL
  //randomise the direction of the word
  var Drctn = Math.floor(Math.random() * 8);
  var rndLimit;
  var plusX = 0, plusY = 0;
  //count how many letters the word can have before it gets to the edge of the grid
  if (Drctn == 0) {
    //Up
    rndLimit = sY;
    plusY = -1;
  } else if (Drctn == 1) {
    // Diagonal Up & Right
    if (sY <= (gameVars.Vars.dims[1] - sX)) {
      rndLimit = sY;
    } else {
      rndLimit = (gameVars.Vars.dims[1] - sX);
    }
    plusX = 1;
    plusY = -1;
  } else if (Drctn == 2) {
    // Right
    rndLimit = (gameVars.Vars.dims[1] - sX);
    plusX = 1;
  } else if (Drctn == 3) {
    // Diagonal Right & Down
    if ((gameVars.Vars.dims[2] - sY) <= (gameVars.Vars.dims[1] - sX)) {
      rndLimit = (gameVars.Vars.dims[2] - sY);
    } else {
      rndLimit = (gameVars.Vars.dims[1] - sX);
    }
    plusX = plusY = 1;
  } else if (Drctn == 4) {
    // Down
    rndLimit = gameVars.Vars.dims[2] - sY;
    plusY = 1;
  } else if (Drctn == 5) {
    // Diagonal Down & Left
    if ((gameVars.Vars.dims[2] - sY) <= sX) {
      rndLimit = (gameVars.Vars.dims[2] - sY);
    } else {
      rndLimit = sX;
    }
    plusX = -1;
    plusY = 1;
  } else if (Drctn == 6) {
    // Left
    rndLimit = sX;
    plusX = -1;
  } else if (Drctn == 7) {
    // Diagonal Left & Up
    if (sY <= sX) {
      rndLimit = sY;
    } else {
      rndLimit = sX;
    }
    plusX = plusY = -1;
  }
  if (rndLimit < 4) {
    createPuzzle();
    return;
  } else if (rndLimit > 8) {
    rndLimit = 8;
  }
  var wrdSize = Math.floor((Math.random() * (rndLimit - 3)) + 4);
  var zWord = rndWrd(wrdSize);
  if (zWord.length == 0) {
    var blah = '';
  } else if (zWord.charAt(0) == '!') {
    var blah = 'shit!';
  }
  var pX = sX
    , pY = sY;
  //check for overlapping words
  var tmpWord = '';
  var crossing = false;
  for (var x = 0; x < zWord.length; x++) {
    if (gameVars.Vars.zArray[pX][pY] != '') {
      tmpWord += gameVars.Vars.zArray[pX][pY].toLowerCase();
      crossing = true;
    } else {
      tmpWord += '*';
    }
    pX += plusX;
    pY += plusY;
  }
  if (crossing) {
    var cWord = RndCrsWrd(tmpWord);
    if (!cWord || (cWord == 0)) {
      //no match found for specified leters in word - choose new one.
      createPuzzle();
      return;
    } else {
      zWord = cWord;
    }
  }
  zWord = zWord.toUpperCase();
  //check whether this chosen word has been chosen before
  for (var x in gameVars.Vars.zWords) {
    if (gameVars.Vars.zWords[x].word == zWord) {
      createPuzzle();
      return;
    }
  }
  var wrds = gameVars.Vars.zWords.length;
  gameVars.Vars.zWords[wrds] = [];
  gameVars.Vars.zWords[wrds].sX = pX = sX;
  gameVars.Vars.zWords[wrds].sY = pY = sY;
  gameVars.Vars.zWords[wrds].word = zWord;
  //add word to grid!
  for (var x = 0; x < zWord.length; x++) {
    if (x > 0) {
      pX += plusX;
      pY += plusY;
    }
    gameVars.Vars.zArray[pX][pY] = zWord.charAt(x)
  }
  gameVars.Vars.zWords[wrds].eX = pX;
  gameVars.Vars.zWords[wrds].eY = pY;
  if (wrds < gameVars.Vars.dims[0] - 1) {
    createPuzzle();
  }
}
function completePuzzle() {
  //use w3schools example for sorting the array
  //from the zwords.word string object
  gameVars.Vars.zWords.sort(function(a, b){
    var x = a.word.toLowerCase();
    var y = b.word.toLowerCase();
    if (x < y) {return -1;}
    if (x > y) {return 1;}
    return 0;
  });


  //put the words on the buttons and rename their ID
  document.getElementById('Cl-0').style.color = '';
  for (var x = 0; x < gameVars.Vars.zWords.length; x++) {
    document.getElementById('Cl-' + x).innerHTML = gameVars.Vars.zWords[x].word;
  }


  //put randon letters in the rest of the grid:
  for (var x = 0; x < gameVars.Vars.dims[1]; x++) {
    for (var y = 0; y < gameVars.Vars.dims[2]; y++) {
      if (gameVars.Vars.zArray[x][y] == '') {
        gameVars.Vars.zArray[x][y] = String.fromCharCode((Math.random() * 26) + 65);
      }
      document.getElementById('_' + x + 'I' + y).innerHTML = gameVars.Vars.zArray[x][y];
      //'<p class="wordSearch_ctr">' + gameVars.Vars.zArray[x][y] + '</p>';
    }
  }

}
function  defineWord(zWord) {
  //create an iFrame with a close button. the bugger is the position of it!
  //maybe put half off the bottom of the iFrame :D
  //clicking off of the iframe also closes it.
  /*
    create 100% cover (transparant)
    create 80% iframe linking to the free dictionary as normal.
    create close button.
    link both the button and the transparant 100% cover to close the cover - with everything else.

    window.open('http://www.thefreedictionary.com/' + zWord.toLowerCase());
    .innerHTML = '<iframe style="border:0;width:100%;height:100%;" ' + 'src="' + allLaunchers[a.allNum].appLocation + '" allowfullscreen></iframe>';
  */
  document.body.innerHTML +=
    '<div id="' + 'defCont" style="position:absolute;z-index:100;width:100%;height:100%;background:rgba(0,0,0,0.33);">'
      + '<iframe style="position:absolute;opacity:1;border:0;width:80%;height:80%;left:10%;top:10%;" ' + 'src="http://www.thefreedictionary.com/' + zWord.toLowerCase() + '"></iframe>'
    + '</div>'
  ;
  //https://dictionary.cambridge.org/dictionary/english/word
  addPointerUp('defCont',
    function() {document.body.removeChild(document.getElementById('defCont'));}
  );
}
function addPointerUp(zId,funky) {
  document.getElementById(zId).addEventListener('mouseup', funky, false);
  document.getElementById(zId).addEventListener('touchend', funky, false);
}
function getGame() {
  if (document.getElementById('Loader')) {
    document.body.removeChild(document.getElementById('Loader'));
  }
  if (document.getElementById('ed')) {
    document.body.removeChild(document.getElementById('ed'));
  }
  createPuzzle();
  gameVars.Vars.AnimNum = 0;
  anim();
}
function mD(WinID, e) {
  var zButton = null == e.which ? e.button : e.which;
  if (zButton == 1) {
    var WinNo = WinID.split('_')[0]; //should always be null now
    WinID = WinID.split('_')[1];
    if (WinID && !gameVars.Vars.selecting) {
      gameVars.Vars.StartCell = gameVars.Vars.CurrCell = WinID;
      gameVars.Vars.selecting = true;
      //Have a selecting div specially for when slecting a word.
      gameVars.Vars.selD.eX = gameVars.Vars.selD.sX = WinID.split('I')[0];
      gameVars.Vars.selD.eY = gameVars.Vars.selD.sY = WinID.split('I')[1];
      gameVars.Vars.selD.Diag = false;
      var sX = Number(gameVars.Vars.StartCell.split('I')[0]);
      var sY = Number(gameVars.Vars.StartCell.split('I')[1]);
      var crcTop = (sY * gameVars.Vars.grdSze) - 1;// + 1;
      var crcLeft = (sX * gameVars.Vars.grdSze);// + (gameVars.Vars.grdSze * .1);
      var crcWidth = gameVars.Vars.grdSze;// * 0.75
      var crcHeight = gameVars.Vars.grdSze;// * 0.75;
      var zDiv = document.getElementById('Slct');
      zDiv.style.opacity = 0.75;
      zDiv.style.left = crcLeft + 'px';
      zDiv.style.top = crcTop + 'px';
      zDiv.style.height = crcHeight + 'px';
      zDiv.style.width = crcWidth + 'px';
    }
  }
}

function mU(WinID, e) {
  var zButton = null == e.which ? e.button : e.which;
  if (zButton == 1) {
    var WinNo = WinID.split('_')[0];//should always be null now
    WinID = WinID.split('_')[1];
    if (WinID && gameVars.Vars.selecting) {
      var EndCell = WinID;
      //.split('I');
      if (gameVars.Vars.StartCell != EndCell) {
        gameVars.Vars.selecting = false;
        //hide the selecting div here
        var zDiv = document.getElementById('Slct');
        //zDiv.style.left=crcLeft+ 'px';
        //zDiv.style.top=crcTop+ 'px';
        zDiv.style.opacity = 0;
        zDiv.style.height = '0px';
        zDiv.style.width = '0px';
        zDiv.style.transform = "rotate(0deg)";
        zDiv.style.transformOrigin = '50% 50%';
        //check start and end coords to start and ends of words.
        var eCell = EndCell.split('I');
        var sCell = gameVars.Vars.StartCell.split('I');
        for (var x = 0; x < gameVars.Vars.zWords.length; x++) {
          if ((gameVars.Vars.zWords[x].sX == sCell[0] && gameVars.Vars.zWords[x].sY == sCell[1] && gameVars.Vars.zWords[x].eX == eCell[0] && gameVars.Vars.zWords[x].eY == eCell[1]) || (gameVars.Vars.zWords[x].sX == eCell[0] && gameVars.Vars.zWords[x].sY == eCell[1] && gameVars.Vars.zWords[x].eX == sCell[0] && gameVars.Vars.zWords[x].eY == sCell[1])) {
            //check that this word hasn't already been found - unlikely a user would redo a found word, but check here.
            for (var y in gameVars.Vars.crrcts) {
              if ((gameVars.Vars.crrcts[y].StartCell == gameVars.Vars.StartCell) && (gameVars.Vars.crrcts[y].EndCell == EndCell)) {
                gameVars.Vars.StartCell = '';
                return;
              }
            }
            document.getElementById('Cl-' + x).classList.add('cluseCrrt');
            /*
            document.getElementById('Cl-' + x).style.textDecoration = "line-through";
            document.getElementById('Cl-' + x).style.background = 'radial-gradient(#CEC, #8F8)';
            document.getElementById('Cl-' + x).style.border = '2px solid #262';
            */
            //create a new div that circles the correctly found word.
            var cNum = gameVars.Vars.crrcts.length;
            gameVars.Vars.crrcts[cNum] = [];
            gameVars.Vars.crrcts[cNum].zWord = x;
            gameVars.Vars.crrcts[cNum].Diag = gameVars.Vars.crrcts[cNum].Virt = false;
            gameVars.Vars.crrcts[cNum].id = 'Crct' + cNum;
            gameVars.Vars.crrcts[cNum].StartCell = gameVars.Vars.StartCell;
            gameVars.Vars.crrcts[cNum].EndCell = EndCell;
            var crcTop = (gameVars.Vars.zWords[x].sY * gameVars.Vars.grdSze) - 1;
            var crcLeft = (gameVars.Vars.zWords[x].sX * gameVars.Vars.grdSze);
            var crcHeight = gameVars.Vars.grdSze;
            var crcWidth = 0;
            var crcTrans = 0;
            if (eCell[1] != sCell[1]) {
              gameVars.Vars.crrcts[cNum].Virt = true;
              crcWidth = document.getElementById('_' + gameVars.Vars.StartCell).offsetTop - document.getElementById('_' + EndCell).offsetTop;
            } else {
              crcWidth = document.getElementById('_' + gameVars.Vars.StartCell).offsetLeft - document.getElementById('_' + EndCell).offsetLeft;
            }
            if (crcWidth < 0) {
              crcWidth = 0 - crcWidth;
            }
            crcWidth += gameVars.Vars.grdSze + 2;
            if (gameVars.Vars.zWords[x].sY < gameVars.Vars.zWords[x].eY) {
              //Down
              if (gameVars.Vars.zWords[x].sX < gameVars.Vars.zWords[x].eX) {
                //Down-Right
                crcTrans = 45;
                crcWidth = crcWidth * Math.sqrt(2);
                gameVars.Vars.crrcts[cNum].Diag = true;
                crcWidth -= (gameVars.Vars.grdSze / 2);
              } else if (gameVars.Vars.zWords[x].sX > gameVars.Vars.zWords[x].eX) {
                //Down-Left
                crcTrans = 135;
                crcWidth = crcWidth * Math.sqrt(2);
                gameVars.Vars.crrcts[cNum].Diag = true;
                crcWidth -= (gameVars.Vars.grdSze / 2);
              } else {
                //Down
                crcTrans = 90;
              }
            } else if (gameVars.Vars.zWords[x].sY > gameVars.Vars.zWords[x].eY) {
              //Up
              if (gameVars.Vars.zWords[x].sX > gameVars.Vars.zWords[x].eX) {
                //Up-Left
                crcTrans = 225;
                crcWidth = crcWidth * Math.sqrt(2);
                gameVars.Vars.crrcts[cNum].Diag = true;
                crcWidth -= (gameVars.Vars.grdSze / 2);
              } else if (gameVars.Vars.zWords[x].sX < gameVars.Vars.zWords[x].eX) {
                //Up-Right
                crcTrans = 315;
                crcWidth = crcWidth * Math.sqrt(2);
                gameVars.Vars.crrcts[cNum].Diag = true;
                crcWidth -= (gameVars.Vars.grdSze / 2);
              } else {
                //Up
                crcTrans = 270;
              }
            } else if (gameVars.Vars.zWords[x].sX > gameVars.Vars.zWords[x].eX) {
              crcTrans = 180;
              //Left
            }
            var pivot = ((gameVars.Vars.grdSze / 2) / crcWidth) * 100;
            crcTrans = 'transform:rotate(' + crcTrans + 'deg);transform-origin:' + pivot + '% 50%;';
            var crctDiv = '<div id="' + gameVars.Vars.crrcts[cNum].id + '" class="wordSearch_Crrct" style="top:' + crcTop + 'px;left:' + crcLeft + 'px;height:' + crcHeight + 'px;width:' + crcWidth + 'px;' + crcTrans + '"></div>';
            document.getElementById('_gridCont').innerHTML += crctDiv;
            var plusX = 0
              , plusY = 0;
            if (gameVars.Vars.zWords[x].sX < gameVars.Vars.zWords[x].eX) {
              plusX = 1;
            } else if (gameVars.Vars.zWords[x].sX > gameVars.Vars.zWords[x].eX) {
              plusX = -1;
            }
            if (gameVars.Vars.zWords[x].sY < gameVars.Vars.zWords[x].eY) {
              plusY = 1;
            } else if (gameVars.Vars.zWords[x].sY > gameVars.Vars.zWords[x].eY) {
              plusY = -1;
            }
            var pX = gameVars.Vars.zWords[x].sX
              , pY = gameVars.Vars.zWords[x].sY;
            for (var y = 0; y < gameVars.Vars.zWords[x].word.length; y++) {
              pX += plusX;
              pY += plusY;
            }
          }
        }
        if (gameVars.Vars.crrcts.length == gameVars.Vars.zWords.length) {
          uWon();
        }
        gameVars.Vars.StartCell = '';
      }
    }
  }
}

function wordSearch_Options() {
  var zText = '';
  /*
    Create the drop-down options for the
    amount of words to find, and the size
    of the grid.

    I'll have to make it so there aren't
    silly combos!
  */
  zText += '<span>Words: </span>'
  + wordSearch_menuCreate('0');
  zText += '&nbsp;<span>Width: </span>'
  + wordSearch_menuCreate('1'),
  zText += '&nbsp;<span>Height: </span>'
  + wordSearch_menuCreate('2')

  //Now that the options are created, send them.
  return zText;
}

function wordSearch_menuCreate(toCreate) {
  //var extraStuff = 'style="background:#333;color:#dfdbd2;" onmouseup="{event.preventDefault();event.stopPropagation();}"';
  var zCombo = '<select id="' + 'WSOption_' + toCreate + '" class="editEnable">';
  var blaf = gameVars.Vars.dims[toCreate];
  for (var x = 8; x <= 32; x++) {
    if (x == blaf) {
      zCombo += '<option class="editEnable" selected>' + x + '</option>';
    } else {
      zCombo += '<option class="editEnable" >' + x + '</option>';
    }
  }
  zCombo += '</select>';
  return zCombo;
}
function wordSearch_menuSelect() {
  //change the apply button from disabled to green if it isn't already
  document.getElementById('gameChange').classList.add('uButtonGreen');
  document.getElementById('gameChange').classList.remove('uButtonDisabled');
}
function changeGameSize() {
  if (!document.getElementById('gameChange').classList.contains('uButtonGreen')) {
    return;
  }
  //reset the arrays and stuff:
  var tmpGrzSize = gameVars.Vars.grdSze;

  gameVars.Vars = {
    zArray: [],
    zWords: [],
    crrcts: [],
    selecting: false,
    StartCell: '',
    f0und: 0,
    grdSze: tmpGrzSize,
    dims: [
        parseInt(document.getElementById('WSOption_0').value, 10)
      , parseInt(document.getElementById('WSOption_1').value, 10)
      , parseInt(document.getElementById('WSOption_2').value, 10)
    ],
    selD: []
  };

  //remove the entire grid
  document.getElementById('_gridCont').innerHTML = '';
  document.getElementById('_clue').innerHTML = '';
  //initialize the mouse event
  mouseClear();
  //initialize the scroll vars
  scrollClear();
  //close the settings menuString
  settingsClose();
  //redraw the grid with the new values
  init2();
}
function redraw() {

  //---dynamically resize the stuff to fit the new size
  var grid = document.getElementById('_0I0');
  var Clue = document.getElementById('_clue');
  var GrdCont = document.getElementById('_gridCont');
  //make the height 100% - just over sze of fs and st buttons.
  Clue.style.height =
    (GrdCont.offsetHeight - document.getElementById('fs').offsetHeight - 4) + 'px';
  //fix the width to the longest possible word
  Clue.style.width = Clue.offsetWidth + 'px';

  document.body.style.width =
  GrdCont.offsetWidth + Clue.offsetWidth
  + 8 + 'px'; //+8 for 4 lots of 2px borders.
  document.body.style.height = GrdCont.offsetHeight + 'px';

  initScreenWidth = document.body.offsetWidth;
  initScreenHeight = document.body.offsetHeight;
  //hopefully this new transform scaling will work!
  reScale();

}
function reset() {
  var zBox = document.body;
  var zGrid = '';
  for (var x = 0; x < gameVars.Vars.dims[1]; x++) {
    gameVars.Vars.zArray[x] = [];
    for (var y = 0; y < gameVars.Vars.dims[2]; y++) {
      gameVars.Vars.zArray[x][y] = '';
      document.getElementById('_' + x + 'I' + y).innerHTML = '';
    }
  }

  //create an array of al elements with chass: cluseCrrt
  var zCluseCrrt = document.getElementsByClassName('cluseCrrt');
  //remove the class cluseCrrt from each element.
  while(zCluseCrrt.length > 0){
    zCluseCrrt[0].innerHTML= '&nbsp;';
    zCluseCrrt[0].classList.remove('cluseCrrt');
  }

  var crrctDivs = zBox.getElementsByClassName('wordSearch_Crrct');
  if (crrctDivs.length == 0) {
    crrctDivs = zBox.getElementsByClassName('wordSearch_Crrctend');
  }
  if (crrctDivs.length > 0) {
    var zAm = crrctDivs.length;
    for (var x = 0; x < zAm; x++) {
      zBox.removeChild(crrctDivs[0]);
    }
  }

  gameVars.Vars.crrcts = [];
  gameVars.Vars.zWords = [];
  getGame();
  redraw();
}
function RndCrsWrd(tmpWord) {
  var zList = 'WL' + tmpWord.length;
  var dList = window[zList];
  //link warning. does it matter?
  var wrdList = [];
  //hold any matching words
  var ltf = [];
  var Num = 0;
  while (Num < tmpWord.length) {
    var nextChar = tmpWord.slice(Num, tmpWord.length).search(/\w/);
    if (nextChar == -1) {
      Num = tmpWord.length;
    } else {
      ltf[ltf.length] = nextChar + Num;
      Num += nextChar;
    }
    Num++;
  }
  //now that all crossing letters have been enumerated, begin looking for matching words:
  for (var x = 0; x < dList.length; x++) {
    //cycle through word list
    var ta = dList[x].charAt(ltf[0]);
    var tb = tmpWord.charAt(ltf[0]);
    if (dList[x].charAt(ltf[0]) == tmpWord.charAt(ltf[0])) {
      var itMatches = true;
      for (var y = 0; y < ltf.length; y++) {
        if (dList[x].charAt(ltf[y]) != tmpWord.charAt(ltf[y])) {
          itMatches = false;
        }
      }
      if (itMatches) {
        wrdList.push(dList[x]);
      }
    }
  }
  var theWord;
  if (wrdList.length > 0)
    theWord = wrdList[Math.floor(Math.random() * wrdList.length)];
  return theWord;
}
function rndWrd(wrdSize) {
  var tmpWord, tmpDesc, tmpNum;
  tmpNum = Math.floor((Math.random() * (window['WL' + wrdSize].length - 1)));
  tmpWord = window['WL' + wrdSize][tmpNum];
  return tmpWord;
}
function uWon() {
  var crrctDivs = document.getElementById('_gridCont').getElementsByClassName('wordSearch_Crrct');
  if (crrctDivs.length > 0) {
    var zAm = crrctDivs.length;
    for (var x = 0; x < zAm; x++) {
      crrctDivs[0].className += 'wordSearch_Crrctend';
    }
  }

  //put up a dialogue saying congratulations and ask user for either new game or quit.
  document.body.innerHTML +=
    '<div id="ed" class="endDlg">'
    + '<div id="edC" class="endDlgInner">'
      + 'Congratulations<br>You Won!'
      + '<div id="NG" class="uButtons uButtonGreen NG">'
        + 'New Game'
      +  '</div>'
    + '</div>'
  + '</div>';

  window.setTimeout(function() {
    document.getElementById('edC').style.top = '50%';
    document.getElementById('edC').style.opacity = '1';
  }, 50);
}

function reScale() {
  if (!initScreenWidth) {
    return;
  }
  //use this instead of resize() for making the app cneter and fill the available screen space.
  //collect the difference
  var xScale = window.innerWidth / initScreenWidth
    , yScale = window.innerHeight / initScreenHeight
  ;

  var zScale = (xScale <= yScale) ? xScale : yScale;
  var tScale = 50 / zScale;
  document.body.style.transform =
    'scale(' + zScale + ')'
  + ' translate(-' + tScale + '%,-' + tScale + '%)';

}






/*
  from globalScript projects as they are the most
  up to date input and events.
  Plan for this is to have it all in one file...
  including perhaps the wordlist too.

  is there an upper limit on filesize for a
  javascript file?
*/

function addEventListeners() {
  window.addEventListener('resize', reScale, false);
  window.addEventListener('contextmenu', bubbleStop, false);
  window.addEventListener('dblclick', bubbleStop, false);
  window.addEventListener(mouseWheelType, mouseWheel, false);
  window.addEventListener('touchstart', touchDown, false);
  window.addEventListener('touchmove', touchMove, false);
  window.addEventListener('touchcancel', touchUp, false);
  window.addEventListener('touchend', touchUp, false);
  window.addEventListener('touchleave', touchUp, false);
  window.addEventListener('mousedown', mouseDown, false);
  window.addEventListener('mousemove', mouseMove, false);
  window.addEventListener('mouseup', mouseUp, false);
  window.addEventListener('keydown', keyDown, false);
  window.addEventListener('keyup', keyUp, false);
}

//the globalScript input file:
/*
 * Ideally, I would have only two different tpes of input;
 * pointer (for touch and mouse)
 * gamepad for gamepads, and keybnoards
 *
 * having said that, I could make the mouse into a 3-button, 1 axis gamepad, and touches similar, but more axis and buttons.
 * and gamepads and keyboards could be used to move a pointer around too.
 *
 * Sensetivity should be adjustable, and axes and buttons would be configurable
*/
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
  //use animationFrame:
  window.requestAnimationFrame(function() {
    gamePadsButtonEventCheck();
  });
}
function keyNum(e) {
  return e.keyCode || window.event.keyCode;
}
function keyDown(e) {
  var theKey = keyNum(e);
  if (!document.activeElement.classList.contains('editEnable')) {
    if (keysIgnore.indexOf(theKey) === -1) {
      bubbleStop(e);
      //simply add the newly pressed key into the WinKeys array.
      keyVars.push(theKey);
      keyDownGameEvents(theKey);
      anEvent();
    }
  }
  else {
    //if user presses Return or Tab, remove input focus.
    if (theKey == 13 || theKey == 9) {
      bubbleStop(e);
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
  mouseVars.current.target  = targ;
  mouseVars.current.time = new Date().getTime();
  mouseVars.current.x = e.clientX;
  mouseVars.current.y = e.clientY;
  mouseVars.start.target = targ;
  mouseVars.start.time = new Date().getTime();
  mouseVars.start.x = e.clientX;
  mouseVars.start.y = e.clientY;

  if (targ.classList.contains('editEnable')) {
    return;
  }

  bubbleStop(e);
  //mouse down events can go here, or point to another function

  //look for sliders here:
  var targSplit = targ.id.split('-');
  if (targ.id !== 'sli-pan-I') {
    if (targSplit[0] === 'sli') {
      //change the mouseType to slider.
      mouseVars.type = 'sli';
      //change the target to the slider's button
      mouseVars.start.target = document.getElementById('sli-' + targSplit[1] + '-I');
      //call the sliderMove function to begin moving the slider.
      sliderMoveH();
    }
  }

  mD(targ.id, e)
  anEvent();
}
function mouseMove(e) {
  //make sure that only one mouse movement is done per frame to reduce cpu usage.
  if (mouseVars.moved) {
    return;
  }
  mouseVars.moved = 1;
  window.requestAnimationFrame(function() {
    mouseVars.moved = 0;
  });

  var zTime = new Date().getTime();

  var targ = findTarget(e);

  //if (mouseVars.current.target) {
  if (targ) {
    //if (mouseVars.current.target.classList.contains('editEnable')) {
    if (targ.classList.contains('editEnable')) {
      mouseVars.current = {target:targ, time:zTime, x:e.clientX, y:e.clientY};
      return;
    }
  }

  bubbleStop(e);
  //check for onmouseout/onmousein events!
  if (mouseVars.current.target !== targ) {
    if (mouseVars.type === 'click') {
      mouseVars.type = 'drag';
      window.clearTimeout(mouseVars.clickTimer);
    }
    mouseMoveEnter(targ, e);
    if (mouseVars.current.target) {
      mouseMoveOut(mouseVars.current.target, e);
    }
  }
  //now onmouseover - this one is done always.
  mouseMoveOver(targ, e);
  //scroll the about/changelogs type dialogues
  if (mouseVars.type === 'scrollable' && (e.clientY != mouseVars.current.y)) {
    var framesPerSecond = (1000 / (scrollVars.time - mouseVars.current.time));
    var pixlesMoved = (mouseVars.current.y - scrollVars.y);
    var speedInPixelsPerSecond = pixlesMoved * framesPerSecond;

    //console.log(speedInPixelsPerSecond);
    if (pixlesMoved) {
      scroller(mouseVars.start.target, findCloseButton(mouseVars.start.target), pixlesMoved);
    }

    scrollVars.time = mouseVars.current.time;
    scrollVars.x = mouseVars.current.x;
    scrollVars.y = mouseVars.current.y;
  }

  mouseVars.current = {target:targ, time:zTime, x:e.clientX, y:e.clientY};

  if (mouseVars.type === 'sli') {
    sliderMoveH();
    //volMove();
  } else if (mouseVars.type === 'click') {
    if (((mouseVars.start.x + 25) < e.clientX) || ((mouseVars.start.x - 25) > e.clientX) || ((mouseVars.start.y + 25) < e.clientY) || ((mouseVars.start.y - 25) > e.clientY)) {
      window.clearTimeout(mouseVars.clickTimer);
    //debugger;
      if (mouseVars.start.target.id === 'sli-pan-I') {
        //change the mouseType to slider.
        mouseVars.type = 'sli';
        //call the sliderMove function to begin moving the slider.
        sliderMoveH();
      }
      else {
        mouseVars.type = 'drag';
      }
    }
  }

  if (mouseVars.type === 'drag' && mouseVars.start.target) {
    if (mouseVars.start.target.classList.contains('letScroll')) {
      mouseVars.type = 'scrollable';
      //there is currently only one scrolling element at the moment.
      mouseVars.start.target = findUpperScrollable(mouseVars.start.target);
      scrollVars.time = mouseVars.current.time;
      scrollVars.x = mouseVars.current.x;
      scrollVars.y = mouseVars.current.y;
    }
  }
}

function mouseUp(e) {
  if (mouseVars.current.target === null) {
    /*
      Seems to only affect touch!
      This can happen with dynamically created elements
      such as option elements in select elements
      (drop-down menus)
      should I then create my own drop-down menu based
      on my menu code in the webtop?
    */
    return;
  }
  if (mouseVars.current.target.classList.contains('editEnable')) {
    mouseClear();
    scrollClear();
    return;
  }
  //if the pointer is not on an input, take the focus off of
  //the focused element. This should remove focus from input elements
  //when the user clicks off of them.
  document.activeElement.blur();

  bubbleStop(e);
  
  mU(mouseVars.current.target.id, e)

  //do any mouseup stuff here, eg. flinging or animated panning
  if (mouseVars.type == 'click') {
    if (mouseVars.button == 1) {
      mouseClick();
    } else if (mouseVars.button == 2) {
      mouseLongClick();
    }
  }

  if (mouseVars.button == 1) {
    if (mouseVars.type == 'scrollable' || mouseVars.type === 'scrolling') {
      //console.log('begin auto scroll...');
      var tNow = new Date().getTime();
      var framesPerSecond = (1000 / (scrollVars.time - mouseVars.current.time));
      var pixlesMoved = (mouseVars.current.y - scrollVars.y);
      var speedInPixelsPerSecond = pixlesMoved * framesPerSecond;
      //console.log(speedInPixelsPerSecond);

      if (pixlesMoved) {
        scroller(mouseVars.start.target, findCloseButton(mouseVars.start.target), pixlesMoved);
      }
      //speed should now be pixels per second, averaged over the last 5 frames.
      //console.log('average speed = ' + zSpeed);
      //mouseVars.start.target gets cleared, so make a seperate pointer.
      var targ = document.getElementById(mouseVars.start.target.id);
      var zCloseButton = findCloseButton(targ);
      window.requestAnimationFrame(function() {
        divScroller(targ, zCloseButton, -speedInPixelsPerSecond, tNow)
      });
    }
  }

  mouseClear();
  anEvent();
}
function mouseWheel(e) {//for zooming in/out, changing speed, etc.
  var targ = findTarget(e);

  bubbleStop(e);

  var delta;
  if (e.deltaY) {
    delta = -e.deltaY;
    //seems like the main one
  } else if ('wheelDelta'in e) {
    delta = e.wheelDelta;
  } else {
    delta = -40 * e.detail;
    //fallback!
  }
  if (delta > 0) {
    delta = 1;
  } else {
    delta = -1;
  }

  if (targ.classList.contains('letScroll')) {
    targ = findUpperScrollable(targ);
    var zCloseButton = findCloseButton(targ);

    //debugger;
    divScroller(targ, zCloseButton, delta*1000, new Date().getTime());
  }
  else {
    mouseWheelEvents(targ, delta);
  }

}

function mouseClick() {
  var targID = mouseVars.current.target.id;
  if (targID === 'setsOpen') {
    settingsOpen();
  } else if (targID === 'setsClose') {
    settingsClose();
  } else if (targID === 'gameChange') {
    changeGameSize();
  } else if (targID === 'fs') {//fullscreen button
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
    button: 1,
    target: e.target,
    id: e.identifier,
    clientX: e.clientX,
    clientY: e.clientY,
    preventDefault: function() {},
    stopPropagation: function() {}
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
          bubbleStop(e);
          //mouseMove(touchVars[zID]);
        }
        mouseDown(touchVars[zID]);
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
      touchVars.splice(zID, 1, touchChange(cTouches[x]));
      // swap in the new touch record
    }

    //only do the mouse events on the first finger.
    if (zID == 0) {
      if (!touchVars[zID].target.classList.contains('editEnable')) {
        bubbleStop(e);
      }
      mouseMove(touchVars[zID]);
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
      }

      if (zID == 0) {
        if (!touchVars[zID].target.classList.contains('editEnable')) {
          bubbleStop(e);
        }
        mouseUp(touchVars[zID]);
      } else {
        bubbleStop(e);
      }

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
}
function mouseClickEvents() {
  if (mouseVars.current.target.id === 'NG') {
    //add event to tell when the css transition has finished
    document.getElementById('edC').addEventListener('transitionend', reset, false);
    document.getElementById('edC').style.top = '175%';
    document.getElementById('edC').style.opacity = '0';
  }
  else if (mouseVars.current.target.id.slice(0,2) === 'Cl') {
    var x = mouseVars.current.target.id.split('-')[1];
    defineWord(gameVars.Vars.zWords[x].word);
  }
  else if (mouseVars.current.target.id.slice(0,8) === 'WSOption') {
    var x = mouseVars.current.target.id.split('_')[1];
    defineWord(gameVars.Vars.zWords[x].word);
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

  //highlight where the mouse pointer is
  //so i can figure out how to follow
  //it around while scaled.
  //targ.style.background = 'green';


  var WinID = targ.id.split('_')[1];
  //new bit because touches doesn't return the element that the finger is currently over! - it remains the original element.
  //so, I must figure out which element the finger is over, by the coordinates of the finger, relative to the grid.
  //might need to use similar code for mouseUp as well, if the element doesn't change for that either.

  if (WinID && gameVars.Vars.selecting) {
    gameVars.Vars.CurrCell = WinID;
    var sX = Number(gameVars.Vars.StartCell.split('I')[0]);
    var sY = Number(gameVars.Vars.StartCell.split('I')[1]);
    var eX = Number(WinID.split('I')[0]);
    var eY = Number(WinID.split('I')[1]);
    var crcTop = (sY * gameVars.Vars.grdSze) - 1;
    var crcLeft = (sX * gameVars.Vars.grdSze);
    var crcWidth = 0
      , crcTrans = -1;
    gameVars.Vars.selD.Virt = gameVars.Vars.selD.Diag = false;
    if (sY != eY) {
      gameVars.Vars.selD.Virt = true;
      crcWidth = document.getElementById('_' + gameVars.Vars.StartCell).offsetTop - document.getElementById('_' + WinID).offsetTop;
    } else {
      crcWidth = document.getElementById('_' + gameVars.Vars.StartCell).offsetLeft - document.getElementById('_' + WinID).offsetLeft;
    }
    if (crcWidth < 0) {
      crcWidth = 0 - crcWidth;
    }
    crcWidth += gameVars.Vars.grdSze + 2;
    var xCheck = (eX - sX);
    var yCheck = (eY - sY);
    if (xCheck < 0) {
      xCheck = 0 - xCheck;
    }
    if (yCheck < 0) {
      yCheck = 0 - yCheck;
    }
    if (sY < eY) {
      //down
      if (sX < eX && xCheck == yCheck) {
        //down-right
        crcTrans = 45;
        gameVars.Vars.selD.Diag = true;
      } else if (sX > eX && xCheck == yCheck) {
        //down-left
        crcTrans = 135;
        gameVars.Vars.selD.Diag = true;
      } else if (xCheck == 0) {
        //down
        crcTrans = 90;
      }
    } else if (sY > eY) {
      //up
      if (sX < eX && xCheck == yCheck) {
        //up-right
        crcTrans = 315;
        gameVars.Vars.selD.Diag = true;
      } else if (sX > eX && xCheck == yCheck) {
        //up-left
        crcTrans = 225;
        gameVars.Vars.selD.Diag = true;
      } else if (xCheck == 0) {
        //up
        crcTrans = 270;
      }
    } else if (sX < eX && yCheck == 0) {
      //right
      crcTrans = 0;
    } else if (sX > eX && yCheck == 0) {
      //left
      crcTrans = 180;
    }
    if (crcTrans != -1) {
      if (gameVars.Vars.selD.Diag) {
        crcWidth = crcWidth * Math.sqrt(2);
        crcWidth -= (gameVars.Vars.grdSze / 2);
      }
      var pivot = ((gameVars.Vars.grdSze / 2) / crcWidth) * 100;
      // hmm is this 1%?
      var zDiv = document.getElementById('Slct');
      zDiv.style.left = crcLeft + 'px';
      zDiv.style.top = crcTop + 'px';
      zDiv.style.width = crcWidth + 'px';
      zDiv.style.transform = "rotate(" + crcTrans + "deg)";
      zDiv.style.transformOrigin = pivot + '% 50%';
    }
  }

}
function mouseMoveOut(lastTarg, e) {
  /*
   * opposite of enter...
   * eg. unhighlight something as the mouse moves off of it.
   * 
  */
  //lastTarg.style.background = '';
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
}
function gamePadsButtonUp(zButton) {
  //custom gamepad button down events for your app go here
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






//the gevents file
function bubbleStop(e) {
  if (e.cancelable) {
    e.preventDefault();//stop browser doing it's default action.
    e.stopPropagation(); //stop the event bubbling
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

function findCloseButton(targ) {
  //if there is a close button, make sure it stays on-screen.
  var zElemChildList = targ.children;
  var zCloseButton = 0;
  for (var zChilds = 0; zChilds < zElemChildList.length; zChilds++) {
    if (zElemChildList[zChilds].id.toLowerCase().indexOf('close') != -1) {
      zCloseButton = zElemChildList[zChilds];
      break; //only ever have "close" on the close button!
    }
  }
  return zCloseButton;
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

function resizeCheckOrientation() {
    var a
  , b
  , portraitLayout;

  if (window.innerWidth > window.innerHeight) {
    a = window.innerHeight;
    b = window.innerWidth;
    portraitLayout = 0;
  }
  else {
    a = window.innerWidth;
    b = window.innerHeight;
    portraitLayout = 1;
  }

  return [a,b,portraitLayout];
}

function scroller(targ, zCloseButton, toScrollBy) {
  //console.log(toScrollBy);
  var stopNow = 0;
  var zTop = (targ.offsetTop + toScrollBy);
  var tcTop = targ.parentNode.offsetTop;
  var longest = targ.parentNode.offsetHeight - (targ.clientHeight + tcTop);//don't include border on targ.

  if (longest > zTop) {
    zTop = longest;
    stopNow = 1;
  }
  else if (zTop > 0) {
    zTop = 0;
    stopNow = 1;

  }
  targ.style.top = zTop + 'px';


  if (zCloseButton) {
    //check first in case browser blindly sets each time
    if (zTop < -tcTop) {
      if (zCloseButton.style.position != 'fixed') {
        zCloseButton.style.position = 'fixed';
      }
    }
    else if (zCloseButton.style.position != 'absolute') {
      zCloseButton.style.position = 'absolute';
    }
  }

  return stopNow;
}
function divScroller(targ, zCloseButton, zSpeed, zTime) {
  if (!targ || mouseVars.button) {
    //if the element no longer exists, there is nothing to do.
    return;
  }
  var tNow = new Date().getTime();
  var tDiff = (tNow - zTime) / 1000;
  var newSpeed = zSpeed;
  var toScrollBy = (zSpeed * tDiff);
  if ((tDiff > 0) && (zSpeed != 0) && (toScrollBy < 1 && toScrollBy > -1)) {
    //scroll speed is too slow. Just stop the scrolling animation.
    return;
  }

  if (toScrollBy > 1 || toScrollBy < -1) {
    if (scroller(targ, zCloseButton, toScrollBy)) {
      /*
        when hitting the top or bottom of the scroll,
        stop it scrolling any more.
      */
      newSpeed = 0;
    }
  }

  //now to calculate the next frame's scroll amount:
  if (tDiff) {
    /*
      NOTE:
      I've tried lots of different varients, but the scrolling up always takes longer than scrolling down
      I've given up tring to understand that, and just reversing the speed to compensate
      I am now just taking off a little more for scrolling up.
      Hopefully, that will prove about right no matter what browser is used!
    */
    if (newSpeed < 0) {
      newSpeed *= .925;
    } else {
      newSpeed *= .95;
    }
    //check for whether the newSpeed is going in the opposite direction
    if ((zSpeed > 0 && newSpeed < 0) || (zSpeed < 0 && newSpeed > 0)) {
      newSpeed = 0;
    }
  }
  //debugger;
  if (newSpeed) {
    window.requestAnimationFrame(function() {
      divScroller(targ, zCloseButton, newSpeed, tNow)
    });
  }
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


//Global slider stuff - should really be in their own file I think

function sliderMoveH() {
  //find the percentage of the the slider's left
  var zWidth = mouseVars.start.target.parentNode.offsetWidth;
  var zLeft = mouseVars.start.target.parentNode.offsetLeft + document.getElementById('settCont').offsetLeft;
  var sliderLeft = mouseVars.current.x - zLeft + 2;
  sliderLeft -= (mouseVars.start.target.offsetWidth / 2);
  var sliderPercent = [(sliderLeft / (zWidth - mouseVars.start.target.offsetWidth)) * 100];
  if (sliderPercent[0] < 0) {
    sliderPercent[0] = 0;
  } else if (sliderPercent[0] > 100) {
    sliderPercent[0] = 100;
  }
  //if this is a 2D slider, then add the perCent of that now:
  if (mouseVars.start.target.id.split('-')[1] === 'pan') {
    sliderPercent.push(sliderMoveV());
  }
  sliderUpdate(sliderPercent, 1);
}

function sliderMoveV() {
  //find the percentage of the the slider's left
  var zHeight = mouseVars.start.target.parentNode.offsetHeight;
  var zTop = mouseVars.start.target.parentNode.offsetTop + document.getElementById('cont').offsetTop;
  var sliderTop = mouseVars.current.y - zTop + 2;
  sliderTop -= (mouseVars.start.target.offsetHeight / 2);
  var sliderPercent = (sliderTop / (zHeight - mouseVars.start.target.offsetHeight)) * 100;
  if (sliderPercent < 0) {
    sliderPercent = 0;
  } else if (sliderPercent > 100) {
    sliderPercent = 100;
  }
  return sliderPercent;
}
function sliderUpdate(sliderPercent, sve) {
  //recalculate to offset width of the slider iteself
  var zDiff = (mouseVars.start.target.parentNode.offsetWidth - mouseVars.start.target.offsetWidth) / mouseVars.start.target.parentNode.offsetWidth;
  mouseVars.start.target.style.left = Math.round(sliderPercent[0] * zDiff) + '%';

  if (sliderPercent.length === 2) {
    zDiff = (mouseVars.start.target.parentNode.offsetHeight - mouseVars.start.target.offsetHeight) / mouseVars.start.target.parentNode.offsetHeight;
    mouseVars.start.target.style.top = Math.round(sliderPercent[1] * zDiff) + '%';
  } else { //only color the slider button for 1D sliders.
    sliderColors(sliderPercent);
  }
}
function sliderColors(sliderPercent) {
  //change the color of the slider
  var zNum = Math.round(2.4 * (100 - sliderPercent[0]));
  var zBack = 'radial-gradient(farthest-side at 33% 33% , hsl(' + zNum +
  ',100%,90%), hsl(' + zNum + ',100%,55%), hsl(' + zNum + ',100%,33%))';

  mouseVars.start.target.style.background = zBack;
}

function settingsOpen() {
  /*
    use the button, expanding it to almost fill
    the screen, with a nice cross button at
    top-right, and the settings scrollable...
  */
  document.getElementById('setsOpen').style.visibility = 'hidden';

  var zSets = document.getElementById('sets');
  //to animate, it have to have values:
  settingsDimentions.width = zSets.offsetWidth + 'px';
  settingsDimentions.height = zSets.offsetHeight + 'px';
  settingsDimentions.left = zSets.offsetLeft + 'px';
  settingsDimentions.top = zSets.offsetTop + 'px';

  moveSettingsWindow(zSets);

  zSets.classList.remove('fsButton');
  zSets.classList.add('sets');

  //make it's width as it would be when opened so that it is rendered now.
  document.getElementById('settInner').style.width = window.innerWidth + 'px';
  
  window.setTimeout(function() {
    zSets.style.left = '0%';
    zSets.style.top = '0%';
    zSets.style.width = '100%';
    zSets.style.height = '100%';
  }, 25);

  window.setTimeout(function() {
    document.getElementById('settInner').style.width = '';
    document.getElementById('settInner').style.visibility = 'visible';
    upSetClass(zSets);
  }, 500);

}

function settingsClose() {
  var zSets = document.getElementById('sets');

  moveSettingsWindow(zSets);
  document.getElementById('settInner').style.visibility = 'hidden';

  window.setTimeout(function() {
    zSets.style.top = '';
    zSets.style.left = '';
    zSets.style.width = '';
    zSets.style.height = '';
    zSets.classList.remove('sets');
    zSets.classList.add('fsButton');
    document.getElementById('setsOpen').style.visibility = 'visible';
  }, 400);

}

function moveSettingsWindow(zSets) {
  zSets.style.left = settingsDimentions.left;
  zSets.style.top = settingsDimentions.top;
  zSets.style.width = settingsDimentions.width;
  zSets.style.height = settingsDimentions.height;
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









var imgDummy = ' src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAAApJREFUCNdjAAIAAAQAASDSLW8AAAAASUVORK5CYII="'
, gs = 'https://stewved.github.io/globalscripts/'//for general stuff, like images and scripts
, imgSocs = 'style="background:center/contain no-repeat url(\'' + gs + 'images/'

, appAbout =
  '<hr style=clear:both>'
  + '<img alt="The Author" src="' + gs + 'images/StewVed.jpg" style="'
  + 'float:left;border-radius:0.7em;width:6em;margin:0 .5em .5em 0;">'
  + '<p style="text-align:justify;">'
    + 'Stewart Robinson (StewVed) is creating useful, fun, and educational '
    + 'web (HTML5) applications that are Free to use through your support.'
  + '</p>'

, supportStewved =
  '<h2 class=B style=margin-bottom:.2em;font-size:1.25em>Free apps with your support!</h2>'
  + '<hr>'
  + '<div id=BraveBAT>'
  + '<a href="https://brave.com/ste944">'
  + '<img src="' + gs + 'images/brave-bat-partnership.svg" alt="Brave Browser & BAT" width="75%">'
  + '</a>'
  + '<p>Support me for <q>free</q> using BAT '
  + '<p id="BATp">Brave is a Chromium-based (think google chrome) browser that blocks adverts for you, so you have an uncluttered browsing experience.<br><br>'
  + 'The browser then gives BAT to websites that you have visited, depending on how long you\'ve stayed and how many times you have visited.</p>'
  + '<p>You can also <q>tip</q> a website (like this one!) my clicking on the BAT '
  + '<img id="BAT" src="' + gs + 'images/logo-full-color.svg" alt="Basic Attention Token" style="height:0.9em;">'
  + ' icon by the address bar.'
  + '</p>'
  + '<p>'
  + 'Download the Brave browser here:<br>'
  + '<a href="https://brave.com/ste944">'
  + '<img src="' + gs + 'images/brave-logotype-dark.svg" alt="Download Brave Browser" width="50%">'
  + '</a>'
  + '<br>'
  + 'This includes my referrer code to let Brave know that I sent you, and they give me some BAT for you just using the Brave browser <q>minimally</q> for at least 30 days.<br><span style="font-weight:bold;">Thank you!</span>'
  + '</p>'
  + '</div>'
  + '<hr>'
  + '<div id=donations>'
  + '<h2 class=B style=margin-bottom:.2em;font-size:1.25em>Support StewVed through PayPal:</h2>'
    //PayPal Donate Button (modded)
  + '<form class="tipButton uButtonGrey" action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">' + '<input type="hidden" name="cmd" value="_s-xclick">' + '<input type="hidden" name="hosted_button_id" value="RJMCJX2TE8E4Y">'
    + '<input type="image" class="imgSocs ubLink" ' + imgSocs + 'PaypalDonate.png\');height:100%;width:100%;display:block;cursor: pointer;" ' + imgDummy + ' name="submit" alt="PayPal – The safer, easier way to pay online.">'
  + '</form>'
  + '</div>'
  + '<br>'

, appBugs =
  '<hr style=clear:both>'
  + '<h1 style=margin-bottom:.2em;font-size:1.25em>'
    + 'StewVed\'s standard notice:'
  + '</h1>'
  + '<p style=text-align:center;color:red;margin-top:0;line-height:1.5em;>'
    + 'Warning: May contain Bugs!<br>'
    + 'Cannot guarantee Bug free!<br>'
    + 'Produced on a system where Buggy products are also made!'
  + '</p>'

, appCP =
  '<h2 style=text-align:center>Copyright&nbsp;&copy;&nbsp;'
  + '2023 Created by Stewart Robinson (StewVed)</h2>'
;
