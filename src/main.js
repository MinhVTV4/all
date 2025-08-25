/**
 * @file main.js - Điểm khởi đầu và điều phối chính của ứng dụng.
 * Kết nối các module UI, Simulation, Drawing, và AI lại với nhau.
 */

// Import các module chức năng
import * as UI from './ui.js';
import * as Simulation from './simulation.js';
import * as Drawing from './drawing.js';
import * as AI from './ai.js';

// ============================================
// TRẠNG THÁI TOÀN CỤC CỦA ỨNG DỤNG
// ============================================
const AppState = {
    currentMode: null,
    activeToolDeclarations: [],
    activeToolImplementations: {},
    selectedBody: null,
    isSimulationRunning: true,
};

// ============================================
// CẤU HÌNH CHO CÁC CHẾ ĐỘ
// ============================================
const modeConfig = {
    physics: {
        toolPath: './tools/physicsTools.js',
        drawingTools: [
            { id: 'freeform', title: 'Vẽ Tự do', icon: 'pencil' },
            { id: 'box', title: 'Vẽ Hộp', icon: 'square' },
            { id: 'circle', title: 'Vẽ Bóng', icon: 'circle' },
            { id: 'wall', title: 'Vẽ Tường', icon: 'ruler' },
            { id: 'joint', title: 'Nối vật thể', icon: 'link' },
            { id: 'spring', title: 'Tạo Lò xo', icon: 'git-commit-vertical' }
        ],
        examplePrompts: {
            "Con lắc đơn": "Tạo một con lắc đơn dài 3m treo ở điểm (5m, 8m).",
            "Hệ đòn bẩy": "Tạo một đòn bẩy dài 6m có điểm tựa ở (5m, 2m) và đặt tên thanh đòn là 'thanh'. Sau đó, tạo một hộp nặng 5kg tên 'vatnang' ở (3m, 2.5m) và một quả bóng 2kg tên 'bong' ở (7m, 2.5m).",
            "Va chạm đàn hồi": "Tạo một quả bóng nặng 2kg tên 'b1' ở (2m, 2m) và một quả bóng khác nặng 2kg tên 'b2' ở (8m, 2m) với độ đàn hồi là 1, sau đó cho bóng 'b1' vận tốc 5m/s theo phương ngang sang phải.",
            "Thay đổi & Xóa": "Tạo một hộp tên 'hop1' ở (3, 5) và một quả bóng 'bong1' ở (7, 6). Sau đó, tăng khối lượng của 'hop1' lên 10kg. Tiếp theo, đổi tên 'bong1' thành 'qua_bong_xanh'. Cuối cùng, xóa hộp 'hop1' đi.",
            "Hệ Ròng Rọc": "Tạo một máy Atwood ở (6, 8) với vật A 4kg và vật B 4.5kg.",
            "Sóng Cơ": "Tạo một sợi dây tên 'day1' gồm 20 đoạn từ (1, 7) đến (11, 7). Sau đó, tạo sóng trên 'day1' với biên độ 0.5m và tần số 1.5Hz."
        }
    },
    // Định nghĩa các chế độ khác (chemistry, electronics) ở đây trong tương lai
};


// ============================================
// CÁC HÀM XỬ LÝ LOGIC CHÍNH (HANDLERS)
// ============================================

/**
 * Tải và kích hoạt một chế độ mô phỏng (Vật lý, Hóa học...).
 * @param {string} modeName - Tên của chế độ (vd: 'physics').
 */
async function loadMode(modeName) {
    if (!modeConfig[modeName]) {
        console.error(`Chế độ không hợp lệ: ${modeName}`);
        return;
    }
    AppState.currentMode = modeName;
    UI.updateStatus(`Đang tải chế độ ${modeName}...`, 'info');

    // Dọn dẹp trạng thái cũ
    handleClear();

    // Tải động gói công cụ tương ứng
    const config = modeConfig[modeName];
    const toolModule = await import(config.toolPath);

    // Lưu lại bộ công cụ và khởi tạo AI
    AppState.activeToolDeclarations = toolModule.functionDeclarations;
    const simContext = Simulation.getSimulationContext();
    AppState.activeToolImplementations = toolModule.getToolImplementations(simContext);
    AI.initializeAIModel(AppState.activeToolDeclarations);

    // Cập nhật giao diện với các công cụ và ví dụ của chế độ mới
    UI.populateModeContent(config.drawingTools, config.examplePrompts);

    UI.updateStatus(`Chế độ ${modeName} đã sẵn sàng.`, 'success');
}

/**
 * Xử lý khi người dùng nhấn nút "Tạo mô phỏng".
 * @param {string} promptText - Yêu cầu người dùng nhập vào.
 */
