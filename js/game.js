//Initial vars
var ghostPos = [];
var joinData = {};
joinData.room = false;
var clientId;
var reset = false;
var map;
var player;
var cursors;
var text;
var ghost = [];
var lastReset = 0;
var amountOfGhosts = 0;
var groundMoveSpeed = 250;
var airMoveSpeed = 150;
var jumpHeight = 600;

//Set join data from url
if(window.location.hash){
    var hashes = window.location.hash;
    hashes = hashes.split('#');
    var options = hashes[1].split("?");
    for(i=0;i<options.length;i++){
        joinData[options[i].split("=")[0]] = options[i].split("=")[1]; 
    }
}

// Connect to MP server
const socket = io('http://localhost:3000/game');

// Join room on server
// joinData.room decides room to join, default = create new room
socket.emit('join room', joinData);

// Get confirmation from server after joining and set server generated client id 
socket.on('connected', function(clientData){
    clientId = clientData.id;
})

// Listen for resets done by users in the room
socket.on('reset', function(data){
    // Checks if reset is done by player
    if(data.id == clientId){
        console.log("player reset")
        reset = true;
    } else {
        console.log("oponent reset")
    }
});

// Listen for ghost data sent by server
socket.on('ghosts', function(ghostData){
    // Checks if ghost belongs to player
    if(ghostData.player == clientId){
        // Loop through all ghosts
        for(i=0;i<ghostData.amount;i++){
            var ghosts = ghostData.ghostBundle;
            // Update local last known coordinates per ghost,
            // Ingame ghosts get updated in update() to these last known values
            if(ghosts[i]){
                var tempCoords = JSON.parse(ghosts[i][1]);
                ghostPos[ghosts[i][0]]=[];
                ghostPos[ghosts[i][0]].x = tempCoords[0];
                ghostPos[ghosts[i][0]].y = tempCoords[1];
            }
        }
    }
});


// Phaser config
var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {y: 900},
            debug: false
        }
    },
    scene: {
        key: 'main',
        preload: preload,
        create: create,
        update: update
    }
};

// Init Phaser
var game = new Phaser.Game(config);
 

 
function preload() {
    this.load.path = 'Assets/';

    //player anims preload:
    for(i = 1; i <= 79; i++)
    {
        this.load.image("idle_" + i.toString().padStart(4, '0'), "PlayerAnims/" + i.toString().padStart(4, '0') + ".png");
    }
    for(i = 82; i <= 105; i++)
    {
        this.load.image("run_" + i.toString().padStart(4, '0'), "PlayerAnims/" + i.toString().padStart(4, '0') + ".png");
    }
    for(i = 108; i <= 124; i++)
    {
        this.load.image("jump_" + i.toString().padStart(4, '0'), "PlayerAnims/" + i.toString().padStart(4, '0') + ".png");
    }
    for(i = 125; i <= 138; i++)
    {
        this.load.image("fly_" + i.toString().padStart(4, '0'), "PlayerAnims/" + i.toString().padStart(4, '0') + ".png");
    }
    for(i = 153; i <= 189; i++)
    {
        this.load.image("fall_" + i.toString().padStart(4, '0'), "PlayerAnims/" + i.toString().padStart(4, '0') + ".png");
    }
    for(i = 190; i <= 203; i++)
    {
        this.load.image("falling_" + i.toString().padStart(4, '0'), "PlayerAnims/" + i.toString().padStart(4, '0') + ".png");
    }
    for(i = 217; i <= 274; i++)
    {
        this.load.image("bounce_" + i.toString().padStart(4, '0'), "PlayerAnims/" + i.toString().padStart(4, '0') + ".png");
    }
    //ghost anims preload (very spooky!!):
    for(i = 1; i <= 79; i++)
    {
        this.load.image("idle_ghost_" + i.toString().padStart(4, '0'), "GhostAnims/" + i.toString().padStart(4, '0') + ".png");
    }
    for(i = 82; i <= 105; i++)
    {
        this.load.image("run_ghost_" + i.toString().padStart(4, '0'), "GhostAnims/" + i.toString().padStart(4, '0') + ".png");
    }
    for(i = 108; i <= 124; i++)
    {
        this.load.image("jump_ghost_" + i.toString().padStart(4, '0'), "GhostAnims/" + i.toString().padStart(4, '0') + ".png");
    }
    for(i = 125; i <= 138; i++)
    {
        this.load.image("fly_ghost_" + i.toString().padStart(4, '0'), "GhostAnims/" + i.toString().padStart(4, '0') + ".png");
    }
    for(i = 153; i <= 189; i++)
    {
        this.load.image("fall_ghost_" + i.toString().padStart(4, '0'), "GhostAnims/" + i.toString().padStart(4, '0') + ".png");
    }
    for(i = 190; i <= 203; i++)
    {
        this.load.image("falling_ghost_" + i.toString().padStart(4, '0'), "GhostAnims/" + i.toString().padStart(4, '0') + ".png");
    }
    for(i = 217; i <= 274; i++)
    {
        this.load.image("bounce_ghost_" + i.toString().padStart(4, '0'), "GhostAnims/" + i.toString().padStart(4, '0') + ".png");
    }
}
 
