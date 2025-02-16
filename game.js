// game.js

// Online sound effect URLs
const soundUrls = {
    backgroundMusic: 'https://example.com/background-music.mp3',
    step: 'https://www.soundjay.com/footsteps/sounds/footsteps-3.mp3',
    gunshot: 'gunshot.mp3',
    noAmmo: 'no-ammo.mp3',
    warning: 'warning.mp3',
    enemyNear: 'enemy-near.mp3',
    startGame: 'start-game.mp3',
    parachute: 'parachute.mp3',
    vehicle: 'vehicle.mp3',
    healthKit: 'health-kit.mp3',
    airdrop: 'airdrop.mp3',
};

// Initialize Howler.js sounds
const sounds = {};
for (const [key, url] of Object.entries(soundUrls)) {
    sounds[key] = new Howl({ src: [url], loop: key === 'backgroundMusic' });
}

// Game Variables
let player = { x: 5, y: 5, ammo: 10, health: 100, inVehicle: false };
let safeZone = { x: 10, y: 10, radius: 15 };
let enemies = [
    { x: 12, y: 8 },
    { x: 3, y: 7 },
];
const gridSize = 20;

// Announce Function for screen reader users
function announce(message) {
    const speech = new SpeechSynthesisUtterance(message);
    speech.rate = 1.1;
    window.speechSynthesis.speak(speech);
}

// Movement Logic
function movePlayer(dx, dy) {
    player.x += dx;
    player.y += dy;
    sounds.step.play();
    announce(`Player moved to position ${player.x}, ${player.y}`);
    checkSafeZone();
    checkEnemies();
}

// Shooting Logic
function shoot() {
    if (player.ammo > 0) {
        sounds.gunshot.play();
        player.ammo--;
        announce(`Fired a shot. Ammo remaining: ${player.ammo}`);
        enemies = enemies.filter((enemy) => {
            const distance = Math.abs(player.x - enemy.x) + Math.abs(player.y - enemy.y);
            if (distance <= 1) {
                announce('Enemy hit!');
                return false;
            }
            return true;
        });
        if (enemies.length === 0) {
            announce('All enemies defeated. You win!');
        }
    } else {
        sounds.noAmmo.play();
        announce('Out of ammo!');
    }
}

// Reload Ammo Logic
function reload() {
    player.ammo = 10;
    announce('Ammo reloaded. You now have 10 bullets.');
}

// Safe Zone Logic
function checkSafeZone() {
    const distance = Math.sqrt(
        Math.pow(player.x - safeZone.x, 2) + Math.pow(player.y - safeZone.y, 2)
    );
    if (distance > safeZone.radius) {
        sounds.warning.play();
        announce('Warning: Move to the safe zone!');
    } else {
        announce('You are inside the safe zone.');
    }
}

// Enemy Proximity Logic
function checkEnemies() {
    enemies.forEach((enemy) => {
        const distance = Math.abs(player.x - enemy.x) + Math.abs(player.y - enemy.y);
        if (distance <= 2) {
            sounds.enemyNear.play();
            announce('Enemy nearby!');
        }
    });
}

// Parachute Landing
function parachuteLanding() {
    player.x = Math.floor(Math.random() * gridSize);
    player.y = Math.floor(Math.random() * gridSize);
    sounds.parachute.play();
    announce('Parachute landing complete. You are now on the ground.');
}

// Use Health Kit
function useHealthKit() {
    if (player.health < 100) {
        player.health = Math.min(100, player.health + 30);
        sounds.healthKit.play();
        announce(`Health restored to ${player.health}.`);
    } else {
        announce('Health is already full.');
    }
}

// Vehicle Entry/Exit
function toggleVehicle() {
    player.inVehicle = !player.inVehicle;
    sounds.vehicle.play();
    announce(player.inVehicle ? 'Entered vehicle.' : 'Exited vehicle.');
}

// Weapon Switching
let currentWeapon = 'pistol';
const weapons = { 1: 'pistol', 2: 'shotgun', 3: 'sniper' };
function switchWeapon(weaponNum) {
    if (weapons[weaponNum]) {
        currentWeapon = weapons[weaponNum];
        announce(`Switched to ${currentWeapon}`);
    }
}

// Airdrop Supplies
function airdropSupply() {
    sounds.airdrop.play();
    announce('Airdrop incoming! Search for supplies.');
}

// Phaser.js Game Initialization
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    scene: { preload, create, update },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
};
const game = new Phaser.Game(config);

function preload() {
    this.load.image('player', 'player.png');
    this.load.image('enemy', 'enemy.png');
    this.load.image('safeZone', 'safe-zone.png');
}

function create() {
    this.player = this.add.sprite(player.x * 40, player.y * 40, 'player');
    this.enemies = enemies.map((enemy) =>
        this.add.sprite(enemy.x * 40, enemy.y * 40, 'enemy')
    );
    this.safeZone = this.add.circle(
        safeZone.x * 40,
        safeZone.y * 40,
        safeZone.radius * 40,
        0x00ff00,
        0.2
    );
    sounds.backgroundMusic.play();
    announce(
        'Game started. Use on-screen controls to move, shoot, parachute, toggle vehicle, heal, and switch weapons.'
    );
    sounds.startGame.play();

    // Touch Controls
    this.input.on('pointerdown', (pointer) => {
        const { x, y } = pointer;
        if (x < this.scale.width / 2 && y > this.scale.height * 0.75) {
            // Left half, bottom quarter: Move left
            movePlayer(-1, 0);
        } else if (x > this.scale.width / 2 && y > this.scale.height * 0.75) {
            // Right half, bottom quarter: Move right
            movePlayer(1, 0);
        } else if (y < this.scale.height * 0.25) {
            // Top quarter: Shoot
            shoot();
        } else if (y > this.scale.height * 0.25 && y < this.scale.height * 0.75) {
            // Middle area: Parachute
            parachuteLanding();
        }
    });


// Reload on double-tap
this.input.on('pointerup', (pointer, currentlyOver) => {
    if (pointer.getDuration() < 300) { // Check for a quick tap
        if (this.lastTap && pointer.downTime - this.lastTap < 400) { // Double-tap detected
            reload();
        }
        this.lastTap = pointer.downTime;
    }
});