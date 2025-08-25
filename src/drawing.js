/**
 * @file Quản lý toàn bộ logic vẽ "bản thiết kế" (blueprint) lên canvas.
 * Bao gồm việc xử lý sự kiện chuột, quản lý trạng thái vẽ, và render các hình dạng tạm thời.
 */

// Lấy Vertices từ biến Matter toàn cục để tính toán hình học
const { Vertices } = Matter;

// ============================================
// BIẾN TRẠNG THÁI CỦA MODULE
// ============================================
let render; // Tham chiếu đến đối tượng render của Matter.js
let mouseConstraint; // Tham chiếu đến mouseConstraint để bật/tắt kéo thả

// Trạng thái vẽ
let activeDrawTool = null;
let isDrawing = false;
let drawStartPoint = null;
let currentDrawing = {};

// Dữ liệu các bản vẽ đã hoàn thành
let finalizedDrawings = [];
let finalizedConstraints = [];

// Trạng thái chọn và kết nối
let selectedDrawingIndex = -1;
let firstConnectionPoint = null;
let firstConnectionDrawingIndex = null;

// Callbacks để giao tiếp với các module khác
let onDrawingSelectedCallback = () => {};

// ============================================
// CÁC HÀM XỬ LÝ SỰ KIỆN VẼ
// ============================================

function startDraw(event) {
    if (!activeDrawTool) return;
    isDrawing = true;
    drawStartPoint = { x: event.offsetX, y: event.offsetY };
    currentDrawing = { type: activeDrawTool, properties: {} };
    if (activeDrawTool === 'freeform') {
        currentDrawing.path = [drawStartPoint];
    }
}

function draw(event) {
    if (!isDrawing || !drawStartPoint) return;
    const currentPoint = { x: event.offsetX, y: event.offsetY };
    switch (activeDrawTool) {
        case 'freeform':
            currentDrawing.path.push(currentPoint);
            break;
        case 'box':
            currentDrawing.x = Math.min(drawStartPoint.x, currentPoint.x);
            currentDrawing.y = Math.min(drawStartPoint.y, currentPoint.y);
            currentDrawing.w = Math.abs(drawStartPoint.x - currentPoint.x);
            currentDrawing.h = Math.abs(drawStartPoint.y - currentPoint.y);
            break;
        case 'circle':
            currentDrawing.x = drawStartPoint.x;
            currentDrawing.y = drawStartPoint.y;
            const dx = currentPoint.x - drawStartPoint.x;
            const dy = currentPoint.y - drawStartPoint.y;
            currentDrawing.r = Math.sqrt(dx * dx + dy * dy);
            break;
        case 'wall':
            currentDrawing.x1 = drawStartPoint.x;
            currentDrawing.y1 = drawStartPoint.y;
            currentDrawing.x2 = currentPoint.x;
            currentDrawing.y2 = currentPoint.y;
            break;
    }
}

function endDraw() {
    if (!isDrawing) return;
    isDrawing = false;
    // Validate drawing before finalizing
    if (currentDrawing.type === 'circle' && (!currentDrawing.r || currentDrawing.r < 1)) { currentDrawing = {}; return; }
    if (currentDrawing.type === 'box' && (!currentDrawing.w || currentDrawing.w < 2 || !currentDrawing.h || currentDrawing.h < 2)) { currentDrawing = {}; return; }
    if (currentDrawing.type === 'wall' && currentDrawing.x1 === currentDrawing.x2 && currentDrawing.y1 === currentDrawing.y2) { currentDrawing = {}; return; }
    
    finalizedDrawings.push({ ...currentDrawing });
    currentDrawing = {};
}

function handleConnectionClick(event) {
    const point = { x: event.offsetX, y: event.offsetY };
    let clickedIndex = -1;

    // Tìm xem người dùng có click vào một hình đã vẽ không
    for (let i = finalizedDrawings.length - 1; i >= 0; i--) {
        if (isPointInDrawing(point, finalizedDrawings[i])) {
            clickedIndex = i;
            break;
        }
    }

    if (firstConnectionDrawingIndex === null) {
        // Lần click đầu tiên để bắt đầu kết nối
        firstConnectionDrawingIndex = clickedIndex;
        firstConnectionPoint = clickedIndex !== -1 ? getDrawingCenter(finalizedDrawings[clickedIndex]) : point;
    } else {
        // Lần click thứ hai để hoàn thành kết nối
        if (firstConnectionDrawingIndex === clickedIndex && clickedIndex !== -1) return; // Không cho nối một vật với chính nó

        finalizedConstraints.push({
            type: activeDrawTool,
            indexA: firstConnectionDrawingIndex,
            pointA: firstConnectionPoint,
            indexB: clickedIndex,
            pointB: clickedIndex !== -1 ? getDrawingCenter(finalizedDrawings[clickedIndex]) : point
        });

        // Reset trạng thái để chuẩn bị cho kết nối tiếp theo
        firstConnectionPoint = null;
        firstConnectionDrawingIndex = null;
        toggleDrawTool(activeDrawTool); // Tắt công cụ sau khi hoàn thành
    }
}

