// 游戏常量
const TOOTH_COUNT = 16;
const BRUSH_WIDTH = 40;
const BRUSH_HEIGHT = 60;
const ANGLE_THRESHOLD = 10; // 角度误差范围
const SCORE_PER_TOOTH = 10;
const MAX_SCORE = TOOTH_COUNT * SCORE_PER_TOOTH * 2; // 每个牙齿两面
const GAME_DURATION = 120; // 游戏时长（秒）
const SEALANT_STEPS = 5; // 窝沟封闭步骤数

// 游戏状态
let currentGame = 'brushing'; // 'brushing' 或 'sealant'
let gameStarted = false;
let score = 0;
let timeLeft = GAME_DURATION;
let brush = {
    x: 0,
    y: 0,
    angle: 0
};
let sealantStep = 0; // 当前窝沟封闭步骤
let timerInterval;

// 获取DOM元素
const canvas = document.createElement('canvas');
const brushingModel = document.querySelector('.brushing-game');
const sealantModel = document.querySelector('.sealant-game');
brushingModel.appendChild(canvas);
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('start-btn');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
const gameBtns = document.querySelectorAll('.game-btn');
const brushingInstructions = document.querySelector('.brushing-instructions');
const sealantInstructions = document.querySelector('.sealant-instructions');

// 初始化游戏
function initGame() {
    canvas.width = brushingModel.clientWidth;
    canvas.height = brushingModel.clientHeight;
    
    // 绘制牙齿
    drawTeeth();
    
    // 初始化牙刷位置
    brush.x = canvas.width / 2;
    brush.y = canvas.height / 2;
    
    // 添加事件监听
    canvas.addEventListener('mousemove', handleBrushMove);
    canvas.addEventListener('touchmove', handleTouchMove);
    startBtn.addEventListener('click', startGame);
    
    // 游戏切换按钮事件
    gameBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            switchGame(btn.dataset.game);
        });
    });
}