function create() {
    // Setting world bounds manually
    this.physics.world.bounds.width = 800;
    this.physics.world.bounds.height = 600;

    createPlayerAnims(this);
    createGhostAnims(this);

    // Create player
    player = this.physics.add.sprite(0, 0, 'player');//
    player.play('falling');
    player.setSize(250,250);
    player.setDisplaySize(100, 100);

    player.setCollideWorldBounds(true); // don't go out of the map
    cursors = this.input.keyboard.createCursorKeys();
    keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
}

function update() 
{
    if(!player.body.onFloor())
    {
        airMove();
    }
    else
    {
        groundMove();
    }
    
    if(keyA.isDown && Date.now()>lastReset+500)
    {
        socket.emit('reset', []);
        lastReset = Date.now();
    }
    // Run if reset is true by server message
    if(reset){
        reset = false;
        // Create ghost object
        ghost[amountOfGhosts] = this.add.graphics();
        ghost[amountOfGhosts].fillStyle(0xffffff, 0.5);
        ghost[amountOfGhosts].fillRect(-18, -18, 36, 36);
        amountOfGhosts++;
        // Reset player
        player.x = 0;
        player.y = 0;
    }
        
    // Constantly send player data to server
    var playerData = {};
    playerData.coords = [player.x,player.y];
    playerData.anim = player.anims.currentAnim;
    playerData.animFrame = player.anims.currentFrame.index;
    playerData.isInteracting = false;
    socket.emit('player move', playerData);

    // Controlling ghosts
    // Loop through ghosts
    for(i=0;i<amountOfGhosts;i++){
        if(ghostPos[i]){
            // update ghost position to last received server ghost position
            ghost[i].x = ghostPos[i].x;
            ghost[i].y = ghostPos[i].y;
        }
    }
}

function airMove()
{
    if(player.body.velocity.y < 0)
    {
        if(player.anims.currentFrame.index == player.anims.currentAnim.frames.length &&  player.anims.getCurrentKey() == "jump")
        {
            player.play("fly");
        }
    }
    if(player.anims.getCurrentKey() == "fly" && player.body.velocity.y >=0)
    {
        player.play("fall");
    }
    if(player.body.velocity.y >=0 && (player.anims.currentFrame.index == player.anims.currentAnim.frames.length &&  player.anims.getCurrentKey() == "fall"))
    {
        player.play("falling");
    }
    if (cursors.left.isDown)
    {
        player.setFlipX(true);
        player.body.setVelocityX(-airMoveSpeed);
    }
    else if (cursors.right.isDown)
    {
        player.setFlipX(false);
        player.body.setVelocityX(airMoveSpeed);
    }
}

function groundMove()
{
    if (cursors.left.isDown)
    {
        player.body.setVelocityX(-groundMoveSpeed);
        player.setFlipX(true);
        if(player.anims.getCurrentKey() != "run")
        {
            player.play("run");
        }
    }
    else if (cursors.right.isDown)
    {
        player.body.setVelocityX(groundMoveSpeed);
        player.setFlipX(false);
        if(player.anims.getCurrentKey() != "run")
        {
            player.play("run");
        }
    }
    else
    {
        if(player.anims.getCurrentKey() == "falling")
        {
            player.play("bounce");
        }
        else if(player.anims.getCurrentKey() != "idle" && player.anims.getCurrentKey() != "bounce")
        {
            player.play("idle");
        }
        if(player.anims.currentFrame.index == player.anims.currentAnim.frames.length &&  player.anims.getCurrentKey() == "bounce")
        {
            player.play("idle");
        }
    }
    if (cursors.space.isDown || cursors.up.isDown)
    {
        player.body.setVelocityY(-jumpHeight);
        player.play("jump");
    }
}

