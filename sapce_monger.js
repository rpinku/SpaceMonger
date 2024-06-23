const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#000000',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let player;
let cursors;
let gold;
let goldText;
let enemies;
let score = 0;
let scoreText;
let level = 1;
let levelText;
let lives = 3;
let livesText;
let invulnerable = false; // Invulnerability flag
let invulnerabilityDuration = 2000; // 2 seconds of invulnerability
let lastHitTime = 0;
let enemySpeed = 100; // Initial enemy speed
let audioContext;
let gainNode;
let oscillator;
let countdownText;
let countdownValue = 5;
let gameOverText;
let pressAnyKeyText;

function preload() {
    // No assets to preload, we'll draw shapes directly
}

function drawRocket(scene) {
    let graphics = scene.add.graphics({ fillStyle: { color: 0x0000ff } });

    // Main rocket body - scaled to fit within 50x50
    graphics.fillTriangle(25, 0, 45, 50, 5, 50);

    // Left fin
    graphics.fillTriangle(5, 50, 15, 50, 0, 60);

    // Right fin
    graphics.fillTriangle(45, 50, 35, 50, 50, 60);

    let rocketTexture = graphics.generateTexture('rocket', 50, 60);
    graphics.destroy();

    let rocket = scene.add.sprite(400, 300, 'rocket');
    scene.physics.add.existing(rocket);
    rocket.body.setCollideWorldBounds(true);
    rocket.body.setSize(50, 60, false);

    return rocket;
}

function drawSpider(scene, x, y) {
    let graphics = scene.add.graphics();
    graphics.fillStyle(0xff0000, 1);

    // Main spider body - scaled to fit within 50x50
    graphics.fillEllipse(25, 25, 20, 12.5);

    // Spider legs - scaled to fit within 50x50
    for (let i = -1; i <= 1; i += 2) {
        graphics.lineStyle(2, 0xff0000, 1);

        graphics.beginPath();
        graphics.moveTo(5, 25);
        graphics.lineTo(0, 25 + 10 * i);
        graphics.lineTo(0, 25 + 15 * i);
        graphics.strokePath();

        graphics.beginPath();
        graphics.moveTo(45, 25);
        graphics.lineTo(50, 25 + 10 * i);
        graphics.lineTo(50, 25 + 15 * i);
        graphics.strokePath();
    }

    let spiderTexture = graphics.generateTexture('spider', 50, 50);
    graphics.destroy();

    let spider = scene.add.sprite(x, y, 'spider');
    scene.physics.add.existing(spider);
    spider.body.setCollideWorldBounds(true);
    spider.body.setSize(50, 50, false);

    return spider;
}

function create() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);

    player = drawRocket(this);

    // Set up input keys
    cursors = this.input.keyboard.createCursorKeys();

    // Draw a single gold coin with a $ sign
    let x = Phaser.Math.Between(0, 800);
    let y = 0; // Start at the top
    gold = this.add.circle(x, y, 25, 0xffff00);
    this.physics.add.existing(gold);
    gold.body.setCircle(25);
    gold.body.setVelocityY(50); // Set initial falling speed

    goldText = this.add.text(x, y, '$', { fontSize: '32px', fill: '#000000' });
    goldText.setOrigin(0.5);

    // Draw enemies as spaceship spiders
    enemies = this.physics.add.group();
    let enemy = drawSpider(this, Phaser.Math.Between(0, 800), 0);
    enemy.body.setVelocityY(enemySpeed);
    enemies.add(enemy);

    // Set up score and level text
    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#ffffff' });
    levelText = this.add.text(16, 48, 'Level: 1', { fontSize: '32px', fill: '#ffffff' });
    livesText = this.add.text(16, 80, 'Lives: 3', { fontSize: '32px', fill: '#ffffff' });

    // Set up collisions
    this.physics.add.overlap(player, gold, collectGold, null, this);
    this.physics.add.overlap(player, enemies, hitEnemy, null, this); // Use overlap instead of collider
}

