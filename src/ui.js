/**
 * @file Quản lý toàn bộ giao diện người dùng (UI) và các sự kiện.
 * Lắng nghe hành động của người dùng và cập nhật DOM.
 */

// Biến để quản lý biểu đồ
let motionChart;
let chartData = { labels: [], datasets: [] };
let chartStartTime;

// Giữ tham chiếu đến các đối tượng DOM để truy cập nhanh
const dom = {
    modeSelector: document.getElementById('mode-selector'),
    promptInput: document.getElementById('promptInput'),
    sendPromptButton: document.getElementById('sendPromptButton'),
    clearButton: document.getElementById('clearButton'),
    buttonText: document.getElementById('buttonText'),
    buttonSpinner: document.getElementById('buttonSpinner'),
    responseContainer: document.getElementById('responseContainer'),
    statusMessage: document.getElementById('statusMessage'),
    objectDetails: document.getElementById('objectDetails'),
    bottomPanel: document.getElementById('bottom-panel'),
    togglePanelButton: document.getElementById('togglePanelButton'),
    toggleIcon: document.getElementById('toggleIcon'),
    playPauseButton: document.getElementById('playPauseButton'),
    playPauseIcon: document.getElementById('playPauseIcon'),
    resetButton: document.getElementById('resetButton'),
    timeScaleSlider: document.getElementById('timeScaleSlider'),
    timeScaleLabel: document.getElementById('timeScaleLabel'),
    drawingToolsContainer: document.getElementById('drawing-tools-container'),
    examplePromptsContainer: document.getElementById('example-prompts-container'),
    examplePromptsList: document.getElementById('example-prompts-list'),
    propertyPanel: document.getElementById('propertyPanel'),
    propLabel: document.getElementById('propLabel'),
    propMass: document.getElementById('propMass'),
    propRestitution: document.getElementById('propRestitution'),
    propFriction: document.getElementById('propFriction'),
    propIsStatic: document.getElementById('propIsStatic'),
    closePropertyPanel: document.getElementById('closePropertyPanel'),
};

/**
 * Khởi tạo UI, gắn tất cả các event listener cần thiết.
 * @param {object} handlers - Một đối tượng chứa các hàm callback để xử lý logic (vd: onSendPrompt, onModeChange).
 */
export function initializeUI(handlers) {
    // Sự kiện thay đổi chế độ mô phỏng
    dom.modeSelector.addEventListener('change', (e) => handlers.onModeChange(e.target.value));

    // Sự kiện các nút chính
    dom.sendPromptButton.addEventListener('click', () => handlers.onSendPrompt(dom.promptInput.value));
    dom.clearButton.addEventListener('click', () => handlers.onClear());
    dom.resetButton.addEventListener('click', () => handlers.onReset());

    // Gõ Enter trong textarea để gửi
    dom.promptInput.addEventListener('keydown', (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handlers.onSendPrompt(dom.promptInput.value);
        }
    });

    // Sự kiện điều khiển mô phỏng
    dom.playPauseButton.addEventListener('click', () => {
        const isRunning = handlers.onPlayPause();
        dom.playPauseIcon.outerHTML = `<i id="playPauseIcon" data-lucide="${isRunning ? 'pause' : 'play'}" class="w-8 h-8 text-white"></i>`;
        lucide.createIcons();
    });

    dom.timeScaleSlider.addEventListener('input', (e) => {
        const scale = parseFloat(e.target.value);
        handlers.onTimeScaleChange(scale);
        dom.timeScaleLabel.textContent = `${scale.toFixed(1)}x`;
    });

    // Sự kiện bảng điều khiển dưới cùng
    dom.togglePanelButton.addEventListener('click', () => {
        dom.bottomPanel.classList.toggle('open');
        dom.toggleIcon.classList.toggle('rotate-180');
    });

    // Sự kiện cho bộ công cụ vẽ (sử dụng event delegation)
    dom.drawingToolsContainer.addEventListener('click', (e) => {
        const button = e.target.closest('.draw-tool');
        if (button) {
            const tool = button.dataset.tool;
            const activeTool = handlers.onToolToggle(tool);
            
            // Cập nhật trạng thái active cho các nút
            dom.drawingToolsContainer.querySelectorAll('.draw-tool').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tool === activeTool);
            });
        }
    });
    
    // Sự kiện cho các ví dụ gợi ý
    dom.examplePromptsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('example-prompt')) {
            dom.promptInput.value = e.target.dataset.prompt;
            dom.promptInput.focus();
        }
    });

    // Sự kiện cho bảng thuộc tính
    dom.closePropertyPanel.addEventListener('click', hidePropertyPanel);
    const propInputs = [dom.propLabel, dom.propMass, dom.propRestitution, dom.propFriction, dom.propIsStatic];
    propInputs.forEach(input => {
        input.addEventListener('input', () => {
            handlers.onDrawingPropertiesChange({
                label: dom.propLabel.value.trim() || null,
                mass: dom.propMass.value ? parseFloat(dom.propMass.value) : null,
                restitution: dom.propRestitution.value ? parseFloat(dom.propRestitution.value) : null,
                friction: dom.propFriction.value ? parseFloat(dom.propFriction.value) : null,
                isStatic: dom.propIsStatic.checked,
            });
        });
    });
}

