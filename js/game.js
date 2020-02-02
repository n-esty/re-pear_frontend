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
var airMoveSpeed = 130;
var jumpHeight = 400;
var grav = 900;
var spawnX = 75;
var spawnY = 450;
var ghostLimit = false;
var toggle = false;
var ghostHitboxSize = 100;
var ghostLimit = false;
var hasJumpedInAir = false;
var canJump = true;
var buttonActivationRadius = 50;
//arrays for buttons and doors n shite:
var buttons = [];
var doors = [];
var buttonStates = [];

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
    document.getElementById('roomCode').innerHTML = clientData.room;
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
        // console.log(ghostData)
        // Loop through all ghosts
        for(i=0;i<ghostData.amount;i++){
            var ghosts = ghostData.ghostBundle;
            // Update local last known coordinates per ghost,
            // Ingame ghosts get updated in update() to these last known values
            if(ghosts[i]){
                var tempCoords = ghosts[i][1].coords;
                ghostPos[ghosts[i][0]]=[];
                ghostPos[ghosts[i][0]].anim = ghosts[i][1].anim;
                ghostPos[ghosts[i][0]].flipX = ghosts[i][1].flipX;
                ghostPos[ghosts[i][0]].frameIndex = ghosts[i][1].animFrame - 1;
                ghostPos[ghosts[i][0]].x = tempCoords[0];
                ghostPos[ghosts[i][0]].y = tempCoords[1];
            }
        }
    }
});
var gToggled;
// Toggle ghosts
function toggleGhosts(fromGhost){
    gToggled = fromGhost 
    toggle = true;
    socket.emit('reset', false);
}

function toggleGhostsOff(fromGhost){
    gToggled = amountOfGhosts
    toggle = false;
    socket.emit('reset', false);
}


// Phaser config
var config = {
    type: Phaser.AUTO,
    width: 1300,
    height: 700,
    scale: {
        parent: 'game',
        mode: Phaser.Scale.FIT
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {y: grav},
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
    this.load.path = 'assets/';

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
    this.physics.world.bounds.width = 1300;
    this.physics.world.bounds.height = 700;
    this.add.rectangle(0, 0, 1300*2, 700*2, 0x3c485c);



    createPlayerAnims(this);
    createGhostAnims(this);

    // Create player
    player = this.physics.add.sprite(200, 200, 'player');//
    player.play('falling');
    player.setSize(65,85);
    player.setDisplaySize(100, 100);
    player.setDepth(1000);

    player.setCollideWorldBounds(true); // don't go out of the map
    cursors = this.input.keyboard.createCursorKeys();
    keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);

    buildLevel_0(this);
    //buildLevel_1(this); 
    //buildLevel_2(this); 
    //buildLevel_3(this);

    
    var btn1 = this.physics.add.sprite(100, 525, '');
    btn1.body.allowGravity = false;
    btn1.body.immovable = true;
    buttons.push(btn1);

    var doorsprite1 = this.physics.add.sprite(100, 400, '')
    doorsprite1.body.allowGravity = false;
    doorsprite1.body.immovable = true;
    doorsprite1.setDisplaySize(200, 50);
    this.physics.add.collider(player, doorsprite1);
    
    var door1 = {sprite: doorsprite1, startX: 100, startY: 400, endX: 500, endY: 100, platform: true, speed: 2, startspeed: 2, closedelay: -1};
    doors.push(door1);

    var btn2 = this.physics.add.sprite(300, 525, '');
    btn2.body.allowGravity = false;
    btn2.body.immovable = true;
    buttons.push(btn2);

    var doorsprite2= this.physics.add.sprite(500, 400, '')
    doorsprite2.body.allowGravity = false;
    doorsprite2.body.immovable = true;
    doorsprite2.setDisplaySize(30, 300);
    this.physics.add.collider(player, doorsprite2);
    
    var door2 = {sprite: doorsprite2, startX: 500, startY: 400, endX: 500, endY: 600, platform: false, speed: 2, startspeed: 2, closedelay: 20};
    doors.push(door2);
    socket.emit('reset', false);
}