function handleCanvasClick(event) {
    if (activeDrawTool) return; // Chỉ xử lý click khi không có công cụ nào được chọn
    const clickPoint = { x: event.offsetX, y: event.offsetY };
    let clickedIndex = -1;

    for (let i = finalizedDrawings.length - 1; i >= 0; i--) {
        if (isPointInDrawing(clickPoint, finalizedDrawings[i])) {
            clickedIndex = i;
            break;
        }
    }

    selectedDrawingIndex = clickedIndex;
    onDrawingSelectedCallback(clickedIndex, clickPoint); // Thông báo cho UI để hiển thị/ẩn bảng thuộc tính
}


// ============================================
// CÁC HÀM TIỆN ÍCH
// ============================================

function getDrawingCenter(drawing) {
    if (!drawing) return null;
    switch (drawing.type) {
        case 'circle': return { x: drawing.x, y: drawing.y };
        case 'box': return { x: drawing.x + drawing.w / 2, y: drawing.y + drawing.h / 2 };
        case 'freeform': return Vertices.centre(drawing.path);
        case 'wall': return { x: (drawing.x1 + drawing.x2) / 2, y: (drawing.y1 + drawing.y2) / 2 };
        default: return null;
    }
}

function isPointInDrawing(point, drawing) {
    if (!drawing) return false;
    switch (drawing.type) {
        case 'circle':
            const dx = point.x - drawing.x;
            const dy = point.y - drawing.y;
            return Math.sqrt(dx * dx + dy * dy) < drawing.r;
        case 'box':
            return point.x > drawing.x && point.x < drawing.x + drawing.w && point.y > drawing.y && point.y < drawing.y + drawing.h;
        case 'freeform':
            if (!drawing.path) return false;
            let x = point.x, y = point.y;
            let inside = false;
            for (let i = 0, j = drawing.path.length - 1; i < drawing.path.length; j = i++) {
                let xi = drawing.path[i].x, yi = drawing.path[i].y;
                let xj = drawing.path[j].x, yj = drawing.path[j].y;
                let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
                if (intersect) inside = !inside;
            }
            return inside;
        case 'wall': // Tường không thể được "chọn" theo cách này
            return false;
    }
    return false;
}

// ============================================
// CÁC HÀM ĐƯỢC EXPORT (API của module)
// ============================================

/**
 * Khởi tạo module vẽ.
 * @param {object} simRender - Đối tượng render của Matter.js.
 * @param {object} simMouseConstraint - Đối tượng mouseConstraint của Matter.js.
 */
export function initializeDrawing(simRender, simMouseConstraint) {
    render = simRender;
    mouseConstraint = simMouseConstraint;
    // Gắn sự kiện click chung vào canvas để chọn hình vẽ
    render.canvas.addEventListener('click', handleCanvasClick);
}

/**
 * Bật/tắt một công cụ vẽ.
 * @param {string} tool - Tên của công cụ (vd: 'box', 'joint').
 * @returns {string|null} - Trả về công cụ đang hoạt động, hoặc null nếu không có.
 */
export function toggleDrawTool(tool) {
    const canvas = render.canvas;
    const isShapeTool = ['freeform', 'box', 'circle', 'wall'].includes(tool);
    const isConnectionTool = ['joint', 'spring'].includes(tool);

    // Tắt công cụ hiện tại nếu có
    if (activeDrawTool) {
        canvas.classList.remove('drawing-mode');
        mouseConstraint.constraint.stiffness = 0.2; // Bật lại kéo thả
        canvas.removeEventListener('mousedown', startDraw);
        canvas.removeEventListener('mousemove', draw);
        canvas.removeEventListener('mouseup', endDraw);
        canvas.removeEventListener('mousedown', handleConnectionClick);
        firstConnectionPoint = null;
        firstConnectionDrawingIndex = null;
    }

    // Nếu click lại vào công cụ đang active, chỉ cần tắt nó đi
    if (activeDrawTool === tool) {
        activeDrawTool = null;
        return null;
    }

    // Kích hoạt công cụ mới
    activeDrawTool = tool;
    canvas.classList.add('drawing-mode');
    mouseConstraint.constraint.stiffness = 0; // Tắt kéo thả

    if (isShapeTool) {
        canvas.addEventListener('mousedown', startDraw);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', endDraw);
    } else if (isConnectionTool) {
        canvas.addEventListener('mousedown', handleConnectionClick);
    }
    
    return activeDrawTool;
}

