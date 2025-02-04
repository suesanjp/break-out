import { COLORS, BALL, PADDLE, BLOCK, ITEM, ITEM_TYPES, CANVAS } from './constants.js';

export class Ball {
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
        this.dx = this.speed;
        this.dy = -this.speed;
    }

    move(speedMultiplier = 1) {
        if (!this.launched) return;
        
        this.x += this.dx * speedMultiplier;
        this.y += this.dy * speedMultiplier;
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

export class Paddle {
    constructor() {
        this.x = CANVAS.WIDTH / 2 - PADDLE.WIDTH / 2;
        this.y = CANVAS.HEIGHT - PADDLE.HEIGHT - 5;
        this.color = COLORS[0];
        this.colorIndex = 0;
        this.rainbowOffset = 0;
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

    updateRainbow() {
        if (this.isRainbow) {
            this.rainbowOffset = (this.rainbowOffset + 2) % 360;
            this.color = `hsl(${this.rainbowOffset}, 100%, 50%)`;
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, PADDLE.WIDTH, PADDLE.HEIGHT);
    }
}

export class Block {
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

export class Item {
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