// 游戏常量
const TOOTH_COUNT = 16;
const BRUSH_WIDTH = 40;
const BRUSH_HEIGHT = 60;
const ANGLE_THRESHOLD = 10; // 角度误差范围
const SCORE_PER_TOOTH = 10;
const MAX_SCORE = TOOTH_COUNT * SCORE_PER_TOOTH * 2; // 每个牙齿两面
const GAME_DURATION = 120; // 游戏时长（秒）

// 游戏状态
let gameStarted = false;
let score = 0;
let timeLeft = GAME_DURATION;
let brush = {
    x: 0,
    y: 0,
    angle: 0
};
let timerInterval;

// 获取DOM元素
const canvas = document.createElement('canvas');
const teethModel = document.querySelector('.teeth-model');
teethModel.appendChild(canvas);
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('start-btn');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');

// 初始化游戏
function initGame() {
    canvas.width = teethModel.clientWidth;
    canvas.height = teethModel.clientHeight;
    
    // 绘制牙齿
    drawTeeth();
    
    // 初始化牙刷位置
    brush.x = canvas.width / 2;
    brush.y = canvas.height / 2;
    
// 添加事件监听
canvas.addEventListener('mousemove', handleBrushMove);
canvas.addEventListener('touchmove', handleTouchMove);
startBtn.addEventListener('click', startGame);
}

// 处理触摸移动
function handleTouchMove(e) {
    if (!gameStarted) return;
    
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    brush.x = touch.clientX - rect.left;
    brush.y = touch.clientY - rect.top;
    
    // 计算牙刷角度
    if (e.touches.length > 1) {
        const dx = e.touches[1].clientX - touch.clientX;
        const dy = e.touches[1].clientY - touch.clientY;
        brush.angle = Math.atan2(dy, dx) * (180 / Math.PI);
    }
    
    checkBrushPosition();
    draw();
    e.preventDefault();
}

// 绘制牙齿
function drawTeeth() {
    const toothWidth = canvas.width / TOOTH_COUNT;
    ctx.fillStyle = '#fff';
    
    for (let i = 0; i < TOOTH_COUNT; i++) {
        const x = i * toothWidth;
        const y = canvas.height / 4;
        const height = canvas.height / 2;
        
        // 绘制牙齿主体
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + toothWidth, y);
        ctx.lineTo(x + toothWidth * 0.8, y + height);
        ctx.lineTo(x + toothWidth * 0.2, y + height);
        ctx.closePath();
        ctx.fill();
        
        // 绘制牙齿分割线
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

// 处理牙刷移动
function handleBrushMove(e) {
    if (!gameStarted) return;
    
    const rect = canvas.getBoundingClientRect();
    brush.x = e.clientX - rect.left;
    brush.y = e.clientY - rect.top;
    
    // 计算牙刷角度
    const dx = e.movementX;
    const dy = e.movementY;
    brush.angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    checkBrushPosition();
    draw();
}

// 检查牙刷位置
function checkBrushPosition() {
    // 检查角度是否正确（45度±误差范围）
    const targetAngle = 45;
    const angleDiff = Math.abs(brush.angle - targetAngle);
    
    if (angleDiff <= ANGLE_THRESHOLD) {
        score += SCORE_PER_TOOTH;
        scoreDisplay.textContent = score;
    }
}

// 开始游戏
function startGame() {
    gameStarted = true;
    score = 0;
    timeLeft = GAME_DURATION;
    scoreDisplay.textContent = score;
    startBtn.disabled = true;
    
    // 启动计时器
    timerInterval = setInterval(updateTimer, 1000);
}

// 更新计时器
function updateTimer() {
    timeLeft--;
    timerDisplay.textContent = timeLeft;
    if (timeLeft <= 0) {
        endGame();
    }
}

// 结束游戏
function endGame() {
    gameStarted = false;
    clearInterval(timerInterval);
    startBtn.disabled = false;
    
    // 显示最终得分
    const accuracy = Math.min(100, Math.round((score / MAX_SCORE) * 100));
    alert(`游戏结束！\n最终得分：${score}\n刷牙准确率：${accuracy}%`);
}

// 重置游戏
function resetGame() {
    gameStarted = false;
    score = 0;
    timeLeft = GAME_DURATION;
    scoreDisplay.textContent = score;
    startBtn.disabled = false;
    clearInterval(timerInterval);
    draw();
}

// 绘制游戏画面
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制牙齿
    drawTeeth();
    
    // 绘制牙刷
    ctx.save();
    ctx.translate(brush.x, brush.y);
    ctx.rotate(brush.angle * Math.PI / 180);
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(-BRUSH_WIDTH/2, -BRUSH_HEIGHT/2, BRUSH_WIDTH, BRUSH_HEIGHT);
    ctx.restore();
}

// 启动游戏
initGame();