async function handleSendPrompt(promptText) {
    const drawingData = Drawing.getDrawingData();
    const simContext = Simulation.getSimulationContext();

    if (!promptText && drawingData.drawings.length === 0) {
        UI.updateStatus("Vui lòng nhập yêu cầu hoặc vẽ hình!", "error");
        return;
    }

    UI.setAILoading(true);
    UI.updateStatus("AI đang suy nghĩ...", "info");

    try {
        // Chuẩn bị bối cảnh cho AI
        const context = {
            hasDrawings: drawingData.drawings.length > 0,
            drawingCount: drawingData.drawings.length,
            constraintCount: drawingData.constraints.length,
            existingObjects: Object.keys(simContext.labObjects)
        };

        // Gọi API
        const response = await AI.callGeminiAPI(promptText, context);
        UI.displayAIResponse(response.explanation);

        // Thực thi các function calls
        if (response.functionCalls && response.functionCalls.length > 0) {
            UI.updateStatus("AI đang thực hiện hành động...", "info");
            for (const funcCall of response.functionCalls) {
                const { name, args } = funcCall;
                if (AppState.activeToolImplementations[name]) {
                    console.log(`Calling tool: ${name} with args:`, args);
                    // Xử lý đặc biệt cho createSceneFromDrawings
                    if (name === 'createSceneFromDrawings') {
                        AppState.activeToolImplementations[name](args, drawingData.drawings, drawingData.constraints);
                        Drawing.clearDrawings(); // Xóa bản vẽ sau khi đã tạo cảnh
                    } else {
                        AppState.activeToolImplementations[name](args);
                    }
                } else {
                    console.warn(`Không tìm thấy công cụ: ${name}`);
                }
            }
        }
        UI.updateStatus("Hoàn thành!", "success");
    } catch (error) {
        UI.updateStatus(`Lỗi API: ${error.message}.`, "error");
    } finally {
        UI.setAILoading(false);
    }
}

/**
 * Dọn dẹp toàn bộ canvas và trạng thái.
 */
function handleClear() {
    Simulation.clearSimulation();
    Drawing.clearDrawings();
    UI.displayObjectDetails(null); // Xóa thông tin vật thể
    UI.updateStatus("Đã dọn dẹp.", "info");
}

/**
 * Xử lý khi có một vật thể được chọn trong mô phỏng.
 * @param {Matter.Body | null} body - Vật thể được chọn.
 */
function handleBodySelected(body) {
    AppState.selectedBody = body;
    const simContext = Simulation.getSimulationContext();
    UI.displayObjectDetails(body, simContext.runner, simContext.pixelsToWorld);
}


// ============================================
// KHỞI TẠO ỨNG DỤNG
// ============================================
function init() {
    const canvasContainer = document.getElementById('canvas-container');

    // 1. Khởi tạo thế giới mô phỏng
    Simulation.initializeSimulation(canvasContainer);
    const simContext = Simulation.getSimulationContext();

    // 2. Khởi tạo module vẽ và kết nối nó với simulation
    Drawing.initializeDrawing(simContext.render, simContext.mouseConstraint);
    
    // Kết nối sự kiện 'afterRender' của simulation với hàm vẽ của drawing
    Matter.Events.on(simContext.render, 'afterRender', () => {
        // Logic vẽ lưới (nếu cần) có thể thêm ở đây
        Drawing.renderBlueprints();
    });

    // Kết nối sự kiện 'beforeUpdate' của simulation để cập nhật UI
    Matter.Events.on(simContext.engine, 'beforeUpdate', () => {
        UI.updateChart(AppState.selectedBody, simContext.runner, simContext.pixelsToWorld, AppState.isSimulationRunning);
    });

    // 3. Khởi tạo giao diện người dùng và truyền vào các hàm xử lý
    UI.initializeUI({
        onModeChange: loadMode,
        onSendPrompt: handleSendPrompt,
        onClear: handleClear,
        onReset: Simulation.resetSimulation,
        onPlayPause: () => {
            AppState.isSimulationRunning = Simulation.toggleSimulation();
            return AppState.isSimulationRunning;
        },
        onTimeScaleChange: Simulation.setTimeScale,
        onToolToggle: Drawing.toggleDrawTool,
        onDrawingPropertiesChange: Drawing.updateSelectedDrawingProperties,
    });
    
    // 4. Kết nối các sự kiện từ module con với main
    Simulation.onBodySelected(handleBodySelected);
    Drawing.onDrawingSelected((index, position) => {
        if (index !== -1) {
            const drawingData = Drawing.getDrawingData();
            const props = drawingData.drawings[index]?.properties;
            UI.showPropertyPanel(props, position);
        } else {
            UI.hidePropertyPanel();
        }
    });

    // 5. Tải chế độ mặc định
    loadMode('physics');

    // Kích hoạt icon
    lucide.createIcons();
}

// Chạy ứng dụng khi trang đã tải xong
window.addEventListener('load', init);