// 切换游戏模式
function switchGame(gameType) {
    currentGame = gameType;
    
    // 更新UI
    gameBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.game === gameType);
    });
    
    if (gameType === 'brushing') {
        brushingModel.style.display = 'block';
        sealantModel.style.display = 'none';
        brushingInstructions.style.display = 'block';
        sealantInstructions.style.display = 'none';
        canvas.width = brushingModel.clientWidth;
        canvas.height = brushingModel.clientHeight;
    } else {
        brushingModel.style.display = 'none';
        sealantModel.style.display = 'block';
        brushingInstructions.style.display = 'none';
        sealantInstructions.style.display = 'block';
        // 初始化窝沟封闭游戏
        initSealantGame();
    }
    
    resetGame();
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
    if (currentGame === 'brushing') {
        // 检查角度是否正确（45度±误差范围）
        const targetAngle = 45;
        const angleDiff = Math.abs(brush.angle - targetAngle);
        
        if (angleDiff <= ANGLE_THRESHOLD) {
            score += SCORE_PER_TOOTH;
            scoreDisplay.textContent = score;
        }
    } else {
        // 窝沟封闭游戏得分逻辑
        score += 1;
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
    let message = `游戏结束！\n最终得分：${score}\n`;
    let rating = '';
    
    if (currentGame === 'brushing') {
        const accuracy = Math.min(100, Math.round((score / MAX_SCORE) * 100));
        message += `刷牙准确率：${accuracy}%\n`;
        
        // 刷牙游戏评级
        if (accuracy >= 90) rating = '★★★★★ 完美！';
        else if (accuracy >= 75) rating = '★★★★ 很好！';
        else if (accuracy >= 60) rating = '★★★ 不错';
        else if (accuracy >= 40) rating = '★★ 需要练习';
        else rating = '★ 继续努力';
    } else {
        const perfectTeeth = teethState.filter(tooth => 
            tooth.cleaned && tooth.etched && tooth.bonded && tooth.sealed && tooth.cured
        ).length;
        const perfectRate = perfectTeeth / TOOTH_COUNT;
        message += `完美处理的牙齿：${perfectTeeth}/${TOOTH_COUNT}\n`;
        
        // 窝沟封闭游戏评级
        if (perfectRate >= 0.9) rating = '★★★★★ 专业水平！';
        else if (perfectRate >= 0.7) rating = '★★★★ 非常棒！';
        else if (perfectRate >= 0.5) rating = '★★★ 合格';
        else if (perfectRate >= 0.3) rating = '★★ 需要改进';
        else rating = '★ 多加练习';
    }
    
    message += `评级：${rating}`;
    alert(message);
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

// 初始化窝沟封闭游戏
function initSealantGame() {
    // 创建窝沟封闭游戏画布
    const sealantCanvas = document.createElement('canvas');
    sealantModel.appendChild(sealantCanvas);
    sealantCanvas.width = sealantModel.clientWidth;
    sealantCanvas.height = sealantModel.clientHeight;
    
    const sealantCtx = sealantCanvas.getContext('2d');
    
    // 窝沟封闭工具
    const tools = {
        cleaner: {name: '清洁剂', color: '#87CEEB', step: 1},
        etchant: {name: '酸蚀剂', color: '#FF6347', step: 2},
        bond: {name: '粘接剂', color: '#FFD700', step: 3},
        sealant: {name: '封闭剂', color: '#32CD32', step: 4},
        light: {name: '光固化灯', color: '#FFA500', step: 5}
    };
    
    let currentTool = null;
    
    // 绘制窝沟封闭牙齿
    function drawSealantTeeth() {
        const toothWidth = sealantCanvas.width / TOOTH_COUNT;
        sealantCtx.fillStyle = '#fff';
        
        for (let i = 0; i < TOOTH_COUNT; i++) {
            const x = i * toothWidth;
            const y = sealantCanvas.height / 4;
            const height = sealantCanvas.height / 2;
            
            // 绘制牙齿主体
            sealantCtx.beginPath();
            sealantCtx.moveTo(x, y);
            sealantCtx.lineTo(x + toothWidth, y);
            sealantCtx.lineTo(x + toothWidth * 0.8, y + height);
            sealantCtx.lineTo(x + toothWidth * 0.2, y + height);
            sealantCtx.closePath();
            sealantCtx.fill();
            
            // 绘制牙齿分割线
            sealantCtx.strokeStyle = '#ddd';
            sealantCtx.lineWidth = 1;
            sealantCtx.stroke();
            
            // 绘制窝沟区域
            sealantCtx.fillStyle = '#F5F5DC';
            sealantCtx.fillRect(x + toothWidth*0.3, y + height*0.2, 
                              toothWidth*0.4, height*0.3);
        }
    }
    
    // 绘制工具按钮
    function drawTools() {
        const toolWidth = sealantCanvas.width / 5;
        const toolHeight = 40;
        const toolY = sealantCanvas.height - 60;
        
        Object.values(tools).forEach((tool, index) => {
            const toolX = index * toolWidth;
            
            // 绘制工具按钮
            sealantCtx.fillStyle = tool.color;
            sealantCtx.fillRect(toolX, toolY, toolWidth, toolHeight);
            
            // 绘制工具文字
            sealantCtx.fillStyle = '#000';
            sealantCtx.font = '14px Arial';
            sealantCtx.textAlign = 'center';
            sealantCtx.fillText(tool.name, toolX + toolWidth/2, toolY + 25);
        });
    }
    
    // 处理工具选择
    sealantCanvas.addEventListener('click', (e) => {
        const rect = sealantCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 检查是否点击了工具按钮
        const toolWidth = sealantCanvas.width / 5;
        const toolHeight = 40;
        const toolY = sealantCanvas.height - 60;
        
        if (y >= toolY && y <= toolY + toolHeight) {
            const toolIndex = Math.floor(x / toolWidth);
            currentTool = Object.values(tools)[toolIndex];
            
            // 更新步骤显示
            sealantStep = currentTool.step;
            sealantInstructions.textContent = `当前步骤: ${currentTool.name}`;
        } else if (currentTool) {
            // 处理牙齿点击
            const toothWidth = sealantCanvas.width / TOOTH_COUNT;
            const toothIndex = Math.floor(x / toothWidth);
            
            // 检查步骤是否正确
            if (sealantStep === currentTool.step) {
                // 检查牙齿是否已完成前序步骤
                const tooth = teethState[toothIndex];
                const prevStepsDone = 
                    (currentTool.step === 1) || // 清洁剂没有前序步骤
                    (currentTool.step === 2 && tooth.cleaned) ||
                    (currentTool.step === 3 && tooth.etched) ||
                    (currentTool.step === 4 && tooth.bonded) ||
                    (currentTool.step === 5 && tooth.sealed);
                
                if (prevStepsDone) {
                    // 应用工具效果
                    applyToolToTooth(toothIndex);
                    // 根据步骤正确性奖励分数
                    score += prevStepsDone ? 20 : 5;
                    scoreDisplay.textContent = score;
                } else {
                    alert(`请先完成前序步骤！`);
                }
            }
        }
    });
    
    // 牙齿处理状态
    const teethState = Array(TOOTH_COUNT).fill().map(() => ({
        cleaned: false,
        etched: false,
        bonded: false,
        sealed: false,
        cured: false
    }));
    
    // 应用工具到牙齿
    function applyToolToTooth(toothIndex) {
        const toothWidth = sealantCanvas.width / TOOTH_COUNT;
        const x = toothIndex * toothWidth;
        const y = sealantCanvas.height / 4;
        const height = sealantCanvas.height / 2;
        
        // 根据当前工具绘制效果
        sealantCtx.fillStyle = currentTool.color + '80'; // 添加透明度
        sealantCtx.fillRect(x + toothWidth*0.3, y + height*0.2, 
                          toothWidth*0.4, height*0.3);
        
        // 更新牙齿状态
        switch(currentTool.step) {
            case 1: teethState[toothIndex].cleaned = true; break;
            case 2: teethState[toothIndex].etched = true; break;
            case 3: teethState[toothIndex].bonded = true; break;
            case 4: teethState[toothIndex].sealed = true; break;
            case 5: teethState[toothIndex].cured = true; break;
        }
        
        // 检查是否完成所有牙齿
        checkCompletion();
    }
    
    // 检查游戏完成状态
    function checkCompletion() {
        const allTeethDone = teethState.every(tooth => 
            tooth.cleaned && tooth.etched && tooth.bonded && tooth.sealed && tooth.cured
        );
        
        if (allTeethDone) {
            // 计算完成度得分
            const perfectTeeth = teethState.filter(tooth => 
                tooth.cleaned && tooth.etched && tooth.bonded && tooth.sealed && tooth.cured
            ).length;
            
            const completionScore = perfectTeeth * 20;
            score = Math.max(score, completionScore);
            scoreDisplay.textContent = score;
            
            endGame();
        }
    }
    
    function draw() {
        sealantCtx.clearRect(0, 0, sealantCanvas.width, sealantCanvas.height);
        drawSealantTeeth();
        drawTools();
        
        // 绘制当前工具提示
        if (currentTool) {
            sealantCtx.fillStyle = '#000';
            sealantCtx.font = '16px Arial';
            sealantCtx.textAlign = 'center';
            sealantCtx.fillText(`当前工具: ${currentTool.name}`, 
                              sealantCanvas.width/2, 30);
            
            // 绘制进度
            const progress = teethState.filter(tooth => {
                switch(currentTool.step) {
                    case 1: return tooth.cleaned;
                    case 2: return tooth.etched;
                    case 3: return tooth.bonded;
                    case 4: return tooth.sealed;
                    case 5: return tooth.cured;
                }
            }).length;
            
            sealantCtx.fillText(`进度: ${progress}/${TOOTH_COUNT}`, 
                              sealantCanvas.width/2, 60);
        }
    }
    
    draw();
}

// 启动游戏
initGame();
