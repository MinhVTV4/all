/**
 * @file Quản lý "thế giới" mô phỏng.
 * Khởi tạo, chạy, và cung cấp các hàm tương tác với engine vật lý Matter.js.
 */

// Lấy các đối tượng cần thiết từ biến toàn cục Matter (được import trong index.html)
const { Engine, Render, Runner, World, Bodies, Composite, Mouse, MouseConstraint, Body, Events } = Matter;

// Các biến cục bộ của module để quản lý trạng thái mô phỏng
let engine;
let world;
let render;
let runner;
let mouseConstraint;

let labObjects = {}; // Lưu trữ các vật thể có nhãn để AI tham chiếu
let initialStates = new Map(); // Lưu trạng thái ban đầu để reset
let activeWaveGenerators = {}; // Lưu các hàm tạo sóng
let isSimulationRunning = true;

const PIXELS_PER_METER = 100;

// Các hàm callback để giao tiếp với các module khác (sẽ được set từ main.js)
let onBodySelectedCallback = () => {};

/**
 * Hàm tiện ích để chuyển đổi tọa độ
 */
const worldToPixels = ({ x_m, y_m }) => ({ x: x_m * PIXELS_PER_METER, y: render.options.height - (y_m * PIXELS_PER_METER) });
const pixelsToWorld = ({ x_px, y_px }) => ({ x_m: x_px / PIXELS_PER_METER, y_m: (render.options.height - y_px) / PIXELS_PER_METER });
const scaleToPixels = (meters) => meters * PIXELS_PER_METER;

/**
 * Lưu trạng thái ban đầu của một vật thể để có thể reset.
 * @param {Matter.Body} body - Vật thể cần lưu trạng thái.
 */
function saveInitialState(body) {
    if (!body || body.isStatic) return;
    initialStates.set(body.id, {
        position: { ...body.position },
        angle: body.angle,
        velocity: { x: 0, y: 0 },
        angularVelocity: 0
    });
}

/**
 * Thiết lập thế giới mô phỏng Matter.js.
 * @param {HTMLElement} container - Element HTML sẽ chứa canvas.
 */
export function initializeSimulation(container) {
    // Tạo engine và world
    engine = Engine.create();
    world = engine.world;
    engine.gravity.y = 1;

    // Tạo renderer
    render = Render.create({
        element: container,
        engine: engine,
        options: {
            width: container.clientWidth,
            height: container.clientHeight,
            wireframes: false,
            background: 'transparent'
        }
    });
    Render.run(render);

    // Tạo và chạy runner
    runner = Runner.create();
    Runner.run(runner, engine);

    // Thiết lập thế giới ban đầu (mặt đất, chuột...)
    setupWorld();

    // Lắng nghe các sự kiện của engine
    addEngineEvents();

    // Xử lý việc thay đổi kích thước cửa sổ
    new ResizeObserver(() => {
        if (!render) return;
        render.bounds.max.x = container.clientWidth;
        render.bounds.max.y = container.clientHeight;
        render.options.width = container.clientWidth;
        render.options.height = container.clientHeight;
        render.canvas.width = container.clientWidth;
        render.canvas.height = container.clientHeight;
    }).observe(container);

    console.log("Matter.js simulation initialized.");
}

/**
 * Thiết lập các thành phần cơ bản của thế giới (mặt đất, chuột).
 */
function setupWorld() {
    // Dọn dẹp thế giới cũ
    World.clear(world);
    labObjects = {};
    activeWaveGenerators = {};
    initialStates.clear();

    // Tạo mặt đất
    const groundWidthM = 50;
    const groundHeightM = 0.2;
    const groundPosPx = worldToPixels({ x_m: groundWidthM / 2, y_m: groundHeightM / 2 });
    const ground = Bodies.rectangle(groundPosPx.x, groundPosPx.y + (scaleToPixels(groundHeightM)/2), scaleToPixels(groundWidthM), scaleToPixels(groundHeightM), { isStatic: true, friction: 1.0, render: { fillStyle: '#475569' } });
    World.add(world, ground);

    // Thêm điều khiển bằng chuột
    const mouse = Mouse.create(render.canvas);
    mouseConstraint = MouseConstraint.create(engine, { mouse: mouse, constraint: { stiffness: 0.2, render: { visible: false } } });
    World.add(world, mouseConstraint);
    render.mouse = mouse;
}

