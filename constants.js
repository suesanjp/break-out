export const CANVAS = {
    WIDTH: 800,
    HEIGHT: 600,
    TOP_MARGIN: 50
};

export const COLORS = ['#ff0000', '#00ff00', '#0000ff', '#ffff00'];

export const BLOCK = {
    ROWS: 5,
    COLS: 8,
    HEIGHT: 30,
    WIDTH: CANVAS.WIDTH / 8
};

export const BALL = {
    RADIUS: 8,
    SPEED: 7
};

export const PADDLE = {
    HEIGHT: 15,
    WIDTH: 100
};

export const ITEM = {
    SIZE: 20,
    SPEED: 3,
    DROP_CHANCE: 0.3,
    EFFECT_DURATION: 15000
};

export const ITEM_TYPES = {
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