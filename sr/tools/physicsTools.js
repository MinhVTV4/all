/**
 * @file Gói công cụ cho lĩnh vực Vật lý.
 * Chứa các định nghĩa hàm (function declarations) cho AI
 * và logic thực thi (tool implementations) cho các hàm đó.
 */

// ==========================================================
// PHẦN 1: ĐỊNH NGHĨA CÔNG CỤ CHO AI (Function Declarations)
// Đây là "thực đơn" các hành động mà AI có thể yêu cầu.
// ==========================================================
export const functionDeclarations = [
    { name: "clearSimulation", description: "Dọn dẹp, xóa tất cả các vật thể." },
    { 
        name: "createBox", 
        description: "Tạo một vật thể hình hộp.", 
        parameters: { 
            type: "OBJECT", 
            properties: { 
                width_m: { type: "NUMBER" }, 
                height_m: { type: "NUMBER" }, 
                x_m: { type: "NUMBER" }, 
                y_m: { type: "NUMBER" }, 
                label: { type: "STRING" }, 
                mass: { type: "NUMBER" }, 
                restitution: { type: "NUMBER" }, 
                isStatic: { type: "BOOLEAN"}, 
                velocityX: { type: "NUMBER" }, 
                velocityY: { type: "NUMBER" } 
            }, 
            required: ["x_m", "y_m"] 
        }
    },
    { 
        name: "createBall", 
        description: "Tạo một vật thể hình tròn.", 
        parameters: { 
            type: "OBJECT", 
            properties: { 
                radius_m: { type: "NUMBER" }, 
                x_m: { type: "NUMBER" }, 
                y_m: { type: "NUMBER" }, 
                label: { type: "STRING" }, 
                mass: { type: "NUMBER" }, 
                restitution: { type: "NUMBER"}, 
                velocityX: { type: "NUMBER" }, 
                velocityY: { type: "NUMBER" } 
            }, 
            required: ["x_m", "y_m"] 
        }
    },
    { 
        name: "createPendulum", 
        description: "Tạo một con lắc đơn.", 
        parameters: { 
            type: "OBJECT", 
            properties: { 
                length_m: { type: "NUMBER" }, 
                anchorX_m: { type: "NUMBER" }, 
                anchorY_m: { type: "NUMBER" }, 
                label: { type: "STRING" }
            }, 
            required: ["length_m", "anchorX_m", "anchorY_m"] 
        }
    },
    { 
        name: "createSpringPendulum", 
        description: "Tạo một con lắc lò xo.", 
        parameters: { 
            type: "OBJECT", 
            properties: { 
                anchorX_m: { type: "NUMBER" }, 
                anchorY_m: { type: "NUMBER" }, 
                mass: { type: "NUMBER" }, 
                stiffness: { type: "NUMBER" }, 
                label: { type: "STRING" } 
            }, 
            required: ["anchorX_m", "anchorY_m"] 
        }
    },
    { 
        name: "createLever", 
        description: "Tạo một đòn bẩy.", 
        parameters: { 
            type: "OBJECT", 
            properties: { 
                length_m: { type: "NUMBER" }, 
                fulcrumX_m: { type: "NUMBER" }, 
                fulcrumY_m: { type: "NUMBER" }, 
                barLabel: { type: "STRING" } 
            }, 
            required: ["length_m", "fulcrumX_m", "fulcrumY_m"] 
        }
    },
    { 
        name: "createInclinedPlane", 
        description: "Tạo một mặt phẳng nghiêng.", 
        parameters: { 
            type: "OBJECT", 
            properties: { 
                angle_deg: { type: "NUMBER" }, 
                x_m: { type: "NUMBER" }, 
                length_m: { type: "NUMBER" } 
            }, 
            required: ["angle_deg", "x_m", "length_m"] 
        }
    },
    { 
        name: "setVelocity", 
        description: "Thiết lập vận tốc cho vật thể.", 
        parameters: { 
            type: "OBJECT", 
            properties: { 
                label: { type: "STRING" }, 
                velocityX: { type: "NUMBER" }, 
                velocityY: { type: "NUMBER" } 
            }, 
            required: ["label"] 
        }
    },
    { 
        name: "applyForce", 
        description: "Tác dụng một lực tức thời lên một vật thể.", 
        parameters: { 
            type: "OBJECT", 
            properties: { 
                label: { type: "STRING" }, 
                forceX: { type: "NUMBER" }, 
                forceY: { type: "NUMBER" } 
            }, 
            required: ["label"] 
        }
    },
    { 
        name: "createSceneFromDrawings", 
        description: "Biến hình vẽ thành vật thể vật lý.", 
        parameters: { 
            type: "OBJECT", 
            properties: { 
                objects: { 
                    type: "ARRAY", 
                    items: { 
                        type: "OBJECT", 
                        properties: { 
                            drawingIndex: { type: "NUMBER" }, 
                            label: { type: "STRING" }, 
                            mass: { type: "NUMBER" }, 
                            restitution: { type: "NUMBER" }, 
                            friction: { type: "NUMBER" }, 
                            isStatic: { type: "BOOLEAN" } 
                        }, 
                        required: ["drawingIndex"] 
                    } 
                } 
            } 
        } 
    },
    { 
        name: "createConstraint", 
        description: "Tạo một liên kết (khớp nối hoặc lò xo).", 
        parameters: { 
            type: "OBJECT", 
            properties: { 
                labelA: { type: "STRING" }, 
                labelB: { type: "STRING" }, 
                anchorX: { type: "NUMBER" }, 
                anchorY: { type: "NUMBER" }, 
                type: { type: "STRING" } 
            }, 
            required: ["type"] 
        } 
    },
    { 
        name: "modifyObject", 
        description: "Thay đổi thuộc tính của một vật thể.", 
        parameters: { 
            type: "OBJECT", 
            properties: { 
                label: { type: "STRING" }, 
                properties: { 
                    type: "OBJECT", 
                    properties: { 
                        mass: { type: "NUMBER" }, 
                        restitution: { type: "NUMBER" }, 
                        friction: { type: "NUMBER" }, 
                        isStatic: { type: "BOOLEAN" }, 
                        angle_deg: { type: "NUMBER" }, 
                        label: { type: "STRING" } 
                    } 
                } 
            }, 
            required: ["label", "properties"] 
        } 
    },
    { 
        name: "deleteObject", 
        description: "Xóa một vật thể.", 
        parameters: { 
            type: "OBJECT", 
            properties: { 
                label: { type: "STRING" } 
            }, 
            required: ["label"] 
        } 
    },
    {
        name: "createAtwoodMachine",
        description: "Tạo một hệ ròng rọc đơn (máy Atwood) với hai vật nặng.",
        parameters: {
            type: "OBJECT",
            properties: {
                pulleyX_m: { type: "NUMBER", description: "Tọa độ X của ròng rọc (mét)." },
                pulleyY_m: { type: "NUMBER", description: "Tọa độ Y của ròng rọc (mét)." },
                massA: { type: "NUMBER", description: "Khối lượng của vật A (kg)." },
                labelA: { type: "STRING", description: "Nhãn của vật A." },
                massB: { type: "NUMBER", description: "Khối lượng của vật B (kg)." },
                labelB: { type: "STRING", description: "Nhãn của vật B." }
            },
            required: ["pulleyX_m", "pulleyY_m", "massA", "labelA", "massB", "labelB"]
        }
    },
    {
        name: "createRope",
        description: "Tạo một sợi dây đàn hồi giữa hai điểm.",
        parameters: {
            type: "OBJECT",
            properties: {
                startX_m: { type: "NUMBER" },
                startY_m: { type: "NUMBER" },
                endX_m: { type: "NUMBER" },
                endY_m: { type: "NUMBER" },
                segments: { type: "NUMBER", description: "Số lượng đoạn dây." },
                label: { type: "STRING" }
            },
            required: ["startX_m", "startY_m", "endX_m", "endY_m", "segments", "label"]
        }
    },
    {
        name: "startWave",
        description: "Bắt đầu tạo sóng cơ học trên một sợi dây đã tồn tại.",
        parameters: {
            type: "OBJECT",
            properties: {
                ropeLabel: { type: "STRING", description: "Nhãn của sợi dây cần tạo sóng." },
                amplitude_m: { type: "NUMBER", description: "Biên độ của sóng (mét)." },
                frequency_hz: { type: "NUMBER", description: "Tần số của sóng (Hz)." }
            },
            required: ["ropeLabel", "amplitude_m", "frequency_hz"]
        }
    }
];