/**
 * Vẽ các "bản thiết kế" lên canvas. Hàm này được gọi trong sự kiện 'afterRender' của simulation.
 */
export function renderBlueprints() {
    const ctx = render.context;
    ctx.save();

    // Vẽ tất cả các hình đã vẽ và đang vẽ
    const allDrawings = [...finalizedDrawings, ...(isDrawing ? [currentDrawing] : [])];
    allDrawings.forEach((drawing, index) => {
        if (drawing && drawing.type) {
            ctx.strokeStyle = index === selectedDrawingIndex ? '#f59e0b' : '#34d399';
            ctx.lineWidth = index === selectedDrawingIndex ? 3 : 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            switch (drawing.type) {
                case 'freeform':
                    if (drawing.path && drawing.path.length > 1) {
                        ctx.moveTo(drawing.path[0].x, drawing.path[0].y);
                        for (let i = 1; i < drawing.path.length; i++) ctx.lineTo(drawing.path[i].x, drawing.path[i].y);
                    }
                    break;
                case 'box': ctx.rect(drawing.x, drawing.y, drawing.w, drawing.h); break;
                case 'circle': ctx.arc(drawing.x, drawing.y, drawing.r, 0, Math.PI * 2); break;
                case 'wall': ctx.moveTo(drawing.x1, drawing.y1); ctx.lineTo(drawing.x2, drawing.y2); break;
            }
            ctx.stroke();
        }
    });

    // Vẽ các kết nối đã tạo
    finalizedConstraints.forEach(constraint => {
        const posA = constraint.indexA !== -1 ? getDrawingCenter(finalizedDrawings[constraint.indexA]) : constraint.pointA;
        const posB = constraint.indexB !== -1 ? getDrawingCenter(finalizedDrawings[constraint.indexB]) : constraint.pointB;
        if (posA && posB) {
            ctx.beginPath();
            ctx.moveTo(posA.x, posA.y);
            ctx.lineTo(posB.x, posB.y);
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.stroke();
        }
    });

    // Vẽ đường nối preview
    if (firstConnectionPoint) {
        ctx.beginPath();
        ctx.moveTo(firstConnectionPoint.x, firstConnectionPoint.y);
        ctx.lineTo(render.mouse.position.x, render.mouse.position.y);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
    }
    ctx.restore();
}

/**
 * Lấy dữ liệu vẽ hiện tại để gửi cho AI.
 * @returns {object} - Chứa các mảng finalizedDrawings và finalizedConstraints.
 */
export function getDrawingData() {
    return {
        drawings: finalizedDrawings,
        constraints: finalizedConstraints
    };
}

/**
 * Xóa tất cả các bản vẽ và reset trạng thái.
 */
export function clearDrawings() {
    finalizedDrawings = [];
    finalizedConstraints = [];
    currentDrawing = {};
    isDrawing = false;
    selectedDrawingIndex = -1;
    // Thông báo cho UI ẩn bảng thuộc tính
    onDrawingSelectedCallback(-1, null);
}

/**
 * Cập nhật thuộc tính cho bản vẽ đang được chọn.
 * @param {object} properties - Đối tượng chứa các thuộc tính mới.
 */
export function updateSelectedDrawingProperties(properties) {
    if (selectedDrawingIndex !== -1 && finalizedDrawings[selectedDrawingIndex]) {
        finalizedDrawings[selectedDrawingIndex].properties = {
            ...finalizedDrawings[selectedDrawingIndex].properties,
            ...properties
        };
    }
}

/**
 * Đăng ký hàm callback khi một bản vẽ được chọn.
 * @param {Function} callback - Hàm được gọi với (index, clickPosition).
 */
export function onDrawingSelected(callback) {
    onDrawingSelectedCallback = callback;
}
