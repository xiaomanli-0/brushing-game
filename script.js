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

    // 初始化问答交互
    setupFAQ();
}

// 设置问答交互
function setupFAQ() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const faqItem = question.parentElement;
            faqItem.classList.toggle('active');
            
            // 关闭其他打开的问答
            faqQuestions.forEach(q => {
                if (q !== question && q.parentElement.classList.contains('active')) {
                    q.parentElement.classList.remove('active');
                }
            });
        });
    });
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

// 绘制立体口腔牙齿
function drawTeeth() {
    ctx.fillStyle = '#fff';
    
    // 绘制上颌牙齿
    const upperTeethCount = TOOTH_COUNT / 2;
    const upperToothWidth = canvas.width / upperTeethCount;
    const upperY = canvas.height / 3;
    
    for (let i = 0; i < upperTeethCount; i++) {
        const x = i * upperToothWidth;
        
        // 绘制牙齿3D效果
        ctx.beginPath();
        ctx.moveTo(x, upperY);
        ctx.lineTo(x + upperToothWidth, upperY);
        ctx.lineTo(x + upperToothWidth * 0.9, upperY + upperToothWidth * 0.4);
        ctx.lineTo(x + upperToothWidth * 0.1, upperY + upperToothWidth * 0.4);
        ctx.closePath();
        ctx.fill();
        
        // 绘制牙齿细节
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    
    // 绘制下颌牙齿
    const lowerTeethCount = TOOTH_COUNT / 2;
    const lowerToothWidth = canvas.width / lowerTeethCount;
    const lowerY = canvas.height * 2/3;
    
    for (let i = 0; i < lowerTeethCount; i++) {
        const x = i * lowerToothWidth;
        
        // 绘制牙齿3D效果
        ctx.beginPath();
        ctx.moveTo(x + lowerToothWidth * 0.1, lowerY - lowerToothWidth * 0.4);
        ctx.lineTo(x + lowerToothWidth * 0.9, lowerY - lowerToothWidth * 0.4);
        ctx.lineTo(x + lowerToothWidth, lowerY);
        ctx.lineTo(x, lowerY);
        ctx.closePath();
        ctx.fill();
        
        // 绘制牙齿细节
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    
    // 绘制牙龈线
    ctx.strokeStyle = '#ffb6c1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, upperY);
    ctx.lineTo(canvas.width, upperY);
    ctx.moveTo(0, lowerY);
    ctx.lineTo(canvas.width, lowerY);
    ctx.stroke();
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
    
    // 显示最终得分和评级
    const accuracy = Math.min(100, Math.round((score / MAX_SCORE) * 100));
    let message = `游戏结束！\n最终得分：${score}\n刷牙准确率：${accuracy}%\n`;
    let rating = '';
    
    if (accuracy >= 90) rating = '★★★★★ 完美！';
    else if (accuracy >= 75) rating = '★★★★ 很好！';
    else if (accuracy >= 60) rating = '★★★ 不错';
    else if (accuracy >= 40) rating = '★★ 需要练习';
    else rating = '★ 继续努力';
    
    message += `评级：${rating}`;
    alert(message);
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