var save = false;

function update() 
{
   //movement
   if(!player.body.touching.down && !player.body.onFloor())
   {
       airMove();
   }
   else
   {
       groundMove();
   }
   if(cursors.space.isDown)
   {
       canJump = false;
   }
   if(cursors.space.isUp)
   {
       canJump = true;
   }

   checkButtons(this);
   updateDoors(this);
    
    if(keyA.isDown && Date.now()>lastReset+500)
    {
        socket.emit('reset', false);
        lastReset = Date.now();
    }

    if(keyS.isDown && Date.now()>lastReset+500)
    {
        console.log(gToggled, amountOfGhosts);
        if(gToggled<amountOfGhosts){
            amountOfGhosts = gToggled;
            resetData = gToggled;
            toggle=false;
        } else {
            resetData = true;
        }
        save = true;
        socket.emit('reset', resetData);
        lastReset = Date.now();
    }
    // Run if reset is true by server message
    if(reset){
        reset = false;
        for(i=0;i<ghost.length;i++){
            ghost[i].destroy();
        }
        ghostPos = [];

        if(save){
            save = false;
            amountOfGhosts++;         
        }

        if(!toggle){
            gToggled = amountOfGhosts;
        }
        
        for(i=0;i<gToggled;i++){
            ghost[i] = this.physics.add.sprite(-1000, -1000, 'ghost' + i);//
            ghost[i].play('idle_ghost');
            ghost[i].setSize(250,250);
            ghost[i].setDisplaySize(100,100);
            ghost[i].body.moves = false
            ghost[i].alpha = 0.5;
        }

        var htmlHolder = "";
        for(i=0;i<amountOfGhosts;i++){
            if(i<gToggled){
                htmlHolder+="<div onclick='toggleGhosts(" + i + ")' class='btn-ghost'>"+(i+1)+"</div>"
            } else if(i===gToggled) {
                htmlHolder+="<div onclick='toggleGhostsOff(" + i + ")' class='btn-ghost dis'>"+(i+1)+"</div>"
            } else {
                htmlHolder+="<div onclick='toggleGhosts(" + i + ")' class='btn-ghost dis'>"+(i+1)+"</div>"
            }
            
        }
        document.getElementById('ghostButtons').innerHTML = htmlHolder;
        // Reset player
        player.x = spawnX;
        player.y = spawnY;
        for(i = 0; i < doors.length; i++)
        {
            doors[i].sprite.x = doors[i].startX;
            doors[i].sprite.y = doors[i].startY;
            doors[i].speed = doors[i].startspeed;
        }
    }
        
    // Constantly send player data to server
    var playerData = {};
    playerData.coords = [player.x,player.y];
    playerData.anim = player.anims.currentAnim;
    playerData.animFrame = player.anims.currentFrame.index;
    playerData.isInteracting = false;
    playerData.flipX = player.flipX;
    socket.emit('player move', playerData);

    // Controlling ghosts
    // Loop through ghosts
    for(i=0;i<gToggled;i++){
        if(ghostPos[i]){
            // update ghost position to last received server ghost position
            ghost[i].x = ghostPos[i].x;
            ghost[i].y = ghostPos[i].y;
            ghost[i].play(ghostPos[i].anim.key + "_ghost");
            ghost[i].anims.setCurrentFrame(ghost[i].anims.currentAnim.frames[ghostPos[i].frameIndex])
            ghost[i].setFlipX(ghostPos[i].flipX);
        }
    }
}