// ============================================
// CÁC HÀM CẬP NHẬT GIAO DIỆN
// ============================================

export function updateStatus(message, type = 'info') {
    dom.statusMessage.textContent = message;
    dom.statusMessage.className = 'mt-4 text-center text-sm h-5'; // Reset classes
    if (type === 'error') dom.statusMessage.classList.add('text-red-400');
    else if (type === 'success') dom.statusMessage.classList.add('text-green-400');
    else dom.statusMessage.classList.add('text-gray-400');
}

export function setAILoading(isLoading) {
    dom.sendPromptButton.disabled = isLoading;
    dom.buttonText.textContent = isLoading ? 'Đang xử lý' : 'Tạo mô phỏng';
    dom.buttonSpinner.classList.toggle('hidden', !isLoading);
}

export function displayAIResponse(explanation) {
    dom.responseContainer.innerText = explanation || "AI đã thực hiện hành động nhưng không có giải thích.";
}

export function displayObjectDetails(body, runner, pixelsToWorld) {
    if (!body || body.isStatic) {
        dom.objectDetails.innerHTML = `<p>Nhấp vào một đối tượng động để xem chi tiết.</p>`;
        if (motionChart) {
            motionChart.destroy();
            motionChart = null;
        }
        return;
    }

    const vx_ms = body.velocity.x * (1000 / runner.delta) / (100); // PIXELS_PER_METER
    const vy_ms = -body.velocity.y * (1000 / runner.delta) / (100);

    dom.objectDetails.innerHTML = `
        <h3 class="font-bold text-gray-200">${body.label || 'Vật thể không tên'}</h3>
        <p><strong>Khối lượng:</strong> ${body.mass.toFixed(2)} kg</p>
        <p><strong>Vị trí (m):</strong> x=${(pixelsToWorld({x_px: body.position.x, y_px: 0}).x_m).toFixed(2)}, y=${(pixelsToWorld({x_px: 0, y_px: body.position.y}).y_m).toFixed(2)}</p>
        <p><strong>Vận tốc (m/s):</strong> x=${vx_ms.toFixed(2)}, y=${vy_ms.toFixed(2)}</p>
    `;

    // Khởi tạo biểu đồ nếu chưa có
    if (!motionChart) {
        initializeChart();
    }
}

