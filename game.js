// Constants
const CANVAS = {
    WIDTH: 600,
    HEIGHT: 450,
    TOP_MARGIN: 50
};

let COLORS = ['#ff0000', '#00ff00', '#0000ff', '#ffff00'];

const BLOCK = {
    ROWS: 5,
    COLS: 8,
    HEIGHT: 30,
    get WIDTH() { return CANVAS.WIDTH / this.COLS; }
};

const BALL = {
    RADIUS: 8,
    SPEED: 7
};

const PADDLE = {
    HEIGHT: 15,
    WIDTH: 100
};

const ITEM = {
    SIZE: 20,
    SPEED: 3,
    DROP_CHANCE: 0.3,
    EFFECT_DURATION: 15000
};

const ITEM_TYPES = {
    PENETRATION: {
        color: '#ff00ff',
        name: '貫通弾',
        description: 'ブロックを貫通します'
    },
    SLOW_MOTION: {
        color: '#00ffff',
        name: 'スロー',
        description: 'バー付近でボール速度が0.7倍になります'
    },
    RAINBOW: {
        color: '#ffffff',
        name: 'レインボー',
        description: 'どの色のボールでも跳ね返せます'
    }
};

// Ball class
class Ball {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.dx = 0;
        this.dy = 0;
        this.color = COLORS[0];
        this.speed = BALL.SPEED;
        this.launched = false;
    }

    launch() {
        this.launched = true;
        this.speed = BALL.SPEED;
        this.dx = this.speed;
        this.dy = -this.speed;
    }

    move(speedMultiplier = 1) {
        if (!this.launched) return;
        
        const currentSpeed = this.speed * speedMultiplier;
        const ratio = currentSpeed / Math.sqrt(this.dx * this.dx + this.dy * this.dy);
        this.x += this.dx * ratio;
        this.y += this.dy * ratio;
    }

    bounceHorizontal() {
        this.dx *= -1;
    }

    bounceVertical() {
        this.dy *= -1;
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    reset(paddleX) {
        this.setPosition(paddleX + PADDLE.WIDTH / 2, CANVAS.HEIGHT - PADDLE.HEIGHT - BALL.RADIUS);
        this.dx = 0;
        this.dy = 0;
        this.launched = false;
        this.color = COLORS[0];
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, BALL.RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
}

// Paddle class
class Paddle {
    constructor() {
        this.x = CANVAS.WIDTH / 2 - PADDLE.WIDTH / 2;
        this.y = CANVAS.HEIGHT - PADDLE.HEIGHT - 5;
        this.color = COLORS[0];
        this.colorIndex = 0;
        this.isRainbow = false;
    }

    move(direction, amount) {
        const newX = this.x + direction * amount;
        if (newX >= 0 && newX <= CANVAS.WIDTH - PADDLE.WIDTH) {
            this.x = newX;
        }
    }

    nextColor() {
        if (!this.isRainbow) {
            this.colorIndex = (this.colorIndex + 1) % COLORS.length;
            this.color = COLORS[this.colorIndex];
        }
    }

    draw(ctx) {
        if (this.isRainbow) {
            const gradient = ctx.createLinearGradient(
                this.x, this.y,
                this.x + PADDLE.WIDTH, this.y
            );
            gradient.addColorStop(0, 'red');
            gradient.addColorStop(0.17, 'orange');
            gradient.addColorStop(0.33, 'yellow');
            gradient.addColorStop(0.5, 'green');
            gradient.addColorStop(0.67, 'blue');
            gradient.addColorStop(0.83, 'indigo');
            gradient.addColorStop(1, 'violet');
            ctx.fillStyle = gradient;
        } else {
            ctx.fillStyle = this.color;
        }
        ctx.fillRect(this.x, this.y, PADDLE.WIDTH, PADDLE.HEIGHT);
    }
}

// Block class
class Block {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.active = true;
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, BLOCK.WIDTH - 2, BLOCK.HEIGHT - 2);
    }
}

