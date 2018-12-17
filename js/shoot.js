
var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'invadersRevenge', { preload: preload, create: create, update: update, render: render });

function preload() {

    game.load.spritesheet('player1', 'assets/player1.png', 32, 32);
    game.load.spritesheet('player2', 'assets/player2.png', 32, 32);
    game.load.spritesheet('player3', 'assets/player3.png', 32, 32);
    game.load.image('bullet', 'assets/bullet.png');
    game.load.spritesheet('enemyBullet', 'assets/enemyBullet.png', 32, 32);
    game.load.image('enemy', 'assets/enemy.png');
    game.load.image('platform', 'assets/platform.png');
    game.load.spritesheet('playerkilled', 'assets/playerkilled.png', 32, 32);
    game.load.spritesheet('enemykilled', 'assets/enemykilled.png', 32, 32);
    game.load.spritesheet('enemyWithKillAnimation', 'assets/enemyWithKillAnimation.png', 32, 32);

}

var player;
var bullets;
var enemies;

var fireRate = 200;
var nextFire = 0;

var aKey;
var dKey;
var leftKey;
var rightKey;
var spaceKey;
var timeSinceSpawn;
var currentTime;
var platform;
var firingTimer = 1000;
var livingEnemies = [];
var stateText;
var score = 0;
var scoreText;
var selectPlayerText;
var player1;
var player2;
var player3;
var players = [];

function create() {

    game.physics.startSystem(Phaser.Physics.ARCADE);

    game.stage.backgroundColor = 'black';

    scoreText = game.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#fff' });
    scoreText.visible = true;

    enemies = game.add.group();
    enemies.enableBody = true;
    enemies.physicsBodyType = Phaser.Physics.ARCADE;

    enemies.setAll('checkWorldBounds', true);
    enemies.setAll('outOfBoundsKill', true);
    enemies.createMultiple(50, 'enemyWithKillAnimation', 4);
    enemies.callAll('animations.add', 'animations', 'enemykilled', [0,1,2,3], 16, false);

    bullets = game.add.group();
    bullets.enableBody = true;
    bullets.physicsBodyType = Phaser.Physics.ARCADE;

    bullets.createMultiple(50, 'bullet');
    bullets.setAll('checkWorldBounds', true);
    bullets.setAll('outOfBoundsKill', true);

    enemyBullets = game.add.group();
    enemyBullets.enableBody = true;
    enemyBullets.physicsBodyType = Phaser.Physics.ARCADE;

    enemyBullets.createMultiple(50, 'enemyBullet');
    enemyBullets.setAll('checkWorldBounds', true);
    enemyBullets.setAll('outOfBoundsKill', true);
    enemyBullets.setAll('anchor.x', 0.5);
    enemyBullets.setAll('anchor.y', 0.5);
    enemyBullets.callAll('animations.add', 'animations', 'glow', [0,1,2,3], 16, true);
    enemyBullets.callAll('play', null, 'glow');

    platform = game.add.sprite(0, 523, 'platform');
    platform.scale.setTo(2,1);

    //  Text
    stateText = game.add.text(game.world.centerX,game.world.centerY,' ', { font: '84px Arial', fill: '#fff' });
    stateText.anchor.setTo(0.5, 0.5);
    stateText.visible = false;

    dKey = game.input.keyboard.addKey(Phaser.Keyboard.D);
    aKey = game.input.keyboard.addKey(Phaser.Keyboard.A);
    leftKey = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
    rightKey = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
    spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

    player1 = game.add.sprite(10,200, 'player1');
    game.physics.enable(player1, Phaser.Physics.ARCADE);
    player1.events.onInputDown.add(select, this);
    player1.inputEnabled = true;

    player2 = game.add.sprite(10,230, 'player2');
    game.physics.enable(player2, Phaser.Physics.ARCADE);
    player2.events.onInputDown.add(select, this);
    player2.inputEnabled = true;

    player3 = game.add.sprite(10,260, 'player3');
    game.physics.enable(player3, Phaser.Physics.ARCADE);
    player3.events.onInputDown.add(select, this);
    player3.inputEnabled = true;

    players = [player1, player2, player3];

    player = game.add.sprite(400, 100, 'player1');
    player.anchor.set(0.5, 0.5);
    player.animations.add('move', [0,1,0], 10, false);
    player.setHealth(5);
    game.physics.enable(player, Phaser.Physics.ARCADE);
    player.body.allowRotation = false;

    selectPlayerText = game.add.text(10, 290, 'Click on your alien!', { fontSize: '15px', fill: '#fff' });
    selectPlayerText.visible = true;

    timeSinceSpawn = 0;

}

