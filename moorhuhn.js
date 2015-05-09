/*

CreateJS object stage z-coordinates for displaying the elements in order to be visible:

0 - greyish canvas filling
1 - background image
2 - text with game time
3 - scoreboard
4 - moorhuhn

others in order of appending:

- target aim image
- dark haze covering the canvas after the game ends
- game over text

*/
var moorhuhn = SAGE2_App.extend({

	construct: function() {
		// call super-class 'construct' and set the window resize type
		arguments.callee.superClass.construct.call(this);
		this.resizeEvents = 'onfinish';
		
		// construct stage
		this.areaWidth    = null;
		this.areaHeight   = null;
		this.context      = null;
		this.queue        = null;
		this.stage        = null;
		this.soundEnabled = null;

		// construct graphics
		this.fill            = null;
		this.backgroundImage = null;
		this.background      = null;
		this.targetImage     = null;
		this.target          = null;
		this.targetEnabled   = null;

		// construct the bird
		this.moorhuhnXPos  = null;
		this.moorhuhnYPos  = null;
		this.moorhuhnSpeed = null;
		this.moorhuhnScale = null;
		this.moorhuhn      = {};

		// construct the time related vars
		this.timerText       = null;
		this.initialGameTime = null;
		this.gameTime        = null;
		this.gameTimer       = null;
		this.gameOverText    = null;
		this.gameOverHaze    = null;

		// construct the player-related variables
		this.players    = [];
		this.scoreboard = null;
		this.shotHit    = null;
		this.shotMissed = null;
		this.fontStyle  = null;

		// construct the chicken spawning parameters
		this.minSpawnTime   = null;
		this.maxSpawnTime   = null;
		this.minSpawnCoordY = null;
		this.maxSpawnCoordY = null;
		this.minSpawnScale  = null;
		this.maxSpawnScale  = null;


		console.log('Moorhuhn object construction completed');
	},
	
	init: function(data) {
		// call super-class 'init'
		arguments.callee.superClass.init.call(this, 'canvas', data);
		
		// application specific 'init'
		this.areaWidth  = data.width;
		this.areaHeight = data.height;
		console.log('Area width: ' + this.areaWidth + ' and height: ' + this.areaHeight);

		// get graphic context and create the stage using our own canvas element
		this.context               = this.element.getContext('2d');
	    this.context.canvas.width  = this.areaWidth;
	    this.context.canvas.height = this.areaHeight;
	    this.stage                 = new createjs.Stage(this.element);

	    // create the fill behind the background
	    this.fill = new createjs.Shape();
	    this.fill.graphics.beginFill('#B6B6B4').drawRect(0, 0, this.areaWidth, this.areaHeight);
	    this.stage.addChildAt(this.fill, 0);

	    // set these two to true if the game should include all the sounds and music or a target
	    this.soundEnabled  = false;
	    this.targetEnabled = false;

		// default style of all the in-game strings
	    var fontSize   = this.areaWidth / 35;
	    this.fontStyle = 'italic ' + fontSize.toString() + 'px Georgia';

	    // init the object queue
	    this.queue = new createjs.LoadQueue(false);
	    this.queue.installPlugin(createjs.Sound);
	    this.queue.on('complete', this.queueLoaded, this);
	    this.queue.loadManifest([
	        {id: 'backgroundImage', src: '/uploads/assets/moorhuhn/background/playground-moorhuhn.svg'},
	        {id: 'shot', src: '/uploads/assets/moorhuhn/shot.mp3'},
	        {id: 'background', src: '/uploads/assets/moorhuhn/LightingBolt.mp3'},
	        {id: 'deathSound', src: '/uploads/assets/moorhuhn/die.mp3'},
        	{id: 'gameOverSound', src: '/uploads/assets/moorhuhn/gameOver.mp3'},
	    ]);
	    this.queue.load();

	    // the bird's default config
		this.moorhuhnXPos  = 0;
		this.moorhuhnYPos  = 200;
		this.moorhuhnSpeed = 20;
		this.moorhuhnScale = 1.0;

		// shooting constants
		this.shotHit    = 10;
		this.shotMissed = -2;

		// chicken spawn constants
		this.minSpawnTime   = 1500;
		this.maxSpawnTime   = 3000;
		this.minSpawnCoordY = 10;
		this.maxSpawnCoordY = this.areaHeight - 30;
		this.minSpawnScale  = 0.2;
		this.maxSpawnScale  = 1.0;

		// initial game time and timer updating function
		this.initialGameTime = this.gameTime = 30;
		var self       = this;
		this.gameTimer = setInterval(this.countdown, 1000, this);

		// limit the SAGE2 fps
		this.maxFPS = 10.0;

		// set ticker fps and tell to stage to listen for tick event, so that it can redraw itself
	    // createjs.Ticker.setFPS(this.maxFPS);
	    // createjs.Ticker.addEventListener('tick', this.stage);

	    // add a button for user to restart the game
	    var newGame  =  {'textual': true, 'label': 'New', 'fill': 'rgba(250, 250, 250, 1.0)', 'animation': false};
		this.controls.addButton({type: newGame, sequenceNo: 1, action: function(date) {
			this.cleanup();
			this.stage.removeChild(this.gameOverText);
			this.stage.removeChild(this.gameOverHaze);
			this.players.length  = 0;
			this.scoreboard.text = "Scores:\n";
			this.gameTime        = this.initialGameTime;
			clearInterval(this.gameTimer);
			this.gameTimer       = setInterval(this.countdown, 1000, this);
			// load the first bird after a while
		    setTimeout(function() {
			    self.moorhuhn.animation = self.createAnimation(getFlyRightSpriteConfig(), -200, self.areaHeight / 2, self.moorhuhnScale, self.moorhuhnScale, 'flapRight');
			    self.moorhuhn.direction = 'right';
			}, 5000);
			console.log('Game has been restarted');
		}.bind(this)});
		this.controls.finishedAddingControls();

		console.log('Moorhuhn object init completed');
	},
	
	load: function(state, date) {},
	
	draw: function(date) {
		if (this.moorhuhn.animation) {
	        // if moorhuhn flies out on the left side -> create right moorhuhn
	        if (this.moorhuhn.animation.x > this.areaWidth + 10) {
	            this.stage.removeChild(this.moorhuhn.animation);
	            this.moorhuhn.animation = this.createAnimation(getFlyLeftSpriteConfig(), 
	                this.moorhuhn.animation.x, this.moorhuhn.animation.y, this.moorhuhnScale - 0.2, this.moorhuhnScale - 0.2, 'flapLeft');
	            this.moorhuhn.direction = 'left';
	        }
	        // if moorhuhn flies out on the right side -> create left moorhuhn    
	        else if (this.moorhuhn.animation.x < -200) {
	            this.stage.removeChild(this.moorhuhn.animation);
	            this.moorhuhn.animation = this.createAnimation(getFlyRightSpriteConfig(), 
	                this.moorhuhn.animation.x, this.moorhuhn.animation.y, this.moorhuhnScale, this.moorhuhnScale, 'flapRight');
	            this.moorhuhn.direction = 'right';
	        }
	    
	        // move moorhuhn in the proper direction
	        if (this.moorhuhn.direction == 'left') {
	            this.moorhuhn.animation.x -= this.moorhuhnScale * 50;
	        }
	        else 
	        {
	            this.moorhuhn.animation.x += this.moorhuhnScale * 50;
	        }

	        // update the scores
	        this.scoreboard.text = this.fillScoreboard();
	    }

	    // redraw the whole stage
	    this.stage.update();
	},
	
	resize: function(date) {
		this.areaWidth  = this.context.canvas.width;
		this.areaHeight = this.context.canvas.height;

	    this.fill.graphics.beginFill('#B6B6B4').drawRect(0, 0, this.areaWidth, this.areaHeight);

	    // resize the texts - the constant fullfills the requirement for a 55px font size on a 1920px wide monitor
	    var fontSize        = this.areaWidth / 35;
	    this.fontStyle      = 'italic ' + fontSize.toString() + 'px Georgia';
	    this.timerText.font = this.scoreboard.font = this.fontStyle;

	    this.timerText.x = this.areaWidth / 2;

		this.maxSpawnCoordY = this.areaHeight - 30;

		// replace the background, this time with svg and caching
		this.stage.removeChild(this.background);
		this.backgroundImage        = new Image();
	    this.backgroundImage.src    = '/uploads/assets/moorhuhn/background/playground-moorhuhn.svg';
	    this.backgroundImage.onload = this.handleBackgroundImageLoad(this, 1700, 960, true);

	    // scale the haze too
	    if (this.stage.getChildIndex(this.gameOverHaze) != -1)
	    {
		    this.gameOverHaze.graphics.clear().beginFill('#000000').drawRect(0, 0, this.areaWidth, this.areaHeight);
		    this.gameOverText.textAlign = 'center';
		    this.gameOverText.font      = this.fontStyle;
		}

		this.refresh(date);
	},

	event: function(eventType, position, userId, data, date) {
		// if pointer click fired
		if (eventType == 'pointerPress' && this.gameTime > 0) {
			console.log('Click event received from: "' + userId.id + '" with label ' + userId.label + ' and color ' + userId.color);
			console.log('Time of the event: "' + date);

			if (this.userExists(userId.id))
			{
				if (this.soundEnabled)
			    	createjs.Sound.play('shot');

			    if (this.moorhuhn.animation) {
			        // obtain the shot and moorhuhn coordinates
			        var shotX        = Math.round(position.x);
			        var shotY        = Math.round(position.y);
			        var spriteCoordX = Math.round(this.moorhuhn.animation.x);
			        var spriteCoordY = Math.round(this.moorhuhn.animation.y);

			        // compute the X and Y distances using absolute values
			        var distX = Math.abs(shotX - spriteCoordX);
			        var distY = Math.abs(shotY - spriteCoordY);

			        if (distX < this.moorhuhnScale * 120 && distY < this.moorhuhnScale * 120)
			        {
			            var self = this;

			            // the chicken has been hit hard
			            this.stage.removeChild(this.moorhuhn.animation);
			            this.moorhuhn.animation = null;
			            var animation = this.createAnimation(getKillSpriteConfig(), spriteCoordX, spriteCoordY, this.moorhuhnScale, this.moorhuhnScale, 'kill');
			            animation.on('animationend', function() {
			                self.stage.removeChild(animation);
			            });

			            if (this.soundEnabled)
			            	createjs.Sound.play('deathSound');

			            this.changeScore(userId.id, this.shotHit);

			            // create a new chicken using random variables
			            var timeToCreate   = this.getRandomInt(this.minSpawnTime, this.maxSpawnTime, date);
			            var flyDirection   = this.getRandomBinary(date);
			            var spriteCoordX   = flyDirection == 0 ? -10 : this.areaWidth + 10;  
			            var spriteCoordY   = this.getRandomInt(this.minSpawnCoordY, this.maxSpawnCoordY, date);
			            this.moorhuhnScale = this.getRandom1decimal(this.minSpawnScale, this.maxSpawnScale, date);

			            setTimeout(function() {
			            	// check if the time hasn't ran out yet
			            	if (self.gameTime > 0)
		            		{
				                self.moorhuhn.animation = self.createAnimation(flyDirection == 0 ? getFlyRightSpriteConfig() : getFlyLeftSpriteConfig(), 
				                   spriteCoordX, spriteCoordY, self.moorhuhnScale, self.moorhuhnScale, flyDirection == 0 ? 'flapRight' : 'flapLeft');
				                self.moorhuhn.direction = flyDirection == 0 ? 'right' : 'left';
				            }
			            }, timeToCreate);
			        }
			        // the penalty for missing the shot
			        else
			        {
			        	this.changeScore(userId.id, this.shotMissed);
			        }
			    } // end of living moorhuhn check
			}
			// add the new user among active players - workaround for widget menu item
			else
			{
				this.players.push({'id': userId.id, 'name': userId.label, 'color': userId.color, 'score': 0});

				console.log('A new user ' + userId.label + ' joined the game');
			}
		}
		// if pointer move event fired
		else if (eventType == 'pointerMove' && this.targetEnabled)
		{
		    // offset the target aim position by 45 pixels so that the pointer cursor is in the center of the crosshair (canvas resizing not taken into account)
		    this.target.x = position.x - 45;
		    this.target.y = position.y - 45;
		}
	},


	/* END OF OVERLOADED FUNCTIONS */


	// a callback function to handle the loaded object queue event
	queueLoaded: function (event) {    
		var self = this;

	    // load both static images
	    this.backgroundImage        = new Image();
	    this.backgroundImage.src    = '/uploads/assets/moorhuhn/background/playground-moorhuhn.png';
	    this.backgroundImage.onload = this.handleBackgroundImageLoad(this, 1280, 720, false);

	    if (this.targetEnabled)
	    {
		    this.targetImage        = new Image();
		    this.targetImage.src    = '/uploads/assets/moorhuhn/target.svg';
		    this.targetImage.onload = this.handleTargetImageLoad(this);
		}

	    // load the first bird after a while (give the application some time to load everything)
	    setTimeout(function() {
		    self.moorhuhn.animation = self.createAnimation(getFlyRightSpriteConfig(), -200, self.areaHeight / 2, self.moorhuhnScale, self.moorhuhnScale, 'flapRight');
		    self.moorhuhn.direction = 'right';
		}, 5000);

	    // add timer
	    this.timerText   = new createjs.Text('Time left: ' + this.gameTime.toString(), this.fontStyle, '#FFF');
	    this.timerText.x = this.areaWidth / 2;
	    this.timerText.y = 10;
	    this.stage.addChildAt(this.timerText, 2);
		console.log('Timer succesfully appended');

		// add scoreboard
	    this.scoreboard   = new createjs.Text(this.fillScoreboard(), this.fontStyle, '#FFF');
	    this.scoreboard.x = 10;
	    this.scoreboard.y = 10;
	    this.stage.addChildAt(this.scoreboard, 3);
		console.log('Scoreboard succesfully appended');

	    // play background music
	    if (this.soundEnabled)
	    	createjs.Sound.play('background', {loop: -1});
	},

	// create the sprite animation, scale and append it to the stage
	createAnimation: function (spriteConfig, x, y, scaleX, scaleY, animType) {
	    // create sprite
	    var sprite    = new createjs.SpriteSheet(spriteConfig, animType);
	    // create animation
	    var animation = new createjs.Sprite(sprite);
	    animation.x   = x;
	    animation.y   = y;

	    // add scale to compensate for a screen larger than full hd
	    var scaleQuantity = this.areaWidth - 1920;
	    var addedScale    = scaleQuantity > 0 ? Math.round(scaleQuantity / 100) : 0;
	    animation.scaleX  = scaleX + addedScale;
	    animation.scaleY  = scaleY + addedScale;
	    animation.gotoAndPlay(animType);

	    this.stage.addChildAt(animation, 4);

		// console.log('A new moorhuhn animation succesfully appended');
	    return animation;
	},

	// a callback function to rasterize, transparate, cache and append the background image 
	handleBackgroundImageLoad: function (instance, width, height, cache) {
	    instance.background = new createjs.Bitmap(instance.backgroundImage);
	    
	    var scaleX                 = (instance.areaWidth / width);
	    var scaleY                 = (instance.areaHeight / height);
	    instance.background.scaleX = scaleX;
	    instance.background.scaleY = scaleY;
	    // lower the alpha so that the bird can be seen against the trees
	    instance.background.set({alpha: 0.85});
	    // tell the stage to not re-render background in every tick
	    if (cache)
	    	instance.background.cache(0, 0, 1280 * (1 + scaleX), 720 * (1 + scaleY));

	    instance.stage.addChildAt(instance.background, 1);

		console.log('Background succesfully appended');
	},

	// a callback function to rasterize, scale and append the target image
	handleTargetImageLoad: function (instance) {
	    instance.target        = new createjs.Bitmap(instance.targetImage);
	    instance.target.x      = instance.areaWidth / 2;
	    instance.target.y      = instance.areaHeight / 2;

	    // var scaleX             = (instance.areaWidth / 5500);
	    // var scaleY             = (instance.areaHeight / 4000);
	    // instance.target.scaleX = scaleX;
	    // instance.target.scaleY = scaleY;

	    // Set the second parameter (z-coord) as high as possible, so that the target aim is always in front of everything
	    instance.stage.addChild(instance.target);

		console.log('Target aim succesfully appended');
	},

	// this function handles the game time
	countdown: function (instance) {
		instance.gameTime -= 1;
		if (instance.timerText)
			instance.timerText.text = 'Time left: ' + instance.gameTime.toString();
		if(instance.gameTime === 0)
		{
			// end game and clean up
			instance.cleanup();

	        if (instance.soundEnabled)
	        {
	        	createjs.Sound.removeSound('background');
	        	createjs.Sound.play('gameOverSound');
	        }

	        // cover the canvas with haze
	        instance.gameOverHaze = new createjs.Shape();
		    instance.gameOverHaze.graphics.beginFill("#000000").drawRect(0, 0, instance.areaWidth, instance.areaHeight);
		    instance.stage.addChild(instance.gameOverHaze).set({alpha: 0.6});

		    // add the game over text
		    instance.gameOverText   = new createjs.Text('GAME OVER', instance.fontStyle, '#FFF');
		    instance.gameOverText.x = instance.areaWidth / 2;
		    instance.gameOverText.y = instance.areaHeight / 2;
		    instance.gameOverText.textAlign = 'center';
		    instance.stage.addChild(instance.gameOverText);

			clearInterval(instance.gameTimer);
		}
	},

	// remove staged objects, so the game can be restarted 
	cleanup: function () {
		this.stage.removeChild(this.moorhuhn.animation);
		// nullify the moorhuhn so that the draw method can still go on without creating new chickens
		this.moorhuhn.animation = null;
		this.stage.removeChild(this.target);
	},

	// checks if the user is already among the registered players
	userExists: function (id) {
		for (var i = 0; i < this.players.length; i++)
		{
			if (this.players[i].id == id)
				return true;
		}

		return false;
	},

	// changes the player's score
	changeScore: function (id, points) {
		for (var i = 0; i < this.players.length; i++)
		{
			if (this.players[i].id == id)
				this.players[i].score += points;
		}
	},

	// create the string to display player scores
	fillScoreboard: function () {
		var s = "Scores:\n";
		for (var i = 0; i < this.players.length; i++)
		{
			s += this.players[i].name + ': ' + this.players[i].score + "\n";
		}

		return s;
	},

	// a set of helper functions that generate pseudo random numbers
	getRandomBinary: function (date) {
		var pseudoRandom = moment(date).unix() / 10 % 1;
	    return Math.round(pseudoRandom);
	},

	getRandom1decimal: function (min, max, date) {
		var pseudoRandom = moment(date).unix() / 10 % 1;
	    return Math.round((pseudoRandom * (max - min) + min) * 10) / 10;
	},

	getRandomInt: function (min, max, date) {
		var pseudoRandom = moment(date).unix() / 10 % 1;
	    return Math.floor(pseudoRandom * (max - min + 1)) + min;
	}
});