function update() {
    // Player movement
    player.body.setVelocity(0);
    if (cursors.left.isDown) {
        player.body.setVelocityX(-160);
    } else if (cursors.right.isDown) {
        player.body.setVelocityX(160);
    }
    if (cursors.up.isDown) {
        player.body.setVelocityY(-160);
    } else if (cursors.down.isDown) {
        player.body.setVelocityY(160);
    }

    // Update enemy movement
    enemies.getChildren().forEach(enemy => {
        enemy.body.setVelocityY(enemySpeed);
        if (enemy.y > 600) {
            enemy.y = 0;
            enemy.x = Phaser.Math.Between(0, 800);
        }
    });

    // Update gold movement
    if (gold.y > 600) {
        gold.y = 0;
        gold.x = Phaser.Math.Between(0, 800);
    }

    // Move gold text
    goldText.x = gold.x;
    goldText.y = gold.y;

    // Handle invulnerability
    if (invulnerable && this.time.now > lastHitTime + invulnerabilityDuration) {
        invulnerable = false;
        player.setAlpha(1); // Restore player opacity
    }
}

function playTone(frequency, duration) {
    oscillator = audioContext.createOscillator();
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.connect(gainNode);
    oscillator.start();

    setTimeout(() => {
        oscillator.stop();
    }, duration);
}

function playCollectSound() {
    playTone(440, 100); // A4 tone for 100ms
}

function playHitSound() {
    playTone(220, 100); // A3 tone for 100ms
}

function collectGold(player, gold) {
    // Respawn gold at the top with a random x-coordinate
    gold.y = 0;
    gold.x = Phaser.Math.Between(0, 800);
    score += 10;
    scoreText.setText('Score: ' + score);
    playCollectSound(); // Play collect sound
    if (score % 100 === 0) {
        level += 1;
        levelText.setText('Level: ' + level);
        nextLevel(this);
    }
}

function nextLevel(scene) {
    if (level <= 5) {
        enemySpeed += 20; // Increase enemy speed
    } else if (level <= 9) {
        let enemy = drawSpider(scene, Phaser.Math.Between(0, 800), 0);
        enemy.body.setVelocityY(enemySpeed);
        enemies.add(enemy);
    } else if (level == 10) {
        // Create boss enemy
        let bossSize = 200; // 4 times the size (50 * 4)
        let bossSpeed = enemySpeed; // Speed same as in level 5
        let boss = drawSpider(scene, Phaser.Math.Between(0, 800), 0);
        boss.setScale(4); // Make boss 4 times larger
        boss.body.setVelocityY(bossSpeed);
        enemies.add(boss);
    }

    // Update the speed of existing enemies
    enemies.getChildren().forEach(enemy => {
        enemy.body.setVelocityY(enemySpeed);
    });
}

function hitEnemy(player, enemy) {
    if (!invulnerable) {
        lives -= 1;
        livesText.setText('Lives: ' + lives);
        lastHitTime = this.time.now; // Record the time of the hit
        invulnerable = true;
        player.setAlpha(0.5); // Make player semi-transparent to indicate invulnerability
        playHitSound(); // Play hit sound

        if (lives > 0) {
            // Reset player position
            player.x = 400;
            player.y = 300;
        } else {
            this.physics.pause();
            player.setAlpha(0); // Make player invisible to indicate game over
            gameOverText = this.add.text(400, 300, 'Game Over', { fontSize: '64px', fill: '#ff0000' }).setOrigin(0.5);
            startCountdown(this); // Start countdown for restart
        }
    }
}

function startCountdown(scene) {
    countdownValue = 5;
    countdownText = scene.add.text(400, 350, countdownValue, { fontSize: '64px', fill: '#ffffff' }).setOrigin(0.5);
    scene.time.addEvent({
        delay: 1000,
        callback: updateCountdown,
        callbackScope: scene,
        repeat: countdownValue - 1
    });
}

function updateCountdown() {
    countdownValue -= 1;
    countdownText.setText(countdownValue);
    if (countdownValue === 0) {
        pressAnyKeyText = this.add.text(400, 400, 'Press any key to play again', { fontSize: '32px', fill: '#ffffff' }).setOrigin(0.5);
        this.input.keyboard.on('keydown', resetGame, this);
    }
}

function resetGame() {
    score = 0;
    level = 1;
    lives = 3;
    invulnerable = false;
    enemySpeed = 100;

    scoreText.setText('Score: ' + score);
    levelText.setText('Level: ' + level);
    livesText.setText('Lives: ' + lives);

    this.input.keyboard.off('keydown', resetGame, this);
    countdownText.destroy();
    gameOverText.destroy();
    pressAnyKeyText.destroy();

    player.setAlpha(1);
    player.x = 400;
    player.y = 300;

    enemies.clear(true, true);
    let enemy = drawSpider(this, Phaser.Math.Between(0, 800), 0);
    enemy.body.setVelocityY(enemySpeed);
    enemies.add(enemy);

    this.physics.resume();
}