// Item class
class Item {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.color = ITEM_TYPES[type].color;
    }

    move() {
        this.y += ITEM.SPEED;
    }

    isOutOfBounds() {
        return this.y > CANVAS.HEIGHT;
    }

    collidesWith(paddle) {
        return this.y + ITEM.SIZE > paddle.y &&
               this.x + ITEM.SIZE > paddle.x &&
               this.x < paddle.x + PADDLE.WIDTH;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, ITEM.SIZE, ITEM.SIZE);
    }

    static createRandom(x, y) {
        if (Math.random() >= ITEM.DROP_CHANCE) return null;
        
        const rand = Math.random();
        let type;
        if (rand < 0.33) {
            type = 'PENETRATION';
        } else if (rand < 0.66) {
            type = 'SLOW_MOTION';
        } else {
            type = 'RAINBOW';
        }
        
        return new Item(x, y, type);
    }
}

// Sound Manager
class SoundManager {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.sounds = {};
        this.initializeSounds();
    }

    async initializeSounds() {
        await this.createSound('hit', [261.63, 329.63], 0.1);
        await this.createSound('paddle', [440, 493.88], 0.1);
        await this.createSound('item', [523.25, 659.25], 0.2);
        await this.createSound('gameover', [196, 147, 98], 0.3);
        await this.createSound('clear', [523.25, 659.25, 783.99], 0.5);
    }

    async createSound(name, frequencies, duration) {
        const oscillators = frequencies.map(freq => {
            const oscillator = this.audioContext.createOscillator();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
            return oscillator;
        });

        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillators.forEach(osc => osc.connect(gainNode));
        gainNode.connect(this.audioContext.destination);

        this.sounds[name] = {
            play: () => {
                oscillators.forEach(osc => {
                    osc.start();
                    osc.stop(this.audioContext.currentTime + duration);
                });
            }
        };
    }

    play(soundName) {
        if (this.sounds[soundName]) {
            const newSound = { ...this.sounds[soundName] };
            this.createSound(soundName, [440], 0.1).then(() => {
                newSound.play();
            });
        }
    }
}

// Settings Manager
class SettingsManager {
    constructor(game) {
        this.game = game;
        this.setupEventListeners();
        this.updateDisplayValues();
    }

    setupEventListeners() {
        document.getElementById('ballSpeed').addEventListener('input', (e) => {
            BALL.SPEED = parseInt(e.target.value);
            this.updateDisplayValues();
        });

        document.getElementById('paddleWidth').addEventListener('input', (e) => {
            PADDLE.WIDTH = parseInt(e.target.value);
            this.updateDisplayValues();
        });

        document.getElementById('colorCount').addEventListener('input', (e) => {
            const count = parseInt(e.target.value);
            COLORS = COLORS.slice(0, count);
            this.updateDisplayValues();
            this.game.restart();
        });
    }

    updateDisplayValues() {
        document.getElementById('ballSpeedValue').textContent = BALL.SPEED;
        document.getElementById('paddleWidthValue').textContent = PADDLE.WIDTH;
        document.getElementById('colorCountValue').textContent = COLORS.length;
    }
}

// Effect Manager
class EffectManager {
    constructor() {
        this.effects = {
            penetration: { active: false, endTime: 0 },
            slowMotion: { active: false, endTime: 0 },
            rainbow: { active: false, endTime: 0 }
        };
        this.paddle = null;
    }

    setPaddle(paddle) {
        this.paddle = paddle;
    }

    applyEffect(itemType) {
        const currentTime = Date.now();
        const effectName = itemType.toLowerCase();
        if (this.effects[effectName]) {
            this.effects[effectName].active = true;
            this.effects[effectName].endTime = currentTime + ITEM.EFFECT_DURATION;

            if (effectName === 'rainbow' && this.paddle) {
                this.paddle.isRainbow = true;
            }
        }
    }

    update() {
        const currentTime = Date.now();
        Object.keys(this.effects).forEach(effect => {
            if (this.effects[effect].active && currentTime > this.effects[effect].endTime) {
                this.effects[effect].active = false;
                if (effect === 'rainbow' && this.paddle) {
                    this.paddle.isRainbow = false;
                }
            }
        });
    }

    isActive(effectName) {
        return this.effects[effectName]?.active || false;
    }

    reset() {
        Object.keys(this.effects).forEach(effect => {
            this.effects[effect].active = false;
            this.effects[effect].endTime = 0;
        });
        if (this.paddle) {
            this.paddle.isRainbow = false;
        }
    }

