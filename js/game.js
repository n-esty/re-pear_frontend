const socket = io('http://localhost:3000/game');
var ghostPos = [];
socket.emit('join room', "hello");
socket.on('ghosts', function(ghosts){
    for(i=0;i<ghosts.length;i++){
        if(ghosts[i][1]){
            var tempCoords = JSON.parse(ghosts[i][1]);
            ghostPos[ghosts[i][0]]=[];
            ghostPos[ghosts[i][0]].x = tempCoords[0];
            ghostPos[ghosts[i][0]].y = tempCoords[1];
        }
    }
});

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
 
var game = new Phaser.Game(config);
 
var map;
var player;
var cursors;
var groundLayer, coinLayer;
var text;
var ghost = [];
 
function preload() {
 
}
 
function create() {
    // // load the map 
    // map = this.make.tilemap({key: 'map'});

    // // tiles for the ground layer
    // var groundTiles = map.addTilesetImage('tiles');
    // // create the ground layer
    // groundLayer = map.createDynamicLayer('World', groundTiles, 0, 0);
    // // the player will collide with this layer
    // groundLayer.setCollisionByExclusion([-1]);
    
    // set the boundaries of our game world
    
    this.physics.world.bounds.width = 800;
    this.physics.world.bounds.height = 600;

    player = this.physics.add.sprite(200, 200, 'player'); 
    player.setBounce(0.2); // our player will bounce from items
    player.setCollideWorldBounds(true); // don't go out of the map
    cursors = this.input.keyboard.createCursorKeys();
    keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
}

var lastReset = 0;
var amountOfGhosts = 0;
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
            console.log('reset')
            ghost[amountOfGhosts] = this.add.graphics();
            ghost[amountOfGhosts].fillStyle(0xffffff, 0.5);
            ghost[amountOfGhosts].fillRect(0, 0, 40, 40);
            amountOfGhosts++;
            socket.emit('reset', []);
            lastReset = Date.now();
        }
        // console.log(player.x + " - " + player.y);
        socket.emit('player move', JSON.stringify([player.x,player.y]));

        //Controlling ghosts
        for(i=0;i<amountOfGhosts;i++){
            if(ghostPos[i]){
                this.physics.arcade.moveToXY(ghost[i], ghostPos[i].x, ghostPos[i].y, 60, 50)
                // ghost[i].x = ghostPos[i].x;
                // ghost[i].y = ghostPos[i].y;
            }
        }

}