function listener(selectedPlayerSprite)
{
  player.loadTexture(getSelectedSpriteTexture(selectedPlayerSprite));

  selectPlayerText.visible = false;

}

function getSelectedSpriteTexture(selectedPlayerSprite)
{
  var texture;
  if (selectedPlayerSprite == player1)
  {
    texture = 'player1';
  } else if (selectedPlayerSprite == player2)
  {
    texture = 'player2';
  } else {
    texture = 'player3';
  }
  return texture;
}

function selectPlayer()
{
  if (game.input.activePointer.isDown)
  {

    listener(char, player);
  }
}

function select(texture)
{
  player.loadTexture(getSelectedSpriteTexture(texture));
}

function update() {

    currentTime = this.game.time.totalElapsedSeconds();

    game.physics.arcade.overlap(bullets, enemies, hitEnemy, 0, this);
    game.physics.arcade.overlap(player, enemyBullets, hitPlayer, 0, this);

    if (currentTime - timeSinceSpawn > 2)
    {
      timeSinceSpawn = currentTime;
      spawnEnemy();
    }

    if (spaceKey.isDown || game.input.activePointer.isDown)
    {
        fire();
    }

    if (aKey.isDown || leftKey.isDown)
    {
      if (spaceKey.isDown)
      {
        fire();
      }
      if (player.body.x > 0)
      {
        player.animations.play('move');
        player.x -= 5;
      }
    } else if (dKey.isDown || rightKey.isDown)
    {
      if (spaceKey.isDown)
      {
        fire();
      }
      if (player.body.x < 768) // 800 - 32 game width minus sprite width
      {
        player.animations.play('move');
        player.x += 5;
      }
    }

    if (game.time.now > firingTimer)
    {
      randomWaitAndFire();
    }
}

function hitEnemy(bullet, enemy) {
    enemy.play('enemykilled', 20, false, true);
    score += 10;
    scoreText.setText('Score: ' + score);
}

function hitPlayer(player, enemyBullet) {
  player.damage(1);
  enemyBullet.kill();
  if (player.health <= 0)
  {
    gameOver();
  }
}

function gameOver() {
      game.paused = true;
      stateText.text="GAME OVER \n Click to restart";
      stateText.visible = true;

      //the "click to restart" handler
      game.input.onTap.addOnce(restart,this);
}


function fire() {

    if (game.time.now > nextFire && bullets.countDead() > 0)
    {
        nextFire = game.time.now + fireRate;

        var bullet = bullets.getFirstDead();

        bullet.reset(player.x - 8, player.y - 8);
        game.physics.arcade.moveToPointer(bullet, 300);
    }

}

function spawnEnemy() {
    var enemy = enemies.getFirstDead();
    var speed = 30 + this.game.time.totalElapsedSeconds()*Math.E

    if (getRandomSign() < 1)
    {
      enemy.reset(0, 500);
      game.physics.arcade.moveToXY(enemy, 1000, 500, speed, 0);

    } else {
      enemy.reset(800, 500);
      game.physics.arcade.moveToXY(enemy, -1000, 500, speed, 0);
    }

}

function randomWaitAndFire()
{
    enemyBullet = enemyBullets.getFirstExists(false);

    livingEnemies.length=0;

    enemies.forEachAlive(function(enemy){

        // put every living enemy in an array
        livingEnemies.push(enemy);
    });


    if (enemyBullet && livingEnemies.length > 0)
    {

        var random=game.rnd.integerInRange(0,livingEnemies.length-1);

        // randomly select one of them
        var shooter=livingEnemies[random];
        // And fire the bullet from this enemy
        enemyBullet.reset(shooter.body.x, shooter.body.y);


        game.physics.arcade.moveToObject(enemyBullet,player,120);
        firingTimer -= game.time.now;
    }
}

function getRandomNonZeroInt(min, max) {
  var rand = Math.floor(Math.random() * (max - min + 1)) + min;
  if (rand == 0)
  {
    return getRandomNonZeroInt(min, max);
  } else {
    return rand;
  }
}

function getRandomSign()
{
  return Math.sign(getRandomNonZeroInt(-1,1));
}

function restart () {
    enemies.callAll('kill');
    enemyBullets.removeAll();
    game.paused = false;
    //revives the player
    player.revive();
    //hides the text
    stateText.visible = false;
}

function render() {
}