function createPlayerAnims(obj)
{
    //create idle animation
    var idleAnim = {
        key: 'idle',
        frames: [],
        frameRate: 60,
        repeat: -1
    }
    for(i = 1; i <= 79; i++)
    {
        idleAnim.frames.push({ key: "idle_" + i.toString().padStart(4, '0')});
    }
    obj.anims.create(idleAnim);

    //create run animation
    var runAnim = {
        key: 'run',
        frames: [],
        frameRate: 60,
        repeat: -1
    }
    for(i = 82; i <= 105; i++)
    {
        runAnim.frames.push({ key: "run_" + i.toString().padStart(4, '0')});
    }
    obj.anims.create(runAnim);

    //create jump animation
    var jumpAnim = {
        key: 'jump',
        frames: [],
        frameRate: 60,
        repeat: 0
    }
    for(i = 108; i <= 124; i++)
    {
        jumpAnim.frames.push({ key: "jump_" + i.toString().padStart(4, '0')});
    }
    obj.anims.create(jumpAnim);

    //create fly animation
    var flyAnim = {
        key: 'fly',
        frames: [],
        frameRate: 60,
        repeat: -1
    }
    for(i = 125; i <= 138; i++)
    {
        flyAnim.frames.push({ key: "fly_" + i.toString().padStart(4, '0')});
    }
    obj.anims.create(flyAnim);

    //create fall animation
    var fallAnim = {
        key: 'fall',
        frames: [],
        frameRate: 60,
        repeat: 0
    }
    for(i = 153; i <= 189; i++)
    {
        fallAnim.frames.push({ key: "fall_" + i.toString().padStart(4, '0')});
    }
    obj.anims.create(fallAnim);

    //create falling animation
    var fallingAnim = {
        key: 'falling',
        frames: [],
        frameRate: 60,
        repeat: -1
    }
    for(i = 190; i <= 203; i++)
    {
        fallingAnim.frames.push({ key: "falling_" + i.toString().padStart(4, '0')});
    }
    obj.anims.create(fallingAnim);

    //create bounce animation
    var bounceAnim = {
        key: 'bounce',
        frames: [],
        frameRate: 60,
        repeat: 0
    }
    for(i = 217; i <= 274; i++)
    {
        bounceAnim.frames.push({ key: "bounce_" + i.toString().padStart(4, '0')});
    }
    obj.anims.create(bounceAnim);
}

function createGhostAnims(obj)
{
    //create idle animation
    var idleAnim = {
        key: 'idle_ghost',
        frames: [],
        frameRate: 60,
        repeat: -1
    }
    for(i = 1; i <= 79; i++)
    {
        idleAnim.frames.push({ key: "idle_ghost_" + i.toString().padStart(4, '0')});
    }
    obj.anims.create(idleAnim);

    //create run animation
    var runAnim = {
        key: 'run_ghost',
        frames: [],
        frameRate: 60,
        repeat: -1
    }
    for(i = 82; i <= 105; i++)
    {
        runAnim.frames.push({ key: "run_ghost_" + i.toString().padStart(4, '0')});
    }
    obj.anims.create(runAnim);

    //create jump animation
    var jumpAnim = {
        key: 'jump_ghost',
        frames: [],
        frameRate: 60,
        repeat: -1
    }
    for(i = 108; i <= 124; i++)
    {
        jumpAnim.frames.push({ key: "jump_ghost_" + i.toString().padStart(4, '0')});
    }
    obj.anims.create(jumpAnim);

    //create fly animation
    var flyAnim = {
        key: 'fly_ghost',
        frames: [],
        frameRate: 60,
        repeat: -1
    }
    for(i = 125; i <= 138; i++)
    {
        flyAnim.frames.push({ key: "fly_ghost_" + i.toString().padStart(4, '0')});
    }
    obj.anims.create(flyAnim);

    //create fall animation
    var fallAnim = {
        key: 'fall_ghost',
        frames: [],
        frameRate: 60,
        repeat: -1
    }
    for(i = 153; i <= 189; i++)
    {
        fallAnim.frames.push({ key: "fall_ghost_" + i.toString().padStart(4, '0')});
    }
    obj.anims.create(fallAnim);

    //create falling animation
    var fallingAnim = {
        key: 'falling_ghost',
        frames: [],
        frameRate: 60,
        repeat: -1
    }
    for(i = 190; i <= 203; i++)
    {
        fallingAnim.frames.push({ key: "falling_ghost_" + i.toString().padStart(4, '0')});
    }
    obj.anims.create(fallingAnim);

    //create bounce animation
    var bounceAnim = {
        key: 'bounce_ghost',
        frames: [],
        frameRate: 60,
        repeat: -1
    }
    for(i = 217; i <= 274; i++)
    {
        bounceAnim.frames.push({ key: "bounce_ghost_" + i.toString().padStart(4, '0')});
    }
    obj.anims.create(bounceAnim);
}