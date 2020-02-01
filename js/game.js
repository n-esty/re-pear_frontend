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
 
}
 
function create() {
    // Setting world bounds manually
    this.physics.world.bounds.width = 800;
    this.physics.world.bounds.height = 600;

    // Create player
    player = this.physics.add.sprite(0, 0, 'player'); 
    player.setCollideWorldBounds(true); // don't go out of the map
    cursors = this.input.keyboard.createCursorKeys();
    keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
}

function update() {
        if (cursors.left.isDown) // if the left arrow key is down
        {
            player.body.setVelocityX(-200); // move left
        }
        else if (cursors.right.isDown) // if the right arrow key is down
        {
            player.body.setVelocityX(200); // move right
        }
        if ((cursors.space.isDown || cursors.up.isDown) && player.body.onFloor())
        {
            player.body.setVelocityY(-500); // jump up
        }
        if(keyA.isDown && Date.now()>lastReset+500){
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
        socket.emit('player move', JSON.stringify([player.x,player.y]));

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