export function updateChart(body, runner, pixelsToWorld, isRunning) {
    if (!body || !motionChart || body.isStatic || !isRunning) return;

    const timeInSeconds = (performance.now() - chartStartTime) / 1000;
    if (chartData.labels.length > 100) {
        chartData.labels.shift();
        chartData.datasets.forEach(ds => ds.data.shift());
    }
    chartData.labels.push(timeInSeconds.toFixed(1));
    
    const G = 9.81;
    const vx_ms = body.velocity.x * (1000 / runner.delta) / 100;
    const vy_ms = -body.velocity.y * (1000 / runner.delta) / 100;
    const speed_ms = Math.sqrt(vx_ms*vx_ms + vy_ms*vy_ms);
    
    const height_m = pixelsToWorld({x_px: 0, y_px: body.position.y}).y_m;
    const potentialEnergy = body.mass * G * height_m;
    const kineticEnergy = 0.5 * body.mass * (speed_ms * speed_ms);
    const totalEnergy = potentialEnergy + kineticEnergy;

    chartData.datasets[0].data.push(speed_ms);
    chartData.datasets[1].data.push(kineticEnergy);
    chartData.datasets[2].data.push(potentialEnergy);
    chartData.datasets[3].data.push(totalEnergy);
    motionChart.update('none');
}

function initializeChart() {
    if (motionChart) motionChart.destroy();
    chartData = {
        labels: [],
        datasets: [
            { label: 'Tốc độ (m/s)', data: [], borderColor: '#60a5fa', tension: 0.1, yAxisID: 'y-velocity', borderWidth: 2, pointRadius: 0 },
            { label: 'Động năng (J)', data: [], borderColor: '#f87171', tension: 0.1, yAxisID: 'y-energy', borderWidth: 2, pointRadius: 0 },
            { label: 'Thế năng (J)', data: [], borderColor: '#4ade80', tension: 0.1, yAxisID: 'y-energy', borderWidth: 2, pointRadius: 0 },
            { label: 'Cơ năng (J)', data: [], borderColor: '#facc15', tension: 0.1, yAxisID: 'y-energy', borderWidth: 2, pointRadius: 0, borderDash: [5, 5] }
        ]
    };
    const chartCtx = document.getElementById('motionChart').getContext('2d');
    motionChart = new Chart(chartCtx, {
        type: 'line', data: chartData,
        options: {
            responsive: true, maintainAspectRatio: false, animation: false,
            plugins: { legend: { labels: { color: '#d1d5db' } } },
            scales: {
                x: { title: { display: true, text: 'Thời gian (s)', color: '#9ca3af' }, ticks: { color: '#9ca3af' } },
                'y-velocity': { type: 'linear', position: 'left', title: { display: true, text: 'Tốc độ (m/s)', color: '#9ca3af' }, ticks: { color: '#60a5fa' } },
                'y-energy': { type: 'linear', position: 'right', title: { display: true, text: 'Năng lượng (J)', color: '#9ca3af' }, ticks: { color: '#f87171' }, grid: { drawOnChartArea: false } }
            }
        }
    });
    chartStartTime = performance.now();
}

export function showPropertyPanel(drawingProperties, position) {
    const props = drawingProperties || {};
    dom.propLabel.value = props.label || '';
    dom.propMass.value = props.mass || '';
    dom.propRestitution.value = props.restitution ?? '';
    dom.propFriction.value = props.friction ?? '';
    dom.propIsStatic.checked = props.isStatic || false;
    
    dom.propertyPanel.style.left = `${position.x + 15}px`;
    dom.propertyPanel.style.top = `${position.y + 15}px`;
    dom.propertyPanel.classList.remove('hidden');
}

export function hidePropertyPanel() {
    dom.propertyPanel.classList.add('hidden');
}

export function populateModeContent(drawingTools, examplePrompts) {
    // Populate drawing tools
    dom.drawingToolsContainer.innerHTML = drawingTools.map(tool => `
        <button class="draw-tool p-3 rounded-lg bg-gray-700/50 hover:bg-gray-700 flex justify-center items-center" data-tool="${tool.id}" title="${tool.title}">
            <i data-lucide="${tool.icon}" class="w-5 h-5"></i>
        </button>
    `).join('');

    // Populate example prompts
    dom.examplePromptsList.innerHTML = Object.entries(examplePrompts).map(([key, value]) => `
        <button class="example-prompt bg-gray-700/50 hover:bg-gray-700 p-2 rounded-lg text-left transition" data-prompt="${value}">
            ${key}
        </button>
    `).join('');

    // Re-render icons
    lucide.createIcons();
}