    getActiveEffects() {
        return Object.entries(this.effects)
            .filter(([_, effect]) => effect.active)
            .map(([name, _]) => ITEM_TYPES[name.toUpperCase()].name);
    }
}

// UI Manager
class UIManager {
    constructor(ctx) {
        this.ctx = ctx;
    }

    drawActiveEffects(activeEffects) {
        if (activeEffects.length > 0) {
            this.ctx.fillStyle = 'white';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`アクティブ効果: ${activeEffects.join(', ')}`, 10, 30);
        }
    }
}

// Collision Manager
class CollisionManager {
    static checkBallWallCollision(ball, canvas) {
        let collided = false;
        if (ball.x + BALL.RADIUS > canvas.width || ball.x - BALL.RADIUS < 0) {
            ball.bounceHorizontal();
            collided = true;
        }
        if (ball.y - BALL.RADIUS < CANVAS.TOP_MARGIN) {
            ball.dy = Math.abs(ball.dy);
            collided = true;
        }
        return collided;
    }

    static checkBallPaddleCollision(ball, paddle, effectManager) {
        if (ball.y + BALL.RADIUS > paddle.y && 
            ball.x > paddle.x && 
            ball.x < paddle.x + PADDLE.WIDTH) {
            if (ball.color === paddle.color || effectManager.isActive('rainbow')) {
                ball.dy = -Math.abs(ball.dy);
                let hitPoint = (ball.x - paddle.x) / PADDLE.WIDTH;
                ball.dx = ball.speed * (hitPoint - 0.5) * 2;
                return true;
            }
        }
        return false;
    }

    static checkBallBlockCollision(ball, block, effectManager) {
        if (!block.active) return false;

        if (ball.x > block.x && 
            ball.x < block.x + BLOCK.WIDTH &&
            ball.y > block.y && 
            ball.y < block.y + BLOCK.HEIGHT) {
            
            if (!effectManager.isActive('penetration')) {
                ball.dy *= -1;
            }
            
            ball.color = block.color;
            block.active = false;
            return true;
        }
        return false;
    }
}