function checkButtons(obj)
{
    for(i = 0; i < buttons.length; i++)
    {
        var btnIsActive = false;
        //check if player collides with button:
        if((player.body.touching.down || player.body.onFloor()) && player.x > buttons[i].x-buttonActivationRadius/2 && player.x < buttons[i].x+buttonActivationRadius/2 && player.y > buttons[i].y-buttonActivationRadius*2 && player.y < buttons[i].y-buttonActivationRadius/2)
        {
            btnIsActive = true;
        }
        //check if something spoopy is going on
        for(j = 0; j < ghost.length; j++)
        {
            if(ghost[j].x > buttons[i].x-buttonActivationRadius/2 && ghost[j].x < buttons[i].x+buttonActivationRadius/2 && ghost[j].y > buttons[i].y-buttonActivationRadius*2 && ghost[j].y < buttons[i].y-buttonActivationRadius/2)
            {
                btnIsActive = true;
            }
        }

        if(btnIsActive)
        {
            buttonStates[i] = true;
        }
        else
        {
            buttonStates[i] = false;
        }
    }
}

function updateDoors(obj)
{
    for(i = 0; i < buttons.length; i++)
    {
        if(buttonStates[i])
        {
            //calculate xy delta:
            var xD = doors[i].endX-doors[i].startX;
            var yD = doors[i].endY-doors[i].startY;
            //normalize delta:
            var nXD = xD/ Math.sqrt(xD*xD+yD*yD);
            var nYD = yD/ Math.sqrt(xD*xD+yD*yD);
            
            if(doors[i].platform)
            {
                if(((doors[i].sprite.x - doors[i].startX)*(doors[i].sprite.x - doors[i].endX)) > 0 || ((doors[i].sprite.y - doors[i].startY)*(doors[i].sprite.y - doors[i].endY) > 0))
                {
                   doors[i].speed *=-1;
                }
                doors[i].sprite.x+=doors[i].speed*nXD;
                doors[i].sprite.y+=doors[i].speed*nYD;
            }
            else
            {
                if(doors[i].closedelayElapsed <= doors[i].closedelay)
                {
                    doors[i].sprite.x = doors[i].endX;
                    doors[i].sprite.y = doors[i].endY;
                    doors[i].closedelayElapsed++;
                }
                else
                {
                    doors[i].sprite.x = doors[i].startX;
                    doors[i].sprite.y = doors[i].startY;
                }
            }
        }
        else
        {
            if(!doors[i].platform)
            {
                doors[i].closedelayElapsed = 0;
                doors[i].sprite.x = doors[i].startX;
                doors[i].sprite.y = doors[i].startY;
            }
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
    if(checkGhostCollision({x: player.x, y: player.y}) && cursors.space.isDown && canJump && !hasJumpedInAir)
    {
        player.body.setVelocityY(-jumpHeight);
        player.play("jump");
        hasJumpedInAir = true;
    }
}

function groundMove()
{
    hasJumpedInAir = false;
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
        if(player.anims.getCurrentKey() == "falling" || player.anims.getCurrentKey() == "fall")
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
        player.body.velocity.x = player.body.velocity.x*.1;
    }
    if (cursors.space.isDown && canJump)
    {
        player.body.setVelocityY(-jumpHeight);
        player.play("jump");
    }
}

function checkGhostCollision(pos)
{
    for(i = 0; i < ghost.length; i++)
    {
        var gp = {x: ghost[i].x, y: ghost[i].y};
        if(pos.x > gp.x-ghostHitboxSize/2 && pos.x < gp.x+ghostHitboxSize/2 && pos.y > gp.y-ghostHitboxSize/2 && pos.y < gp.y+ghostHitboxSize/2)
        {
            return true;
        }
    }
    return false;
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

function buildLevel_0(obj)
{
    //platforms
    var platform = obj.physics.add.sprite(150, 550, 'asd');
    platform.body.allowGravity = false;
    platform.body.immovable = true;
    platform.body.setFriction(1);
    platform.setDisplaySize(300, 25);

    var platform1 = obj.physics.add.sprite(550, 550, 'asd'); //world space
    platform1.body.allowGravity = false;
    platform1.body.immovable = true;
    platform1.body.setFriction(1);
    platform1.setDisplaySize(300, 25); //size  

    var platform3 = obj.physics.add.sprite(1125, 550, 'asd');
    platform3.body.allowGravity = false;
    platform3.body.immovable = true;
    platform3.body.setFriction(1);
    platform3.setDisplaySize(350, 20);

    //Temp ghost jump spots
    var ghostJumpSpot = obj.physics.add.sprite(820, 580, 'asd'); 
    ghostJumpSpot.body.allowGravity = false;
    ghostJumpSpot.body.immovable = true;
    ghostJumpSpot.body.setFriction(1);
    ghostJumpSpot.setDisplaySize(50, 20);

    //platforms
    obj.physics.add.collider(player, platform);
    obj.physics.add.collider(player, platform1);
    obj.physics.add.collider(player, platform3);

    //Temp ghost jumps
    obj.physics.add.collider(player, ghostJumpSpot);
}

function buildLevel_1(obj)
{
    //temp platforms
    var platform = obj.physics.add.sprite(650, 550, 'asd');
    platform.body.allowGravity = false;
    platform.body.immovable = true;
    platform.body.setFriction(1);
    platform.setDisplaySize(1300, 25);

    //temp buttons
    var tempButtonP1 = obj.physics.add.sprite(450, 525, 'asd'); //world space
    tempButtonP1.body.allowGravity = false;
    tempButtonP1.body.immovable = true;
    tempButtonP1.body.setFriction(1);
    tempButtonP1.setDisplaySize(30, 20); //size  
    var tempButtonP2 = obj.physics.add.sprite(450, 520, 'asd'); //world space
    tempButtonP2.body.allowGravity = false;
    tempButtonP2.body.immovable = true;
    tempButtonP2.body.setFriction(1);
    tempButtonP2.setDisplaySize(50, 15); //size  

    //temp gates
    var tempGate = obj.physics.add.sprite(700, 260, 'asd');
    tempGate.body.allowGravity = false;
    tempGate.body.immovable = true;
    tempGate.body.setFriction(1);
    tempGate.setDisplaySize(20, 550);

    //Temp ghost jump spots

    //platforms
    obj.physics.add.collider(player, platform);
    //obj.physics.add.collider(player, platform1);
    //obj.physics.add.collider(player, platform3);

    //Temp ghost jumps
    //obj.physics.add.collider(player, ghostJumpSpot);

    //Temp buttons
    obj.physics.add.collider(player, tempButtonP1);
    obj.physics.add.collider(player, tempButtonP2);

    //Temp gates 
    obj.physics.add.collider(player, tempGate);


}


function buildLevel_2(obj)
{
  //platforms
  var platform = obj.physics.add.sprite(150, 550, 'asd');
  platform.body.allowGravity = false;
  platform.body.immovable = true;
  platform.body.setFriction(1);
  platform.setDisplaySize(300, 25);

  //var platform1 = obj.physics.add.sprite(650, 550, 'asd'); //world space
  //platform1.body.allowGravity = false;
  //platform1.body.immovable = true;
 // platform1.body.setFriction(1);
 // platform1.setDisplaySize(300, 25); //size  

  var platform3 = obj.physics.add.sprite(900, 550, 'asd');
  platform3.body.allowGravity = false;
  platform3.body.immovable = true;
  platform3.body.setFriction(1);
  platform3.setDisplaySize(800, 20);
  
  //temp buttons
  var tempButtonP1 = obj.physics.add.sprite(60, 525, 'asd'); //world space
  tempButtonP1.body.allowGravity = false;
  tempButtonP1.body.immovable = true;
  tempButtonP1.body.setFriction(1);
  tempButtonP1.setDisplaySize(30, 20); //size  
  var tempButtonP2 = obj.physics.add.sprite(60, 520, 'asd'); //world space
  tempButtonP2.body.allowGravity = false;
  tempButtonP2.body.immovable = true;
  tempButtonP2.body.setFriction(1);
  tempButtonP2.setDisplaySize(50, 15); //size  

    //temp gates
    var tempGate = obj.physics.add.sprite(700, 260, 'asd');
    tempGate.body.allowGravity = false;
    tempGate.body.immovable = true;
    tempGate.body.setFriction(1);
    tempGate.setDisplaySize(20, 550);

    //temp wall 
    var tempWall = obj.physics.add.sprite(700, 460, 'asd');
    tempWall.body.allowGravity = false;
    tempWall.body.immovable = true;
    tempWall.body.setFriction(1);
    tempWall.setDisplaySize(40, 150);


  //Temp ghost jump spots
  var ghostJumpSpot = obj.physics.add.sprite(400, 580, 'asd'); 
  ghostJumpSpot.body.allowGravity = false;
  ghostJumpSpot.body.immovable = true;
  ghostJumpSpot.body.setFriction(1);
  ghostJumpSpot.setDisplaySize(50, 20);

  var ghostJumpSpot_1 = obj.physics.add.sprite(630, 470, 'asd'); 
  ghostJumpSpot_1.body.allowGravity = false;
  ghostJumpSpot_1.body.immovable = true;
  ghostJumpSpot_1.body.setFriction(1);
  ghostJumpSpot_1.setDisplaySize(50, 20);

     //Temp buttons
     obj.physics.add.collider(player, tempButtonP1);
     obj.physics.add.collider(player, tempButtonP2);

    //Temp gates 
    obj.physics.add.collider(player, tempGate);

    //Temp walls 
    obj.physics.add.collider(player, tempWall);


  //platforms
  obj.physics.add.collider(player, platform);
  //obj.physics.add.collider(player, platform1);
  obj.physics.add.collider(player, platform3);

  //Temp ghost jumps
  obj.physics.add.collider(player, ghostJumpSpot);
  obj.physics.add.collider(player, ghostJumpSpot_1);
}

function buildLevel_3(obj)
{
//temp platforms
var platform = obj.physics.add.sprite(1000, 300, 'asd');
platform.body.allowGravity = false;
platform.body.immovable = true;
platform.body.setFriction(1);
platform.setDisplaySize(900, 25);

var platform_1 = obj.physics.add.sprite(650, 550, 'asd');
platform_1.body.allowGravity = false;
platform_1.body.immovable = true;
platform_1.body.setFriction(1);
platform_1.setDisplaySize(1300, 25);

//temp buttons
var tempButtonP1 = obj.physics.add.sprite(600, 525, 'asd'); //world space
tempButtonP1.body.allowGravity = false;
tempButtonP1.body.immovable = true;
tempButtonP1.body.setFriction(1);
tempButtonP1.setDisplaySize(30, 20); //size  
var tempButtonP2 = obj.physics.add.sprite(600, 520, 'asd'); //world space
tempButtonP2.body.allowGravity = false;
tempButtonP2.body.immovable = true;
tempButtonP2.body.setFriction(1);
tempButtonP2.setDisplaySize(50, 15); //size  


//temp wall 
var tempWall = obj.physics.add.sprite(750, 420, 'asd');
tempWall.body.allowGravity = false;
tempWall.body.immovable = true;
tempWall.body.setFriction(1);
tempWall.setDisplaySize(40, 230);

//Temp ghost jump spots

//platforms
obj.physics.add.collider(player, platform);
obj.physics.add.collider(player, platform_1);
//obj.physics.add.collider(player, platform3);

//Temp ghost jumps
//obj.physics.add.collider(player, ghostJumpSpot);

//Temp buttons
obj.physics.add.collider(player, tempButtonP1);
obj.physics.add.collider(player, tempButtonP2);


  //Temp walls 
  obj.physics.add.collider(player, tempWall);

}