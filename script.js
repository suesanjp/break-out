import { CANVAS, BLOCK, COLORS } from './constants.js';
import { Ball, Paddle, Block, Item } from './entities.js';
import { EffectManager, UIManager, CollisionManager } from './managers.js';

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
        this.uiManager = new UIManager(this.ctx);
        
        this.gameState = {
            isGameOver: false,
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
                if (this.gameState.isGameOver) {
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
        if (this.gameState.isGameOver) return;

        this.effectManager.update();
        this.updatePaddle();
        this.updateBall();
        this.updateItems();
        this.checkCollisions();
    }

    updatePaddle() {
        if (this.keys.a) this.paddle.move(-1, 8);
        if (this.keys.d) this.paddle.move(1, 8);
        if (this.effectManager.isActive('rainbow')) {
            this.paddle.updateRainbow();
        }
    }

    updateBall() {
        if (this.keys.space && !this.ball.launched) {
            this.ball.launch();
        }

        if (!this.ball.launched) {
            this.ball.setPosition(
                this.paddle.x + this.paddle.width / 2,
                this.paddle.y - this.ball.radius
            );
            return;
        }

        let speedMultiplier = 1;
        if (this.effectManager.isActive('slowMotion') && 
            this.ball.y + this.ball.radius > this.paddle.y - 50) {
            speedMultiplier = 0.7;
        }

        this.ball.move(speedMultiplier);
    }

    updateItems() {
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.move();
            
            if (item.collidesWith(this.paddle)) {
                this.effectManager.applyEffect(item.type);
                this.items.splice(i, 1);
                continue;
            }

            if (item.isOutOfBounds()) {
                this.items.splice(i, 1);
            }
        }
    }

    checkCollisions() {
        // ボールと壁の衝突
        CollisionManager.checkBallWallCollision(this.ball, this.canvas);

        // ボールが下に落ちた場合
        if (this.ball.y + this.ball.radius > CANVAS.HEIGHT) {
            this.gameState.isGameOver = true;
            return;
        }

        // ボールとパドルの衝突
        CollisionManager.checkBallPaddleCollision(
            this.ball,
            this.paddle,
            this.effectManager
        );

        // ボールとブロックの衝突
        this.blocks.forEach(block => {
            if (CollisionManager.checkBallBlockCollision(
                this.ball,
                block,
                this.effectManager
            )) {
                const newItem = Item.createRandom(
                    block.x + BLOCK.WIDTH / 2,
                    block.y + BLOCK.HEIGHT
                );
                if (newItem) {
                    this.items.push(newItem);
                }
            }
        });
    }

    draw() {
        // 画面クリア
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);

        // アイテムの説明
        this.uiManager.drawItemDescriptions();

        // ゲーム要素の描画
        this.blocks.forEach(block => block.draw(this.ctx));
        this.items.forEach(item => item.draw(this.ctx));
        this.paddle.draw(this.ctx);
        this.ball.draw(this.ctx);

        // アクティブな効果の表示
        this.uiManager.drawActiveEffects(this.effectManager.getActiveEffects());

        // GAME OVER の表示
        if (this.gameState.isGameOver) {
            this.uiManager.drawGameOver();
        }
    }

    restart() {
        this.gameState.isGameOver = false;
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