// Game class
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        
        this.ball = new Ball(CANVAS.WIDTH / 2, CANVAS.HEIGHT - 30);
        this.paddle = new Paddle();
        this.blocks = this.initializeBlocks();
        this.items = [];
        
        this.effectManager = new EffectManager();
        this.effectManager.setPaddle(this.paddle);
        this.uiManager = new UIManager(this.ctx);
        this.soundManager = new SoundManager();
        this.settingsManager = new SettingsManager(this);
        
        this.gameState = {
            isGameOver: false,
            isCleared: false,
            isPaused: false
        };
        
        this.keys = {
            a: false,
            d: false,
            space: false,
            k: false
        };
        
        this.setupEventListeners();
        this.gameLoop();
    }

    setupCanvas() {
        this.canvas.width = CANVAS.WIDTH;
        this.canvas.height = CANVAS.HEIGHT;
    }

    initializeBlocks() {
        const blocks = [];
        for (let row = 0; row < BLOCK.ROWS; row++) {
            for (let col = 0; col < BLOCK.COLS; col++) {
                blocks.push(new Block(
                    col * BLOCK.WIDTH,
                    row * BLOCK.HEIGHT + CANVAS.TOP_MARGIN
                ));
            }
        }
        return blocks;
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'a') this.keys.a = true;
            if (e.key.toLowerCase() === 'd') this.keys.d = true;
            if (e.key === ' ') {
                if (this.gameState.isGameOver || this.gameState.isCleared) {
                    this.restart();
                } else {
                    this.keys.space = true;
                }
            }
            if (e.key.toLowerCase() === 'k' && !this.effectManager.isActive('rainbow')) {
                if (!this.keys.k) {
                    this.paddle.nextColor();
                }
                this.keys.k = true;
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.key.toLowerCase() === 'a') this.keys.a = false;
            if (e.key.toLowerCase() === 'd') this.keys.d = false;
            if (e.key === ' ') this.keys.space = false;
            if (e.key.toLowerCase() === 'k') this.keys.k = false;
        });
    }

    update() {
        if (this.gameState.isGameOver || this.gameState.isCleared) return;

        this.effectManager.update();
        this.updatePaddle();
        this.updateBall();
        this.updateItems();
        this.checkCollisions();
    }

    updatePaddle() {
        if (this.keys.a) this.paddle.move(-1, 8);
        if (this.keys.d) this.paddle.move(1, 8);
    }

    updateBall() {
        if (this.keys.space && !this.ball.launched) {
            this.ball.launch();
        }

        if (!this.ball.launched) {
            this.ball.setPosition(
                this.paddle.x + PADDLE.WIDTH / 2,
                this.paddle.y - BALL.RADIUS
            );
            return;
        }

        let speedMultiplier = 1;
        if (this.effectManager.isActive('slowMotion') &&
            this.ball.y + BALL.RADIUS > this.paddle.y - 50) {
            speedMultiplier = 0.7;
        }

        // ボールのスピードを更新
        this.ball.speed = BALL.SPEED;
        this.ball.move(speedMultiplier);
    }

    updateItems() {
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.move();
            
            if (item.collidesWith(this.paddle)) {
                this.effectManager.applyEffect(item.type);
                this.items.splice(i, 1);
                this.soundManager.play('item');
                continue;
            }

            if (item.isOutOfBounds()) {
                this.items.splice(i, 1);
            }
        }
    }

    checkCollisions() {
        // ボールと壁の衝突
        if (CollisionManager.checkBallWallCollision(this.ball, this.canvas)) {
            this.soundManager.play('hit');
        }

        // ボールが下に落ちた場合
        if (this.ball.y + BALL.RADIUS > CANVAS.HEIGHT) {
            this.gameState.isGameOver = true;
            this.soundManager.play('gameover');
            return;
        }

        // ボールとパドルの衝突
        if (CollisionManager.checkBallPaddleCollision(
            this.ball,
            this.paddle,
            this.effectManager
        )) {
            this.soundManager.play('paddle');
        }

        // ボールとブロックの衝突とクリア判定
        let activeBlocks = 0;
        this.blocks.forEach(block => {
            if (block.active) activeBlocks++;
            if (CollisionManager.checkBallBlockCollision(
                this.ball,
                block,
                this.effectManager
            )) {
                this.soundManager.play('hit');
                const newItem = Item.createRandom(
                    block.x + BLOCK.WIDTH / 2,
                    block.y + BLOCK.HEIGHT
                );
                if (newItem) {
                    this.items.push(newItem);
                }
            }
        });

        // クリア判定
        if (activeBlocks === 0 && !this.gameState.isCleared) {
            this.gameState.isCleared = true;
            this.soundManager.play('clear');
        }
    }

    draw() {
        // 画面クリア
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);

        // ゲーム要素の描画
        this.blocks.forEach(block => block.draw(this.ctx));
        this.items.forEach(item => item.draw(this.ctx));
        this.paddle.draw(this.ctx);
        this.ball.draw(this.ctx);

        // アクティブな効果の表示
        this.uiManager.drawActiveEffects(this.effectManager.getActiveEffects());

        // オーバーレイ表示
        if (this.gameState.isGameOver || this.gameState.isCleared) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);
            
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            
            if (this.gameState.isGameOver) {
                this.ctx.fillStyle = 'white';
                this.ctx.fillText('GAME OVER', CANVAS.WIDTH / 2, CANVAS.HEIGHT / 2);
            } else {
                this.ctx.fillStyle = 'gold';
                this.ctx.fillText('STAGE CLEAR!', CANVAS.WIDTH / 2, CANVAS.HEIGHT / 2);
            }
            
            this.ctx.font = '24px Arial';
            this.ctx.fillText('Press SPACE to restart', CANVAS.WIDTH / 2, CANVAS.HEIGHT / 2 + 40);
            this.ctx.textAlign = 'left';
        }
    }

    restart() {
        this.gameState.isGameOver = false;
        this.gameState.isCleared = false;
        this.blocks = this.initializeBlocks();
        this.items = [];
        this.effectManager.reset();
        this.ball.reset(this.paddle.x);
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// ゲーム開始
new Game();