// ==========================================================
// PHẦN 2: LOGIC THỰC THI CÔNG CỤ (Tool Implementations)
// Đây là các hàm JavaScript thực sự, được gọi khi AI yêu cầu.
// Nó cần một "context" (bối cảnh) để có thể tương tác với
// thế giới mô phỏng (engine, world, Bodies, labObjects...).
// ==========================================================
export function getToolImplementations(context) {
    // context chứa: { engine, world, Bodies, Body, World, Constraint, Composite, Composites, Vertices, labObjects, saveInitialState, worldToPixels, scaleToPixels, activeWaveGenerators }
    const { 
        world, Bodies, Body, World, Constraint, Composite, Composites, Vertices, 
        labObjects, saveInitialState, worldToPixels, scaleToPixels, activeWaveGenerators 
    } = context;

    return {
        clearSimulation: () => {
            World.clear(world);
            Object.keys(labObjects).forEach(key => delete labObjects[key]);
            Object.keys(activeWaveGenerators).forEach(key => delete activeWaveGenerators[key]);
            // Việc xóa biểu đồ và reset trạng thái khác sẽ được xử lý ở module simulation.js
            return { success: true, message: "Đã dọn dẹp không gian." };
        },
        createBox: ({ width_m, height_m, x_m, y_m, isStatic, label, mass, restitution, velocityX, velocityY }) => {
            const pos_px = worldToPixels({ x_m, y_m });
            const options = { isStatic: isStatic === true, restitution: typeof restitution === 'number' ? restitution : 0.5, label, render: { fillStyle: '#3b82f6' } };
            const box = Bodies.rectangle(pos_px.x, pos_px.y, scaleToPixels(width_m || 0.2), scaleToPixels(height_m || 0.2), options);
            if (mass) Body.setMass(box, mass);
            if (label) labObjects[label] = box;
            if (velocityX || velocityY) {
                const vel = { x: velocityX || 0, y: -(velocityY || 0) };
                Body.setVelocity(box, vel);
            }
            World.add(world, box);
            saveInitialState(box);
            return { success: true, message: `Đã tạo hộp '${label || ''}'.` };
        },
        createBall: ({ radius_m, x_m, y_m, label, mass, restitution, velocityX, velocityY }) => {
            const pos_px = worldToPixels({ x_m, y_m });
            const options = { restitution: typeof restitution === 'number' ? restitution : 0.8, label, render: { fillStyle: '#ec4899' } };
            const ball = Bodies.circle(pos_px.x, pos_px.y, scaleToPixels(radius_m || 0.1), options);
            if (mass) Body.setMass(ball, mass);
            if (label) labObjects[label] = ball;
             if (velocityX || velocityY) {
                const vel = { x: velocityX || 0, y: -(velocityY || 0) };
                Body.setVelocity(ball, vel);
            }
            World.add(world, ball);
            saveInitialState(ball);
            return { success: true, message: `Đã tạo bóng '${label || ''}'.` };
        },
        createPendulum: ({ length_m, anchorX_m, anchorY_m, label }) => {
            const anchor_px = worldToPixels({ x_m: anchorX_m, y_m: anchorY_m });
            const ball = Bodies.circle(anchor_px.x, anchor_px.y + scaleToPixels(length_m), scaleToPixels(0.15), { restitution: 0.9, friction: 0.001, density: 0.02, render: { fillStyle: '#f59e0b' }, label });
            if (label) labObjects[label] = ball;
            const constraint = Constraint.create({ pointA: anchor_px, bodyB: ball, length: scaleToPixels(length_m), stiffness: 0.9, render: { strokeStyle: '#94a3b8', lineWidth: 2 } });
            World.add(world, [ball, constraint]);
            saveInitialState(ball);
            return { success: true, message: `Đã tạo con lắc.` };
        },
        createSpringPendulum: ({ anchorX_m, anchorY_m, mass, stiffness, label }) => {
            const anchor_px = worldToPixels({ x_m: anchorX_m, y_m: anchorY_m });
            const ball = Bodies.circle(anchor_px.x, anchor_px.y + scaleToPixels(2.0), scaleToPixels(0.2), { render: { fillStyle: '#0891b2' }, label });
            Body.setMass(ball, mass || 1);
            if (label) labObjects[label] = ball;
            const spring = Constraint.create({ pointA: anchor_px, bodyB: ball, stiffness: stiffness || 0.05, damping: 0.02, render: { strokeStyle: '#6b7280', lineWidth: 3, type: 'spring' } });
            World.add(world, [ball, spring]);
            saveInitialState(ball);
            return { success: true, message: `Đã tạo con lắc lò xo.` };
        },
        createLever: ({ length_m, fulcrumX_m, fulcrumY_m, barLabel }) => {
            const barPos_px = worldToPixels({x_m: fulcrumX_m, y_m: fulcrumY_m + 0.1});
            const leverBar = Bodies.rectangle(barPos_px.x, barPos_px.y, scaleToPixels(length_m), scaleToPixels(0.1), { render: { fillStyle: '#64748b' }, label: barLabel, friction: 0.01 });
            if (barLabel) labObjects[barLabel] = leverBar;
            const fulcrumPos_px = worldToPixels({x_m: fulcrumX_m, y_m: fulcrumY_m - 0.15 });
            const fulcrum = Bodies.trapezoid(fulcrumPos_px.x, fulcrumPos_px.y, scaleToPixels(0.3), scaleToPixels(0.3), 1, { isStatic: true, render: { fillStyle: '#475569' } });
            const pivot_px = worldToPixels({x_m: fulcrumX_m, y_m: fulcrumY_m});
            const constraint = Constraint.create({ pointA: { x: pivot_px.x, y: pivot_px.y }, bodyB: leverBar, length: 0, stiffness: 1 });
            World.add(world, [leverBar, fulcrum, constraint]);
            saveInitialState(leverBar);
            return { success: true, message: `Đã tạo đòn bẩy.`};
        },
        createInclinedPlane: ({ angle_deg, x_m, length_m }) => {
            const angle_rad = -angle_deg * (Math.PI / 180);
            const width_px = scaleToPixels(length_m);
            const height_px = 10;
            const ground_y_m = 0.1;
            const start_pos_px = worldToPixels({x_m: x_m, y_m: ground_y_m});
            const center_x_px = start_pos_px.x + (width_px / 2) * Math.cos(angle_rad);
            const center_y_px = start_pos_px.y + (width_px / 2) * Math.sin(angle_rad);
            const plane = Bodies.rectangle(center_x_px, center_y_px, width_px, height_px, { isStatic: true, angle: angle_rad, friction: 1.0, render: { fillStyle: '#475569' } });
            World.add(world, plane);
            return { success: true, message: `Đã tạo mặt phẳng nghiêng ${angle_deg} độ.` };
        },
        setVelocity: ({ label, velocityX, velocityY }) => {
            const body = labObjects[label];
            if (!body) return { success: false, message: `Không tìm thấy vật thể có nhãn '${label}'.`};
            const vel = { x: velocityX || 0, y: -(velocityY || 0) };
            Body.setVelocity(body, vel);
            return { success: true, message: `Đã đặt vận tốc cho '${label}'.`};
        },
        createConstraint: ({ labelA, labelB, anchorX, anchorY, type = 'joint' }) => {
            const bodyA = labObjects[labelA];
            const bodyB = labObjects[labelB];
            let options = {
                bodyA, bodyB,
                stiffness: type === 'spring' ? 0.05 : 0.9,
                damping: type === 'spring' ? 0.02 : 0,
                render: { type: type === 'spring' ? 'spring' : 'line', strokeStyle: '#94a3b8' }
            };
            if (anchorX !== undefined && anchorY !== undefined) {
                options.pointA = worldToPixels({ x_m: anchorX, y_m: anchorY });
            }
            if (!bodyA && !bodyB) return { success: false, message: 'Cần ít nhất một vật thể để tạo liên kết.' };
            
            const constraint = Constraint.create(options);
            World.add(world, constraint);
            return { success: true, message: `Đã tạo ${type}.` };
        },
        createSceneFromDrawings: ({ objects }, finalizedDrawings, finalizedConstraints) => {
            if (!objects) objects = [];
            const createdBodies = [];
            finalizedDrawings.forEach((drawing, index) => {
                const obj = objects.find(o => o.drawingIndex === index) || {};
                let body;
                const props = { ...drawing.properties, ...obj };
                const options = { 
                    label: props.label, 
                    restitution: typeof props.restitution === 'number' ? props.restitution : 0.5, 
                    friction: typeof props.friction === 'number' ? props.friction : 0.1, 
                    isStatic: props.isStatic === true,
                    render: { fillStyle: '#a78bfa' } 
                };
                switch (drawing.type) {
                    case 'freeform':
                        if (!drawing.path || drawing.path.length < 3) { createdBodies[index] = null; return; }
                        const vertices = Vertices.clockwiseSort(drawing.path);
                        const center = Vertices.centre(vertices);
                        body = Bodies.fromVertices(center.x, center.y, [vertices], options);
                        break;
                    case 'box': body = Bodies.rectangle(drawing.x + drawing.w / 2, drawing.y + drawing.h / 2, drawing.w, drawing.h, options); break;
                    case 'circle': body = Bodies.circle(drawing.x, drawing.y, drawing.r, options); break;
                    case 'wall':
                        const wallCenter = { x: (drawing.x1 + drawing.x2) / 2, y: (drawing.y1 + drawing.y2) / 2 };
                        const dx = drawing.x2 - drawing.x1; const dy = drawing.y2 - drawing.y1;
                        const length = Math.sqrt(dx*dx + dy*dy); const angle = Math.atan2(dy, dx);
                        body = Bodies.rectangle(wallCenter.x, wallCenter.y, length, 10, { ...options, angle, isStatic: true });
                        break;
                }
                if (body) {
                    const mass = typeof props.mass === 'number' ? props.mass : null;
                    if (mass) Body.setMass(body, mass);
                    if (props.label) labObjects[props.label] = body;
                    World.add(world, body);
                    saveInitialState(body);
                    createdBodies[index] = body;
                }
            });

            finalizedConstraints.forEach(constraint => {
                const bodyA = constraint.indexA !== -1 ? createdBodies[constraint.indexA] : null;
                const bodyB = constraint.indexB !== -1 ? createdBodies[constraint.indexB] : null;
                if (!bodyA && !bodyB) return;
                const constraintOptions = {
                    stiffness: constraint.type === 'spring' ? 0.05 : 1,
                    damping: constraint.type === 'spring' ? 0.02 : 0,
                    render: { type: constraint.type === 'spring' ? 'spring' : 'line', strokeStyle: '#94a3b8', lineWidth: 2 }
                };
                if (bodyA) {
                    constraintOptions.bodyA = bodyA;
                    constraintOptions.pointA = { x: constraint.pointA.x - bodyA.position.x, y: constraint.pointA.y - bodyA.position.y };
                } else {
                    constraintOptions.pointA = constraint.pointA;
                }
                if (bodyB) {
                    constraintOptions.bodyB = bodyB;
                    constraintOptions.pointB = { x: constraint.pointB.x - bodyB.position.x, y: constraint.pointB.y - bodyB.position.y };
                } else {
                    constraintOptions.pointB = constraint.pointB;
                }
                if (!constraintOptions.bodyA) {
                    constraintOptions.bodyA = constraintOptions.bodyB;
                    constraintOptions.pointA = constraintOptions.pointB;
                    constraintOptions.bodyB = null;
                    constraintOptions.pointB = constraint.pointA;
                }
                World.add(world, Constraint.create(constraintOptions));
            });

            return { success: true, message: `Đã tạo cảnh từ hình vẽ.` };
        },
        applyForce: ({ label, forceX, forceY }) => {
            const body = labObjects[label];
            if (!body) return { success: false, message: `Không tìm thấy vật thể có nhãn '${label}'.`};
            const scaledForce = { x: (forceX || 0) * 0.005, y: -(forceY || 0) * 0.005 };
            Body.applyForce(body, body.position, scaledForce);
            return { success: true, message: `Đã tác dụng lực (${forceX}, ${forceY})N lên '${label}'.`};
        },
        modifyObject: ({ label, properties }) => {
            const body = labObjects[label];
            if (!body) return { success: false, message: `Không tìm thấy vật thể '${label}'.` };

            let messages = [];
            for (const key in properties) {
                const value = properties[key];
                if (value === undefined || value === null) continue;

                switch (key) {
                    case 'mass': Body.setMass(body, value); messages.push(`khối lượng thành ${value}kg`); break;
                    case 'restitution': body.restitution = value; messages.push(`độ đàn hồi thành ${value}`); break;
                    case 'friction': body.friction = value; messages.push(`ma sát thành ${value}`); break;
                    case 'isStatic': Body.setStatic(body, value); messages.push(`trạng thái tĩnh thành ${value}`); break;
                    case 'angle_deg': Body.setAngle(body, value * (Math.PI / 180)); messages.push(`góc thành ${value} độ`); break;
                    case 'label':
                        delete labObjects[label];
                        body.label = value;
                        labObjects[value] = body;
                        label = value;
                        messages.push(`nhãn thành '${value}'`);
                        break;
                    default: console.warn(`Thuộc tính không được hỗ trợ: ${key}`);
                }
            }
            saveInitialState(body);
            return { success: true, message: `Đã cập nhật ${messages.join(', ')} cho vật thể '${label}'.` };
        },
        deleteObject: ({ label }) => {
            const body = labObjects[label];
            if (!body) return { success: false, message: `Không tìm thấy vật thể '${label}'.` };
            World.remove(world, body);
            delete labObjects[label];
            // initialStates sẽ được xử lý ở module simulation
            return { success: true, message: `Đã xóa vật thể '${label}'.` };
        },
        createAtwoodMachine: ({ pulleyX_m, pulleyY_m, massA, labelA, massB, labelB }) => {
            const pulleyPos = worldToPixels({ x_m: pulleyX_m, y_m: pulleyY_m });
            const radius = scaleToPixels(0.3);

            const pulley = Bodies.circle(pulleyPos.x, pulleyPos.y, radius, { isStatic: true, render: { fillStyle: '#84cc16' } });
            const support = Bodies.rectangle(pulleyPos.x, pulleyPos.y - radius, 10, 20, { isStatic: true, render: { fillStyle: '#a8a29e' } });
            
            const bodyA = Bodies.rectangle(pulleyPos.x - radius, pulleyPos.y + radius * 3, 40, 40, { mass: massA, label: labelA, render: { fillStyle: '#f97316' } });
            const bodyB = Bodies.rectangle(pulleyPos.x + radius, pulleyPos.y + radius * 3, 40, 40, { mass: massB, label: labelB, render: { fillStyle: '#6366f1' } });

            if (labelA) labObjects[labelA] = bodyA;
            if (labelB) labObjects[labelB] = bodyB;

            const atwoodComposite = Composite.create({ label: 'AtwoodMachine' });
            Composite.add(atwoodComposite, [pulley, support, bodyA, bodyB]);

            const constraintA = Constraint.create({
                pointA: { x: pulleyPos.x - radius, y: pulleyPos.y },
                bodyB: bodyA,
                pointB: { x: 0, y: -20 },
                stiffness: 1,
                render: { visible: true, strokeStyle: '#a8a29e' }
            });
            const constraintB = Constraint.create({
                pointA: { x: pulleyPos.x + radius, y: pulleyPos.y },
                bodyB: bodyB,
                pointB: { x: 0, y: -20 },
                stiffness: 1,
                render: { visible: true, strokeStyle: '#a8a29e' }
            });
            
            const rope = Constraint.create({
                bodyA: bodyA,
                bodyB: bodyB,
                length: scaleToPixels(4), 
                stiffness: 0.1,
                render: { visible: false }
            });

            Composite.add(atwoodComposite, [constraintA, constraintB, rope]);
            World.add(world, atwoodComposite);
            
            saveInitialState(bodyA);
            saveInitialState(bodyB);

            return { success: true, message: `Đã tạo máy Atwood với '${labelA}' (${massA}kg) và '${labelB}' (${massB}kg).` };
        },
        createRope: ({ startX_m, startY_m, endX_m, endY_m, segments, label }) => {
            const start = worldToPixels({ x_m: startX_m, y_m: startY_m });
            const end = worldToPixels({ x_m: endX_m, y_m: endY_m });
            
            const rope = Composites.stack(start.x, start.y, segments, 1, 10, 10, (x, y) => {
                return Bodies.rectangle(x, y, 20, 5, { 
                    frictionAir: 0.01, 
                    density: 0.001,
                    render: { fillStyle: '#f59e0b' }
                });
            });
            
            Composites.chain(rope, 0.5, 0, -0.5, 0, { stiffness: 1, length: 0, render: { visible: false } });
            
            const firstBody = rope.bodies[0];
            const lastBody = rope.bodies[rope.bodies.length - 1];

            const startConstraint = Constraint.create({
                bodyB: firstBody,
                pointB: { x: -10, y: 0 },
                pointA: { x: start.x, y: start.y },
                stiffness: 0.9
            });

            const endConstraint = Constraint.create({
                bodyB: lastBody,
                pointB: { x: 10, y: 0 },
                pointA: { x: end.x, y: end.y },
                stiffness: 0.9
            });
            
            rope.startConstraint = startConstraint;
            Composite.add(rope, [startConstraint, endConstraint]);
            
            World.add(world, rope);
            labObjects[label] = rope;

            return { success: true, message: `Đã tạo sợi dây '${label}'.` };
        },
        startWave: ({ ropeLabel, amplitude_m, frequency_hz }) => {
            const rope = labObjects[ropeLabel];
            if (!rope || rope.type !== 'composite' || !rope.startConstraint) {
                return { success: false, message: `Không tìm thấy sợi dây '${ropeLabel}' hoặc sợi dây không hợp lệ.` };
            }
            
            const amplitude_px = scaleToPixels(amplitude_m);
            const startConstraint = rope.startConstraint;
            const originalAnchorY = startConstraint.pointA.y;

            activeWaveGenerators[ropeLabel] = (time) => {
                const dy = amplitude_px * Math.sin((time / 1000) * frequency_hz * 2 * Math.PI);
                startConstraint.pointA.y = originalAnchorY - dy;
            };
            
            return { success: true, message: `Bắt đầu tạo sóng trên sợi dây '${ropeLabel}'.` };
        },
    };
}
