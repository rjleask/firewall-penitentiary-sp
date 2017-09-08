var introMusic = new Audio('assets/audio/intro.mp3');
var mainMusic = new Audio('assets/audio/main.mp3')
introMusic.play();
responsiveVoice.speak("Welcome To Firewall Penitentiary, we hope your stay will not be permanent", "UK English Female", { volume: 1 });
$('.buttons').append("<button id='start-game'>Start Game</button>");

$('body').on('click', '#start-game', function() {
    $(this).remove();
    introMusic.pause();
    mainMusic.play();
    mainMusic.loop = true;
    $('h2').addClass("reveal-content");
    var game = new Phaser.Game(800, 600, Phaser.AUTO, 'mainScreen', {
        preload: preload,
        create: create,
        update: update
    });


    var player, playerBullets, playerShield, playerGun, stars, gun, fireButton, newCursor, gameBall, uplGoal, uprGoal, btmrGoal, btmlGoal, goalArr, text, playerScoreDisplay, pillars, emitter, endGameMessage;
    var hasBall = false;
    var timerActive = false;
    var scoreTracker = 0;
    var deathSound = new Audio('assets/audio/shatter.mp3');
    var goalNoise = new Audio('assets/audio/goalBleep.mp3');
    var ballXLoc;
    var ballYLoc;
    // plays music and listens for button clicks to either pause or resume music
    // dynamically adding buttons
    $('.buttons').append("<button id='stop-sound'>Stop Music</button>");
    $('.buttons').append("<button id='play-sound'>Play Music</button>");

    $('body').on('click', '#stop-sound', function() {
        mainMusic.pause();
        mainMusic.loop = true;
    });
    $('body').on('click', '#play-sound', function() {
        mainMusic.play();
        mainMusic.loop = true;
    });
    $('body').on('click', '#restart-game', function() {
        $(".space-station").empty();
        $(".name-craft-box").empty();
        restartWholeGame();
        this.remove();
    });
    // greets newcomer

    function preload() {

        game.load.image('mapX', 'assets/images/map03.png', 800, 600);
        game.load.spritesheet('playerBullet', 'assets/images/playerBullet.png', 10, 10);
        game.load.spritesheet('shield_blue', 'assets/images/shield_blue.png', 32, 10);
        game.load.spritesheet('gun_basic', 'assets/images/gun_basic.png', 8, 15);
        game.load.spritesheet('prisoner_blue', 'assets/images/prisoner_blue.png', 40, 40);
        game.load.spritesheet('prisoner_red', 'assets/images/prisoner_red.png', 40, 40);
        game.load.spritesheet('prisoner_green', 'assets/images/prisoner_green.png', 40, 40);
        game.load.spritesheet('prisoner_yellow', 'assets/images/prisoner_yellow.png', 40, 40);
        game.load.spritesheet('game-ball', 'assets/images/ball03.png');
        game.load.spritesheet('goal', 'assets/images/goal3.png', 110, 110);
        game.load.image('pillar', './assets/images/forcefield.png');
        game.load.image('deathOne', 'assets/images/deathOne.png');

    }

    function create() {
        /*Create map & terrain features*/
        game.add.sprite(0, 0, 'mapX');
        // all the goals looping through and add hitboxes and physics
        uplGoal = game.add.sprite(50, 50, 'goal');
        uplGoal.angle = 90;
        uplGoal.anchor.setTo(0.5, 0.5);
        uprGoal = game.add.sprite(750, 50, 'goal');
        uprGoal.angle = 180;
        uprGoal.anchor.setTo(0.5, 0.5);
        btmrGoal = game.add.sprite(750, 550, 'goal');
        btmrGoal.angle = -90;
        btmrGoal.anchor.setTo(0.5, 0.5);
        btmlGoal = game.add.sprite(50, 550, 'goal');
        btmlGoal.anchor.setTo(0.5, 0.5);
        goalArr = [uplGoal, uprGoal, btmlGoal, btmrGoal];
        for (var i = 0; i < goalArr.length; i++) {
            game.physics.arcade.enable(goalArr[i]);
            goalArr[i].body.immovable = true;
            goalArr[i].body.isCircle = true;
            goalArr[i].animations.add('flash', [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0], 7, false)
        }
        // positions of hitboxes
        uplGoal.body.setCircle(64, -27, -27);
        uprGoal.body.setCircle(64, 0, -29);
        btmlGoal.body.setCircle(64, -27, 0);
        btmrGoal.body.setCircle(64, 0, 0);

        //Adds a group called pillars and then adds one in front of each player's base
        pillars = game.add.group();
        pillars.create(175, 275, 'pillar');
        pillars.create(575, 275, 'pillar');
        pillars.create(375, 125, 'pillar');
        pillars.create(375, 425, 'pillar');
        //Enable physics for the pillars group
        game.physics.arcade.enable(pillars);
        //Iterates over each member of the pillars group and stops them from leaving map.
        pillars.forEachAlive(function(pillar) {
            pillar.body.collideWorldBounds = true;
            pillar.body.immovable = true;
        });
        //Death particle emitter
        emitter = game.add.emitter(0, 0, 100);
        emitter.makeParticles(['deathOne']);
        emitter.gravity = 0;
        emitter.maxParticleScale = 1.5;

        // end game text
        endGameMessage = game.add.text(game.world.centerX, game.world.centerY, "Incredible!\n Informational Reward\n Below!", { font: "30px Orbitron", fill: "blue", align: "center" });
        endGameMessage.anchor.setTo(0.5, 0.5);
        endGameMessage.visible = false;
        // Goal Text
        text = game.add.text(game.world.centerX, game.world.centerY, "Packet Delivered...\naka..GOOAALLLL!!!!", { font: "30px Orbitron", fill: "blue", align: "center" });
        text.anchor.setTo(0.5, 0.5);
        text.visible = false;
        playerScoreDisplay = game.add.text(400, 576, scoreTracker, { font: "45px Orbitron", fill: "#bbb" });
        playerScoreDisplay.anchor.setTo(0.5, 0.5);
        //Iterates over each member of the stars group and stops them from leaving map.

        //Creates a group called playerBullets and randomly adds 10 of them to the map
        playerBullets = game.add.group();
        for (i = 0; i < 18; i++) {
            var xLoc = Math.floor(Math.random() * 790);
            var yLoc = Math.floor(Math.random() * 590);
            playerBullets.create(xLoc, yLoc, 'playerBullet');
        }
        //Enable physics for the playerBullets group
        game.physics.arcade.enable(playerBullets);
        //Iterates over each member of the playerBullets group and stops them from leaving map.  Also adds bounce and sets center for rotation
        playerBullets.forEachAlive(function(playerBullet) {
            playerBullet.body.collideWorldBounds = true;
            playerBullet.body.bounce.x = 1;
            playerBullet.body.bounce.y = 1;
            playerBullet.anchor.setTo(0.5, 0.5);
        });
        playerBullets.forEachAlive(function(playerBullet) {
            playerBullet.body.velocity.x = (Math.floor(Math.random() * 500) - 250);
            playerBullet.body.velocity.y = (Math.floor(Math.random() * 500) - 250);
        });

        //loads the player into the map
        spawnPlayer();
        // spawn ball onto map
        highlightGoal();
        // adding weapon and a firebutton and having its movements track player
        gun = game.add.weapon(3, 'playerBullet');
        gun.addBulletAnimation('bulletSpin', [0, 1], 10, true);
        // gun.bulletSpeed(400);
        gun.fireRate = 500;
        gun.trackSprite(player, 14, 0);
        newCursor = this.input.keyboard.createCursorKeys();
        fireButton = this.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR);
    }

    function update() {
        //spin bullets
        playerBullets.forEachAlive(function(playerBullet) {
            playerBullet.angle += 10;
        });
        gun.bullets.forEachAlive(function(playerBullet) {
            playerBullet.angle += 10;
            playerBullet.body.bounce.x = 1;
            playerBullet.body.bounce.y = 1;
            playerBullet.body.collideWorldBounds = true;
        });

        //Create a collision event - player vs stars
        var starStruck = game.physics.arcade.collide(player, stars);
        var shieldStruck = game.physics.arcade.collide(playerShield, playerBullets);
        // pillar collisions
        var pillarStruck = game.physics.arcade.collide(player, pillars);
        var pillarShot = game.physics.arcade.collide(playerBullets, pillars);
        var pillarShot2 = game.physics.arcade.collide(gun.bullets, pillars);
        // collision event for player and ball
        var ballTouch = game.physics.arcade.collide(player, gameBall);
        //Collision detection for weapons fire
        //vs player
        game.physics.arcade.collide(player, playerBullets, killPlayer, null, this);
        game.physics.arcade.collide(playerShield, playerBullets, deflectBullet, null, this);
        //vs shield
        /* */
        // vs goal
        game.physics.arcade.overlap(player, uplGoal, scoredGoal, null, this);
        game.physics.arcade.overlap(player, uprGoal, scoredGoal, null, this);
        game.physics.arcade.overlap(player, btmlGoal, scoredGoal, null, this);
        game.physics.arcade.overlap(player, btmrGoal, scoredGoal, null, this);
        // collison detection b/t player and ball
        if (ballTouch === true) {
            gameBall.kill();
            ballCarrier();
        }

        //  Reset the players velocity, x and y, so they stop when not pressing movement keys
        player.body.velocity.x = 0;
        player.body.velocity.y = 0;

        //Register cursor keys for player movement
        var cursors = game.input.keyboard.createCursorKeys(),
            //Register the other keys.
            keySPACE = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR),
            keyA = game.input.keyboard.addKey(Phaser.Keyboard.A),
            keyS = game.input.keyboard.addKey(Phaser.Keyboard.S),
            keyW = game.input.keyboard.addKey(Phaser.Keyboard.W),
            keyD = game.input.keyboard.addKey(Phaser.Keyboard.D),
            keyShift = game.input.keyboard.addKey(16),
            //Register mouse for aiming and firing
            mouse = game.input.mousePointer;

        //Stop the following keys from propagating up to the browser - is this necessary?
        game.input.keyboard.addKeyCapture([Phaser.Keyboard.SPACEBAR]);

        /*Movement event handlers. Note: If you don't account for diagonals first, cardinals will override and only move you in one direction, not two.*/

        if (keyW.isDown && keyA.isDown || cursors.up.isDown && cursors.left.isDown) {
            //UP LEFT
            player.body.velocity.x = -150;
            player.body.velocity.y = -150;
            player.animations.play('walk');
            playerShield.animations.play('swingShield');
            playerGun.animations.play('swingGun');
        } else if (keyW.isDown && keyD.isDown || cursors.up.isDown && cursors.right.isDown) {
            //UP RIGHT
            player.body.velocity.x = 150;
            player.body.velocity.y = -150;
            player.animations.play('walk');
            playerShield.animations.play('swingShield');
            playerGun.animations.play('swingGun');
        } else if (keyS.isDown && keyA.isDown || cursors.down.isDown && cursors.left.isDown) {
            //DOWN LEFT
            player.body.velocity.x = -150;
            player.body.velocity.y = 150;
            player.animations.play('walk');
            playerShield.animations.play('swing');
            playerGun.animations.play('swingGun');
        } else if (keyS.isDown && keyD.isDown || cursors.down.isDown && cursors.right.isDown) {
            //DOWN RIGHT
            player.body.velocity.x = 150;
            player.body.velocity.y = 150;
            player.animations.play('walk');
            playerShield.animations.play('swingShield');
            playerGun.animations.play('swingGun');
        } else if (keyW.isDown || cursors.up.isDown) {
            //UP
            player.body.velocity.y = -150;
            player.animations.play('walk');
            playerShield.animations.play('swingShield');
            playerGun.animations.play('swingGun');
            if (!keyShift.isDown) {
                player.angle = 0;
                gun.fireAngle = Phaser.ANGLE_UP;
                gun.trackSprite(player, 15, -19);
                playerShield.body.setSize(32, 15, 0, 0);
            }
        } else if (keyS.isDown || cursors.down.isDown) {
            //DOWN
            player.body.velocity.y = 150;
            player.animations.play('walk');
            playerShield.animations.play('swingShield');
            playerGun.animations.play('swingGun');
            if (!keyShift.isDown) {
                player.angle = 180;
                gun.fireAngle = Phaser.ANGLE_DOWN;
                gun.trackSprite(player, -15, 19);
                playerShield.body.setSize(32, 15, -32, -15);
            }
            /*  playerShield.angle = 180;*/
        } else if (keyA.isDown || cursors.left.isDown) {
            //LEFT
            player.body.velocity.x = -150;
            player.animations.play('walk');
            playerShield.animations.play('swingShield');
            playerGun.animations.play('swingGun');
            if (!keyShift.isDown) {
                player.angle = -90;
                gun.fireAngle = Phaser.ANGLE_LEFT;
                gun.trackSprite(player, -19, -15);
                playerShield.body.setSize(15, 32, 0, -32);
            }
        } else if (keyD.isDown || cursors.right.isDown) {
            //RIGHT
            player.body.velocity.x = 150;
            player.animations.play('walk');
            playerShield.animations.play('swingShield');
            playerGun.animations.play('swingGun');
            if (!keyShift.isDown) {
                player.angle = 90;
                gun.fireAngle = Phaser.ANGLE_RIGHT;
                gun.trackSprite(player, 19, 15);
                playerShield.body.setSize(15, 32, -15, 0);
            }

        } else {
            //Stand still
            player.animations.stop();
            playerShield.animations.stop();
            playerGun.animations.stop();
        }

        //Checks to see if the spacebar is down
        if (fireButton.isDown) {
            gun.fire();
        }

        if (mouse.isDown) {
            console.log("Mouse X: " + mouse.x + " Y: " + mouse.y);
        }
    }

    function spawnPlayer() {
        /*Create player and its settings*/
        player = game.add.sprite(387, 576, 'prisoner_blue');
        //Enable physics on the player
        game.physics.arcade.enable(player);
        player.body.isCircle = true;
        player.body.setCircle(13, 6, 6);
        player.health = 1;
        //Stop player and stars from leaving map.
        player.body.collideWorldBounds = true;
        //Make the player walk
        player.animations.add('walk', [0, 1, 2, 3], 10, true);
        //Set the center of the head as the rotation axis
        player.anchor.setTo(0.5, 0.5);
        console.log(player);
        //Create the player's shield, add animation for walking and make the shield a child of the player
        playerShield = game.add.sprite(-30, -25, 'shield_blue');
        game.physics.arcade.enable(playerShield);
        playerShield.body.immovable = true;
        playerShield.animations.add('swingShield', [0, 1, 2, 3], 10, true);
        player.addChild(playerShield);
        //Create the player's basic weapon, add animation for walking and make it a child of player
        playerGun = game.add.sprite(10, -23, 'gun_basic');
        playerGun.animations.add('swingGun', [0, 1, 2, 3], 10, true);
        playerGun.animations.add('fireGun', [0, 1, 2], 15, false);
        player.addChild(playerGun);
    }

    function restartWholeGame() {
        scoreTracker = 0;
        gameBall.destroy();
        game.paused = false;
        player.kill();
        player.revive();
        player.x = 387, player.y = 576;
        highlightGoal();
        endGameMessage.visible = false;
        playerScoreDisplay.setText(scoreTracker);

    }

    function respawnPlayer() {
        player.health = 2;
        setTimeout(function() {
            player.health = 1;
        }, 3000);
        player.revive();
        player.x = 400, player.y = 300;
    }

    function restartPlay() {
        respawnPlayer();
        text.visible = false;
        highlightGoal();
        hasBall = false;
        timerActive = false;
    }

    function scoredGoal(player, goal) {
        // checks if he has the ball and if the frame is on the highlighted one
        console.log(goal);
        if (hasBall === true && goal.frame === 1) {
            player.kill();
            gameBall.destroy();
            text.visible = true;
            goal.animations.play('flash');
            goalNoise.play();
            scoreTracker++;
            playerScoreDisplay.setText(scoreTracker);
            btmlGoal.frame = 0;
            btmrGoal.frame = 0;
            uplGoal.frame = 0;
            uprGoal.frame = 0;
            timerActive = true;
            // if number of goals scored is equal to the number runs this code else call the restart function in 5 seconds
            if (scoreTracker === 2) {
                responsiveVoice.speak("Well done, scroll down for your informational reward", "UK English Female", { volume: 1 });
                getSpaceData();
                text.visible = false;
                endGameMessage.visible = true;
                game.paused = true;
                $('.buttons').append("<button id='restart-game'>Restart Game</button>");
            } else {
                setTimeout(restartPlay, 5000);
            }
        } else {
            console.log("no goal!");
        }
    }

    function killPlayer() {
        // player.kill();
        player.health -= 1;
        if (player.health === 0) {
            player.kill();
            deathSound.play();
            // playerShield.kill();
            emitter.x = player.x;
            emitter.y = player.y;
            emitter.start(true, 3000, null, 30);
            if (hasBall === true && timerActive === false) {
                gameBall.destroy();
                hasBall = false;
                spawnBall();
            }
            setTimeout(respawnPlayer, 5000);
        }
    }

    function spawnBall() {
        ballXLoc = randomIntFromInterval(100, 700) - 17;
        ballYLoc = randomIntFromInterval(100, 500) - 17;
        gameBall = game.add.sprite(ballXLoc, ballYLoc, 'game-ball');
        game.physics.arcade.enable(gameBall);
        gameBall.body.isCircle = true;
        gameBall.body.immovable = true;
        gameBall.body.setCircle(17, 2, 0);
    }

    function highlightGoal() {
        spawnBall();
        if (ballXLoc < 400) {
            if (ballYLoc < 300) {
                btmrGoal.frame = 1;
            } else {
                uprGoal.frame = 1;
            }
        } else {
            if (ballYLoc < 300) {
                btmlGoal.frame = 1;

            } else {
                uplGoal.frame = 1;
            }
        }
    }

    function ballCarrier() {
        gameBall = game.add.sprite(-18, 7, 'game-ball');
        player.addChild(gameBall);
        hasBall = true;
        console.log("you are the ball carrier");
    }

    function deflectBullet() {
        console.log("Deflected by shield");
    }


    function randomIntFromInterval(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
    // using ajax getting the space-station url and people in space
    function getSpaceData() {
        var url = "http://api.open-notify.org/iss-now.json"
        $.ajax({
            url: url,
            method: 'GET',
        }).done(function(response) {
            // longitude,latitude and currentTime pulled out
            var spaceStationLat = response.iss_position.latitude;
            var spaceStationLong = response.iss_position.longitude;
            var currentTime = response.datetime;
            var convertedTime = moment(currentTime).format("dddd, MMMM Do YYYY, h:mm:ss a");
            // longitude and latitude being appended to the space-station container
            $(".space-station").append("<header class='station-header'>The International Space Station Coordinates</header>");
            $(".space-station").append("<p> At: " + convertedTime + "</p>");
            $(".space-station").append("<p>Latitude: " + spaceStationLat + " Longitude: " + spaceStationLong + "</p>");
        });
        var url1 = "http://api.open-notify.org/astros.json"
        $.ajax({
            url: url1,
            method: 'GET',
        }).done(function(response) {
            var numPeople = response.number;
            var peopleAndCraftArr = [];
            // pushing the array of people and their craft into an array
            for (var i = 0; i < response.people.length; i++) {
                peopleAndCraftArr.push(response.people[i]);
            }
            // appending num people in space and looping through our newly created array and pulling out name and craft
            $(".name-craft-box header").append("There are currently " + numPeople + " people in space right now");
            for (var j = 0; j < peopleAndCraftArr.length; j++) {
                $(".name-craft-box").append("<p class='names-craft'>" + "Name: " + peopleAndCraftArr[j].name + ", Craft: " + peopleAndCraftArr[j].craft + "</p>");
            }
        });
    }
});