/**
 * Gắn các sự kiện cần thiết vào engine.
 */
function addEngineEvents() {
    // Sự kiện sau mỗi lần render (để vẽ lưới, bản vẽ...)
    Events.on(render, 'afterRender', () => {
        // Logic vẽ lưới và các hình vẽ sẽ được gọi từ module drawing.js
    });

    // Sự kiện trước mỗi lần cập nhật (để cập nhật biểu đồ, sóng...)
    Events.on(engine, 'beforeUpdate', () => {
        const time = engine.timing.timestamp;
        for (const label in activeWaveGenerators) {
            if (activeWaveGenerators.hasOwnProperty(label)) {
                activeWaveGenerators[label](time);
            }
        }
        // Logic cập nhật biểu đồ sẽ được gọi từ module ui.js
    });

    // Sự kiện khi người dùng nhấn chuột vào một vật thể
    Events.on(mouseConstraint, 'mousedown', (event) => {
        const body = event.body ? event.body : null;
        onBodySelectedCallback(body); // Thông báo cho các module khác
    });
}


/**
 * Cung cấp một "bối cảnh" (context) chứa các đối tượng và hàm cần thiết
 * để các module khác (đặc biệt là tool implementations) có thể tương tác với thế giới mô phỏng.
 */
export function getSimulationContext() {
    return {
        engine,
        world,
        runner,
        render,
        mouseConstraint,
        // Các đối tượng của Matter.js
        Bodies,
        Body,
        World,
        Constraint,
        Composite,
        Composites,
        Events,
        Vertices,
        // Các đối tượng và hàm quản lý trạng thái
        labObjects,
        initialStates,
        activeWaveGenerators,
        saveInitialState,
        // Các hàm tiện ích
        worldToPixels,
        pixelsToWorld,
        scaleToPixels
    };
}

/**
 * Dọn dẹp hoàn toàn mô phỏng.
 */
export function clearSimulation() {
    setupWorld();
}

/**
 * Reset tất cả các vật thể về trạng thái ban đầu.
 */
export function resetSimulation() {
    for (const [id, state] of initialStates) {
        const body = Composite.get(world, id, 'body');
        if (body) {
            Body.setPosition(body, state.position);
            Body.setAngle(body, state.angle);
            Body.setVelocity(body, state.velocity);
            Body.setAngularVelocity(body, state.angularVelocity);
        }
    }
    if (!isSimulationRunning) {
        Runner.tick(runner, engine);
    }
}

/**
 * Tạm dừng hoặc tiếp tục mô phỏng.
 * @returns {boolean} - Trạng thái mới của mô phỏng (true: đang chạy).
 */
export function toggleSimulation() {
    isSimulationRunning = !isSimulationRunning;
    Runner.setRunning(runner, isSimulationRunning);
    return isSimulationRunning;
}

/**
 * Thay đổi tốc độ thời gian của mô phỏng.
 * @param {number} scale - Tốc độ thời gian (ví dụ: 1.0 là bình thường).
 */
export function setTimeScale(scale) {
    if (engine) {
        engine.timing.timeScale = scale;
    }
}

/**
 * Đăng ký một hàm callback để được gọi khi một vật thể được chọn.
 * @param {Function} callback - Hàm sẽ được gọi với đối số là vật thể được chọn (hoặc null).
 */
export function onBodySelected(callback) {
    onBodySelectedCallback = callback;
}
