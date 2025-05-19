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

// 添加消息到聊天界面
function addMessage(text, className) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) {
        console.error('找不到聊天消息容器');
        return;
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${className}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;
    
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    
    // 自动滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;
    console.log('消息已添加:', text);
}

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

    // 初始化AI助手
    initAIAssistant();
}

// 食物糖分数据
const foodSugarData = {
    "苹果": 10,
    "香蕉": 12,
    "橙子": 9,
    "葡萄": 16,
    "西瓜": 6,
    "可乐": 39,
    "果汁": 24,
    "牛奶": 5,
    "巧克力": 50,
    "饼干": 45,
    "蛋糕": 60,
    "冰淇淋": 30
};

// 问答数据
const faqData = [
    // 原有8个问题保持不变...
    {
        question: "没有蛀牙也要去医院吗？",
        answer: "要。即使没有蛀牙，也应每半年至一年进行一次口腔检查，预防牙周病、牙结石、早期龋齿等问题，同时筛查口腔癌等疾病。"
    },
    {
        question: "蛀牙不痛也要补？",
        answer: "要。早期蛀牙（浅龋）可能无痛感，但拖延会导致龋坏深入牙髓，引发牙髓炎或根尖周炎，治疗更复杂且费用更高。"
    },
    {
        question: "补牙材料会不会有毒？",
        answer: "不会。现代补牙材料（如树脂、玻璃离子）均通过生物安全性认证，无毒无害。银汞合金争议较大，但国际研究认为其安全性达标，目前多被树脂替代。"
    },
    {
        question: "牙齿迟早换，为什么还要做窝沟封闭呢？",
        answer: "因为窝沟封闭并非仅针对\"会换的乳牙\"，而是以保护终身使用的恒牙为核心，同时维护乳牙健康以避免影响恒牙发育。它是一种高效、经济的预防手段，帮助孩子建立良好的口腔基础，减少未来牙科问题的风险。"
    },
    {
        question: "窝沟封闭是不是智商税？",
        answer: "不是。窝沟封闭被世界卫生组织（WHO）和中华口腔医学会推荐为有效防龋手段，可降低80%以上的后牙龋坏风险，尤其适合儿童。"
    },
    {
        question: "窝沟封闭是不是没什么用，很快就会掉？",
        answer: "根据情况而定，正确操作下效果持久。封闭剂通常可维持数年，脱落率与医生技术、孩子配合度相关。建议每半年复查，必要时补涂。"
    },
    {
        question: "做了窝沟封闭牙齿是不是会烂得更快？",
        answer: "不会。封闭剂本身不导致蛀牙，但若封闭不全或日常清洁差，细菌可能从边缘渗入。良好口腔卫生+定期检查是关键。"
    },
    {
        question: "酸蚀会不会永久损害牙齿？",
        answer: "不会。酸蚀（使用弱酸处理牙面）是窝沟封闭的必要步骤，仅轻微软化釉质表层以便粘接，唾液中的矿物质可自然修复轻微脱矿。"
    },

    // 新增牙齿护理相关问题
    {
        question: "如何正确使用牙线？",
        answer: "1.取约45cm牙线，缠绕于双手中指\n2.用拇指食指引导，轻轻滑入牙缝\n3.呈C形包绕牙齿，上下刮擦牙面\n4.每个牙缝使用清洁段牙线\n建议每天睡前使用一次，动作轻柔避免损伤牙龈。"
    },
    {
        question: "电动牙刷比普通牙刷更好吗？",
        answer: "各有优势：\n电动牙刷优点：\n- 更易掌握正确刷牙角度\n- 高频振动清洁效率更高\n- 内置计时功能确保刷牙时长\n普通牙刷优点：\n- 价格更实惠\n- 便携性更好\n关键还是掌握正确的巴氏刷牙法。"
    },
    {
        question: "儿童几岁开始刷牙？",
        answer: "分阶段建议：\n1. 出牙前：用纱布清洁牙龈\n2. 第一颗乳牙萌出：使用婴儿牙刷\n3. 2-3岁：家长帮助刷牙\n4. 6岁后：监督孩子独立刷牙\n建议使用儿童专用含氟牙膏（3岁以下米粒大小，3-6岁豌豆大小）。"
    },
    {
        question: "牙齿敏感怎么办？",
        answer: "应对措施：\n1. 使用抗敏感牙膏\n2. 避免过冷过热食物刺激\n3. 采用软毛牙刷\n4. 检查是否有牙龈退缩或楔状缺损\n5. 如持续不缓解，需就医检查\n注意：长期牙齿敏感可能是牙本质暴露或龋齿的信号。"
    },

    // 新增刷牙方法相关问题
    {
        question: "巴氏刷牙法的要点是什么？",
        answer: "核心要点：\n1. 牙刷45度角朝向牙龈\n2. 小幅度水平颤动（2-3mm）\n3. 每颗牙齿刷10次左右\n4. 按顺序刷：外侧→内侧→咬合面\n5. 舌面也要轻刷\n6. 总时长不少于2分钟\n建议每天早晚各一次。"
    },
    {
        question: "刷牙出血是什么原因？",
        answer: "常见原因：\n1. 牙龈炎（最常见）\n2. 刷牙力度过大\n3. 牙周病\n4. 维生素缺乏\n5. 血液疾病（较少见）\n建议：\n- 持续出血应就医检查\n- 使用软毛牙刷\n- 掌握正确刷牙方法\n- 定期洗牙去除牙结石"
    },
    {
        question: "饭后立即刷牙好吗？",
        answer: "视情况而定：\n1. 酸性食物（如柑橘）后应等待30分钟\n   - 酸性物质会软化牙釉质\n   - 立即刷牙可能造成磨损\n2. 普通饮食后可立即刷牙\n3. 特殊情况（正畸患者）按医嘱执行\n建议：饭后先用清水漱口。"
    },

    // 新增窝沟封闭相关问题
    {
        question: "窝沟封闭的最佳年龄？",
        answer: "关键时间点：\n1. 3-4岁：乳磨牙完全萌出后\n2. 6-7岁：第一恒磨牙（六龄齿）萌出\n3. 11-13岁：第二恒磨牙萌出\n注意：\n- 不是绝对年龄，以牙齿萌出情况为准\n- 需在牙齿完全萌出且未发生龋坏前进行"
    },
    {
        question: "窝沟封闭后需要注意什么？",
        answer: "术后护理：\n1. 术后2小时避免进食\n2. 24小时内避免过硬食物\n3. 保持良好口腔卫生\n4. 定期复查（每6个月）\n5. 发现脱落及时补做\n6. 仍需坚持正确刷牙和使用牙线\n注意：窝沟封闭不能替代日常口腔护理。"
    },
    {
        question: "成年人可以做窝沟封闭吗？",
        answer: "可以，但需评估：\n适合情况：\n1. 窝沟深且易患龋\n2. 牙齿刚萌出不久\n3. 无龋坏或仅有早期脱矿\n限制因素：\n1. 已有龋齿需先治疗\n2. 牙齿萌出时间过长可能影响粘接效果\n建议咨询牙医进行个性化评估。"
    },

    // 新增其他口腔健康问题
    {
        question: "口臭怎么解决？",
        answer: "应对措施：\n1. 检查并治疗口腔疾病（龋齿、牙周病等）\n2. 清洁舌苔\n3. 保持充足唾液分泌\n4. 定期洗牙去除牙结石\n5. 检查消化系统健康\n6. 避免刺激性食物\n注意：长期口臭应就医排查原因。"
    },
    {
        question: "智齿一定要拔吗？",
        answer: "视情况而定：\n建议拔除的情况：\n1. 反复发炎\n2. 阻生或位置不正\n3. 导致邻牙龋坏\n4. 无法清洁到位\n可保留的情况：\n1. 完全萌出且位置正常\n2. 有正常咬合功能\n3. 可清洁维护\n需通过X光片评估决定。"
    }
];

