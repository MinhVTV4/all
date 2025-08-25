/**
 * @file Quản lý tương tác với Gemini AI.
 * Khởi tạo model, gửi prompt và xử lý function calling.
 */

// Import các hàm cần thiết từ Firebase AI SDK
// **SỬA LỖI**: Thêm getApps và getApp để kiểm tra khởi tạo an toàn
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAI, getGenerativeModel, GoogleAIBackend } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-ai.js";

// Biến để lưu trữ model và phiên chat đang hoạt động
let modelWithTools;
let chat;

// Cấu hình Firebase (lấy từ mã nguồn gốc)
const firebaseConfig = {
    apiKey: "AIzaSyCC0w9keePLXHeZMguYs6ILCGOFz1YKzOk", // Cảnh báo: Khóa API này nên được bảo mật hơn trong môi trường production.
    authDomain: "ai-test-b4da5.firebaseapp.com",
    projectId: "ai-test-b4da5",
    storageBucket: "ai-test-b4da5.firebasestorage.app",
    messagingSenderId: "333336470148",
    appId: "1:333336470148:web:b381696bd4568699b158d1"
};

/**
 * **SỬA LỖI**: Hàm khởi tạo Firebase an toàn.
 * Kiểm tra xem app đã tồn tại chưa, nếu chưa thì mới khởi tạo.
 * @returns {FirebaseApp} - Instance của Firebase App.
 */
function getFirebaseApp() {
    if (getApps().length === 0) {
        return initializeApp(firebaseConfig);
    } else {
        return getApp(); // Lấy app đã được khởi tạo
    }
}


/**
 * Khởi tạo hoặc khởi tạo lại mô hình AI với một bộ công cụ cụ thể.
 * @param {Array} functionDeclarations - Mảng các định nghĩa hàm cho AI.
 */
export function initializeAIModel(functionDeclarations) {
    try {
        // **SỬA LỖI**: Sử dụng hàm khởi tạo an toàn
        const app = getFirebaseApp();
        
        // Lấy AI instance và khởi tạo model với bộ công cụ được cung cấp
        const ai = getAI(app, { backend: new GoogleAIBackend() });
        modelWithTools = getGenerativeModel(ai, { 
            model: "gemini-2.5-flash", 
            tools: [{ functionDeclarations }] 
        });
        
        // Bắt đầu một phiên chat mới
        chat = modelWithTools.startChat();
        console.log("AI Model đã được khởi tạo với bộ công cụ mới.");

    } catch (e) {
        console.error("Lỗi khởi tạo AI Model:", e);
        // Cần có một hàm để hiển thị lỗi này ra UI
    }
}

/**
 * Gửi yêu cầu đến Gemini AI và nhận về các hành động cần thực thi.
 * @param {string} promptText - Yêu cầu bằng văn bản của người dùng.
 * @param {object} context - Thông tin bổ sung (vd: có bản vẽ không, các vật thể đang tồn tại).
 * @returns {Promise<object>} - Một đối tượng chứa explanation và functionCalls.
 */
export async function callGeminiAPI(promptText, context = {}) {
    if (!chat) {
        console.error("Mô hình AI chưa được khởi tạo.");
        throw new Error("Mô hình AI chưa được khởi tạo.");
    }

    let finalPrompt = promptText;

    // Xây dựng bối cảnh cho AI dựa trên trạng thái ứng dụng
    if (context.hasDrawings) {
        let drawingContext = `Bối cảnh: Người dùng đã vẽ ${context.drawingCount} hình và ${context.constraintCount} liên kết. Nhiệm vụ của bạn là phân tích các hình vẽ và yêu cầu của người dùng để tạo ra một kịch bản vật lý thực tế.`;
        drawingContext += `\n1. **Phân tích Hình dạng:** Xác định vai trò của mỗi hình vẽ. Ví dụ, một hình tam giác hoặc một hình nhỏ nằm dưới một thanh dài có thể là một điểm tựa (fulcrum). Một thanh dài có thể là đòn bẩy (lever). Một hình tròn có thể là quả bóng (ball).`;
        drawingContext += `\n2. **Gọi Hàm createSceneFromDrawings:** Gọi hàm này để tạo tất cả các vật thể. Khi gọi, hãy chỉ định các thuộc tính quan trọng như \`isStatic: true\` cho các vật thể nền tảng.`;
        
        if (promptText) {
            drawingContext += `\n\nYêu cầu cụ thể của người dùng là: "${promptText}". Hãy sử dụng thông tin này để thực hiện các bước trên.`;
        } else {
            drawingContext += `\n\nNgười dùng không cung cấp yêu cầu cụ thể, hãy tự suy luận vai trò của các vật thể dựa trên hình dạng và vị trí của chúng.`;
        }
        finalPrompt = drawingContext;
    } else if (context.existingObjects && context.existingObjects.length > 0) {
        const existingLabels = context.existingObjects.join(', ');
        finalPrompt = `Bối cảnh: Các vật thể sau đã tồn tại trong mô phỏng: ${existingLabels}. ${promptText}`;
    }

    try {
        const result = await chat.sendMessage(finalPrompt);
        const response = result.response;
        
        // Trả về cả phần text giải thích và các lệnh gọi hàm
        return {
            explanation: response.text(),
            functionCalls: response.functionCalls() || []
        };
    } catch (error) {
        console.error("Lỗi khi gọi Gemini API:", error);
        throw error; // Ném lỗi ra để nơi gọi có thể xử lý
    }
}
