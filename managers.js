import { ITEM, ITEM_TYPES } from './constants.js';

export class EffectManager {
    constructor() {
        this.effects = {
            penetration: { active: false, endTime: 0 },
            slowMotion: { active: false, endTime: 0 },
            rainbow: { active: false, endTime: 0 }
        };
    }

    applyEffect(itemType) {
        const currentTime = Date.now();
        const effectName = itemType.toLowerCase();
        if (this.effects[effectName]) {
            this.effects[effectName].active = true;
            this.effects[effectName].endTime = currentTime + ITEM.EFFECT_DURATION;
        }
    }

    update() {
        const currentTime = Date.now();
        Object.keys(this.effects).forEach(effect => {
            if (this.effects[effect].active && currentTime > this.effects[effect].endTime) {
                this.effects[effect].active = false;
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
    }

    getActiveEffects() {
        return Object.entries(this.effects)
            .filter(([_, effect]) => effect.active)
            .map(([name, _]) => ITEM_TYPES[name.toUpperCase()].name);
    }
}

export class UIManager {
    constructor(ctx) {
        this.ctx = ctx;
    }

    drawItemDescriptions() {
        this.ctx.font = '14px Arial';
        let y = 20;
        Object.entries(ITEM_TYPES).forEach(([_, item]) => {
            this.ctx.fillStyle = item.color;
            this.ctx.fillText(`■ ${item.name}: ${item.description}`, 10, y);
            y += 20;
        });
    }

    drawActiveEffects(activeEffects) {
        if (activeEffects.length > 0) {
            this.ctx.fillStyle = 'white';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`アクティブ効果: ${activeEffects.join(', ')}`, 10, 80);
        }
    }

    drawGameOver() {
        this.ctx.fillStyle = 'white';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Press SPACE to restart', this.ctx.canvas.width / 2, this.ctx.canvas.height / 2 + 40);
        this.ctx.textAlign = 'left';
    }
}

export class CollisionManager {
    static checkBallWallCollision(ball, canvas) {
        if (ball.x + ITEM.RADIUS > canvas.width || ball.x - ITEM.RADIUS < 0) {
            ball.bounceHorizontal();
        }
        if (ball.y - ITEM.RADIUS < canvas.TOP_MARGIN) {
            ball.dy = Math.abs(ball.dy); // 上部制限
        }
    }

    static checkBallPaddleCollision(ball, paddle, effectManager) {
        if (ball.y + ITEM.RADIUS > paddle.y && 
            ball.x > paddle.x && 
            ball.x < paddle.x + paddle.width) {
            if (ball.color === paddle.color || effectManager.isActive('rainbow')) {
                ball.dy = -Math.abs(ball.dy);
                // 跳ね返り角度の調整
                let hitPoint = (ball.x - paddle.x) / paddle.width;
                ball.dx = ball.speed * (hitPoint - 0.5) * 2;
            }
        }
    }

    static checkBallBlockCollision(ball, block, effectManager) {
        if (!block.active) return false;

        if (ball.x > block.x && 
            ball.x < block.x + block.width &&
            ball.y > block.y && 
            ball.y < block.y + block.height) {
            
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