// 显示食物糖分
function showFoodSugar(food) {
    console.log('点击食物按钮:', food); // 调试日志
    if (!foodSugarData.hasOwnProperty(food)) {
        console.warn('未知食物:', food);
        addMessage(`抱歉，没有找到${food}的糖分数据`, 'bot-message');
        return;
    }
    
    const sugar = foodSugarData[food];
    const message = `${food}的糖分含量为: ${sugar}克/100克\n\n` + 
                   `建议：${getSugarAdvice(sugar)}`;
    addMessage(message, 'bot-message');
}

// 获取糖分建议
function getSugarAdvice(sugar) {
    if (sugar === '未知') return '暂无该食物的糖分数据';
    if (sugar < 5) return '低糖食物，对牙齿友好';
    if (sugar < 15) return '适量糖分，建议餐后漱口';
    if (sugar < 30) return '较高糖分，建议控制摄入并注意口腔清洁';
    return '高糖食物，易导致龋齿，建议减少食用并加强刷牙';
}

// 初始化AI助手
function initAIAssistant() {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');

    // 发送消息函数
    function sendMessage() {
        const message = userInput.value.trim();
        if (message === '') return;

        // 添加用户消息
        addMessage(message, 'user-message');
        userInput.value = '';

        // 查找匹配的回答
        const response = findAnswer(message);
        
        // 模拟AI思考延迟
        setTimeout(() => {
            addMessage(response, 'bot-message');
            // 自动滚动到底部
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 500);
    }

// 添加消息到聊天界面
function addMessage(text, className) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) {
        console.error('找不到聊天消息容器');
        return;
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${className}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;
    
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    
    // 自动滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;
    console.log('消息已添加:', text); // 调试日志
}

    // 查找匹配的回答
    function findAnswer(question) {
        // 简单匹配：查找包含关键词的问题
        const matchedQuestion = faqData.find(item => 
            item.question.includes(question) || question.includes(item.question)
        );
        
        if (matchedQuestion) {
            return matchedQuestion.answer;
        }
        
        // 如果没有匹配到，返回默认回答
        return "抱歉，我没有理解您的问题。您可以尝试问一些关于牙齿护理、刷牙方法或窝沟封闭的问题。";
    }

    // 事件监听
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // 快速提问按钮点击事件
    document.querySelectorAll('.quick-question').forEach(button => {
        button.addEventListener('click', () => {
            const question = button.textContent.replace(/^\d+\.\s/, ''); // 移除前面的数字和点
            userInput.value = question;
            sendMessage();
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
    
    // 显示开始提示
    alert('开始刷牙！请按照45度角刷牙，覆盖所有牙齿表面');
    
    // 静默处理音效播放
    try {
        const startSound = document.getElementById('startSound');
        if (startSound) {
            startSound.play().catch(() => {});
        }
    } catch (e) {
        console.log('音效播放失败:', e);
    }
    
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
