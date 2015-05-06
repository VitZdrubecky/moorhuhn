var moorhuhn = SAGE2_App.extend({

	construct: function() {
		// call super-class 'construct' and set the window resize type
		arguments.callee.superClass.construct.call(this);
		this.resizeEvents = 'continuous';
		
		// construct stage
		this.areaWidth    = null;
		this.areaHeight   = null;
		this.context      = null;
		this.queue        = null;
		this.stage        = null;
		this.soundEnabled = null;

		// construct graphics
		this.backgroundImage = null;
		this.background      = null;
		this.targetImage     = null;
		this.target          = null;

		// construct the bird
		this.moorhuhnXPos  = null;
		this.moorhuhnYPos  = null;
		this.moorhuhnSpeed = null;
		this.moorhuhnScale = null;
		this.moorhuhn      = {};

		// construct the timer
		this.timerText     = null;
		this.gameTime  = null;
		this.gameTimer = null;

		// construct the player-related variables
		this.players    = [];
		this.scoreboard = null;
		this.shotHit    = null;
		this.shotMissed = null;

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
	    this.element.id            = 'birdCanvas';
	    this.stage                 = new createjs.Stage('birdCanvas');

	    // set this to true if the game should include all the sounds and music
	    this.soundEnabled          = false;

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
		this.minSpawnTime   = 1000;
		this.maxSpawnTime   = 3000;
		this.minSpawnCoordY = 10;
		this.maxSpawnCoordY = this.areaHeight - 30;
		this.minSpawnScale  = 0.2;
		this.maxSpawnScale  = 1.0;

		// initial game time and timer updating function
		this.gameTime = 100;
		var self      = this;
		this.gameTimer = setInterval(function () {
			self.gameTime -= 1;
			if(self.gameTime === 0)
			{
				// end game and clean up
				self.timerText.text = 'GAME OVER';
				self.stage.removeChild(self.moorhuhn.animation);
				// nullify the moorhuhn so that the Ticker::tick event listeners can still go on without creating new chickens
				self.moorhuhn.animation = null;
				self.stage.removeChild(self.target);
		        if (self.soundEnabled)
		        {
		        	createjs.Sound.removeSound('background');
		        	createjs.Sound.play('gameOverSound');
		        }
				clearInterval(self.gameTimer);
			}
			else
			{
				if (self.timerText)
					self.timerText.text = 'Time left: ' + self.gameTime.toString();
			}
		}, 1000);

		// limit the SAGE2 fps
		this.maxFPS = 10.0;

		// set ticker fps and tell to stage to listen for tick event, so that it can redraw itself
	    createjs.Ticker.setFPS(this.maxFPS);
	    createjs.Ticker.addEventListener('tick', this.stage);

	    // add a button for user to join the game
	    var joinGame =  {'textual': true, 'label': 'Join', 'fill': 'rgba(250,250,250,1.0)', 'animation': false};
		this.controls.addButton({type: joinGame, sequenceNo: 1, id: 'joinGameBtn'});
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
	},
	
	resize: function(date) {
		this.areaWidth  = this.context.canvas.width;
		this.areaHeight = this.context.canvas.height;

	    this.timerText.x = this.areaWidth / 2;

		this.maxSpawnCoordY = this.areaHeight - 30;

		this.stage.removeChild(this.background);
		this.backgroundImage        = new Image();
	    this.backgroundImage.src    = '/uploads/assets/moorhuhn/background/playground-moorhuhn.svg';
	    this.backgroundImage.onload = this.handleBackgroundImageLoad(this, true);

		this.refresh(date);
	},

	event: function(eventType, position, userId, data, date) {
		// if pointer click fired
		if (eventType == 'pointerPress' && this.gameTime > 0) {
			console.log('Click event received from: "' + userId.id + '" with label ' + userId.label + ' and color ' + userId.color);

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
			            var timeToCreate   = this.getRandomInt(this.minSpawnTime, this.maxSpawnTime);
			            var flyDirection   = this.getRandomBinary();
			            var spriteCoordX   = flyDirection == 0 ? -10 : this.areaWidth + 10;  
			            var spriteCoordY   = this.getRandomInt(this.minSpawnCoordY, this.maxSpawnCoordY);
			            this.moorhuhnScale = this.getRandom1decimal(this.minSpawnScale, this.maxSpawnScale);

			            setTimeout(function() {
			                self.moorhuhn.animation = self.createAnimation(flyDirection == 0 ? getFlyRightSpriteConfig() : getFlyLeftSpriteConfig(), 
			                   spriteCoordX, spriteCoordY, self.moorhuhnScale, self.moorhuhnScale, flyDirection == 0 ? 'flapRight' : 'flapLeft');
			                self.moorhuhn.direction = flyDirection == 0 ? 'right' : 'left';
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
		else if (eventType == 'pointerMove')
		{
		    // offset the target aim position by 45 pixels so that the pointer cursor is in the center of the crosshair
		    this.target.x = position.x - 45;
		    this.target.y = position.y - 45;
		}
		// check if the user wants to join the game
		else if (eventType == 'widgetEvent' && data.ctrlId == 'joinGameBtn')
		{
			if ( ! this.userExists(userId.id))
			{
				this.players.push({'id': userId.id, 'name': userId.label, 'color': userId.color, 'score': 0});

				console.log('A new user ' + userId.label + ' joined the game');
			}
	    }
	},


	/* END OF OVERLOADED FUNCTIONS */


	// a callback function to handle the loaded object queue event
	queueLoaded: function (event) {    
		var self = this;

	    // load both static images
	    this.backgroundImage        = new Image();
	    this.backgroundImage.src    = '/uploads/assets/moorhuhn/background/playground-moorhuhn.png';
	    this.backgroundImage.onload = this.handleBackgroundImageLoad(this, false);

	    this.targetImage            = new Image();
	    this.targetImage.src        = '/uploads/assets/moorhuhn/target.svg';
	    this.targetImage.onload     = this.handleTargetImageLoad(this);

	    // load animations
	    this.moorhuhn.animation = this.createAnimation(getFlyRightSpriteConfig(), 0, 200, this.moorhuhnScale, this.moorhuhnScale, 'flapRight');
	    this.moorhuhn.direction = 'right';

	    // add timer
	    this.timerText   = new createjs.Text('Time left: ' + this.gameTime.toString(), '36px Arial', '#FFF');
	    this.timerText.x = this.areaWidth / 2;
	    this.timerText.y = 10;
	    this.stage.addChildAt(this.timerText, 1);
		console.log('Timer succesfully appended');

		// add scoreboard
	    this.scoreboard   = new createjs.Text(this.fillScoreboard(), '36px Arial', '#FFF');
	    this.scoreboard.x = 10;
	    this.scoreboard.y = 10;
	    this.stage.addChildAt(this.scoreboard, 2);
		console.log('Scoreboard succesfully appended');

	    // play background music
	    if (this.soundEnabled)
	    	createjs.Sound.play('background', {loop: -1});
	    
		// the callback function handles every tick event and moves the moorhuhn	
	 //    createjs.Ticker.addEventListener('tick', function () {
		//     if (self.moorhuhn.animation) {
		//         // if moorhuhn flies out on the left side -> create right moorhuhn
		//         if (self.moorhuhn.animation.x > self.areaWidth + 10) {
		//             self.stage.removeChild(self.moorhuhn.animation);
		//             self.moorhuhn.animation = self.createAnimation(getFlyLeftSpriteConfig(), 
		//                 self.moorhuhn.animation.x, self.moorhuhn.animation.y, self.moorhuhnScale - 0.2, self.moorhuhnScale - 0.2, 'flapLeft');
		//             self.moorhuhn.direction = 'left';
		//         }
		//         // if moorhuhn flies out on the right side -> create left moorhuhn    
		//         else if (self.moorhuhn.animation.x < -200) {
		//             self.stage.removeChild(self.moorhuhn.animation);
		//             self.moorhuhn.animation = self.createAnimation(getFlyRightSpriteConfig(), 
		//                 self.moorhuhn.animation.x, self.moorhuhn.animation.y, self.moorhuhnScale, self.moorhuhnScale, 'flapRight');
		//             self.moorhuhn.direction = 'right';
		//         }
		    
		//         // move moorhuhn in the proper direction
		//         if (self.moorhuhn.direction == 'left') {
		//             self.moorhuhn.animation.x -= self.moorhuhnScale * 50;
		//         }
		//         else 
		//         {
		//             self.moorhuhn.animation.x += self.moorhuhnScale * 50;
		//         }

		//         // update the scores
		//         self.scoreboard.text = self.fillScoreboard();
		//     }
		// });
	},

	// create the sprite animation, scale and append it to the stage
	createAnimation: function (spriteConfig, x, y, scaleX, scaleY, animType) {
	    // create sprite
	    var sprite       = new createjs.SpriteSheet(spriteConfig, animType);
	    // create animation
	    var animation    = new createjs.Sprite(sprite);
	    animation.x      = x;
	    animation.y      = y;
	    animation.scaleX = scaleX;
	    animation.scaleY = scaleY;
	    animation.gotoAndPlay(animType);

	    /**
	     * moorhuhn should always be in front of the background and behind the target aim
	     * first case happens when the moorhuhn is firstly loaded, second when replaced for one that flies in the opposite direction
	     */
	    this.stage.addChildAt(animation, 3);

		// console.log('A new moorhuhn animation succesfully appended');
	    return animation;
	},

	// a callback function to rasterize, transparate, cache and append the background image 
	handleBackgroundImageLoad: function (instance, cache) {
	    instance.background = new createjs.Bitmap(instance.backgroundImage);
	    
	    var scaleX = (instance.areaWidth / 1280);
	    var scaleY = (instance.areaHeight / 720);
	    instance.background.scaleX = scaleX;
	    instance.background.scaleY = scaleY;
	    // instance.background.set({alpha: 0.85});
	    // cache the background, so that it's not re-rendered every tick
	    if (cache)
	    	instance.background.cache(0, 0, 1280, 720);

	    instance.stage.addChildAt(instance.background, 0);

		console.log('Background succesfully appended');
	},

	// a callback function to rasterize, scale and append the target image
	handleTargetImageLoad: function (instance) {
	    instance.target        = new createjs.Bitmap(instance.targetImage);
	    instance.target.x      = instance.areaWidth / 2;
	    instance.target.y      = instance.areaHeight / 2;
	    instance.target.scaleX = 0.15;
	    instance.target.scaleY = 0.15;

	    // Set the second parameter (z-coord) as high as possible, so that the target aim is always in front of everything
	    instance.stage.addChildAt(instance.target, instance.stage.getNumChildren());

		console.log('Target aim succesfully appended');
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
		var s = "Scores:\n\n";
		for (var i = 0; i < this.players.length; i++)
		{
			s += this.players[i].name + ': ' + this.players[i].score + "\n";
		}

		return s;
	},

	// a set of helper functions that generate pseudo random numbers
	getRandomBinary: function () {
		var pseudoRandom = Date.now() / 10000 % 1;
	    return Math.round(pseudoRandom);
	},

	getRandom1decimal: function (min, max) {
		var pseudoRandom = Date.now() / 10000 % 1;
	    return Math.round((pseudoRandom * (max - min) + min) * 10) / 10;
	},

	getRandomInt: function (min, max) {
		var pseudoRandom = Date.now() / 10000 % 1;
	    return Math.floor(pseudoRandom * (max - min + 1)) + min;
	}
});
