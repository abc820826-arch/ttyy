// --- 1. 全域變數與配置 ---
let DICTIONARY = {}; // 初始化為空，待 JSON 載入

const LABELS = { 
    "ethnicity": "種族", "gender": "性別", "hair": "頭髮", 
    "body": "身材", "pose": "姿勢", "outfit": "服裝", "expression": "表情" 
};

const HINTS = {
    "ethnicity": "例: Japanese, Elf", "gender": "例: woman, girl", 
    "hair": "例: Blue long hair", "body": "例: Slim, Fit",
    "pose": "例: Running, Sitting", "outfit": "例: Armor, Dress",
    "expression": "例: Happy, Serious"
};

// --- 2. 核心：載入外部 JSON 詞庫 ---
async function loadLibrary() {
    try {
        // 使用 fetch 取得外部 JSON 檔案
        const response = await fetch('library.json');
        if (!response.ok) throw new Error('無法載入詞庫檔 library.json');
        
        DICTIONARY = await response.json();
        
        // 成功載入後才執行初始化渲染
        initDatalists();
        renderForm();
        console.log("詞庫載入成功!");
    } catch (error) {
        console.error("載入失敗:", error);
        alert("詞庫載入失敗！請確保使用 Live Server 開啟網頁，且 library.json 檔案存在。");
    }
}

// --- 3. UI 渲染功能 ---
function initDatalists() {
    ["genre", "vibe", "quality", "location", "lighting", "angle", "lens"].forEach(key => {
        createDatalist(`list-${key}`, DICTIONARY[key]);
    });
}

function createDatalist(id, items) {
    const dl = document.getElementById(id);
    if(!dl || !items) return;
    dl.innerHTML = items.map(item => `<option value="${item.en}">${item.zh}</option>`).join('');
}

function renderForm() {
    const container = document.getElementById('subjectsContainer');
    const num = document.getElementById('numSubjects').value;
    container.innerHTML = '';
    const attrs = ["ethnicity", "gender", "hair", "body", "outfit", "pose", "expression"];
    
    for(let i=0; i<num; i++) {
        const fieldset = document.createElement('fieldset');
        fieldset.innerHTML = `<legend>👤 角色 Subject ${i+1}</legend><div class="field-grid"></div>`;
        const grid = fieldset.querySelector('.field-grid');
        
        attrs.forEach(attr => {
            const listId = `list-s${i}-${attr}`;
            const inputId = `subject-${i}-${attr}`;
            grid.innerHTML += `
                <div class="input-unit">
                    <label>${LABELS[attr]}:</label>
                    <input type="text" id="${inputId}" list="${listId}" placeholder="選填...">
                    <datalist id="${listId}"></datalist>
                    <span class="hint">${HINTS[attr]}</span>
                </div>
            `;
            // 延遲填充 datalist 選項 (確保 DOM 已掛載)
            setTimeout(() => createDatalist(listId, DICTIONARY[attr]), 0);
        });
        container.appendChild(fieldset);
    }
}

// --- 4. 隨機與生成邏輯 ---
function roll(targetId) {
    let key = targetId.includes('subject') ? targetId.split('-').pop() : targetId;
    const el = document.getElementById(targetId);
    if (DICTIONARY[key] && el) {
        const items = DICTIONARY[key];
        const randomItem = items[Math.floor(Math.random() * items.length)];
        el.value = randomItem.en;
    }
}

document.getElementById('randomizeBtn').onclick = () => {
    // 隨機全局欄位
    ["genre", "vibe", "quality", "location", "lighting", "angle", "lens"].forEach(k => roll(k));
    // 隨機所有角色欄位
    document.querySelectorAll('input[id^="subject-"]').forEach(input => roll(input.id));
    generatePrompt();
};

function findChinese(key, enValue) {
    if(!enValue) return "";
    const found = DICTIONARY[key]?.find(item => item.en.toLowerCase() === enValue.toLowerCase());
    return found ? found.zh : enValue; // 找不到則顯示原輸入
}

function generatePrompt(e) {
    if(e) e.preventDefault();
    const data = { title: document.getElementById('title').value, prompt: "", raw_json: {} };
    let enParts = [];
    let zhParts = [];

    // 1. 處理標題
    if(data.title) zhParts.push(`【標題】${data.title}`);

    // 2. 處理角色
    const num = document.getElementById('numSubjects').value;
    for(let i=0; i<num; i++) {
        let sEn = []; let sZh = []; let sObj = {};
        ["ethnicity", "gender", "hair", "body", "outfit", "pose", "expression"].forEach(attr => {
            const val = document.getElementById(`subject-${i}-${attr}`).value;
            if(val) {
                sEn.push(val);
                const zhVal = findChinese(attr, val);
                sZh.push(zhVal);
                sObj[attr] = { en: val, zh: zhVal };
            }
        });
        if(sEn.length > 0) {
            enParts.push(sEn.join(", "));
            zhParts.push(`【角色 ${i+1}】${sZh.join(", ")}`);
            data.raw_json[`subject_${i+1}`] = sObj;
        }
    }

    // 3. 環境與風格
    ["location", "lighting", "genre", "vibe", "angle", "lens", "quality"].forEach(key => {
        const val = document.getElementById(key).value;
        if(val) {
            enParts.push(val);
            zhParts.push(`【${key}】${findChinese(key, val)}`);
            data.raw_json[key] = { en: val, zh: findChinese(key, val) };
        }
    });

    data.prompt = enParts.join(", ");
    document.getElementById('out-en').textContent = data.prompt || "請輸入內容或點擊隨機";
    document.getElementById('out-zh').textContent = zhParts.join("\n");
    document.getElementById('out-json').textContent = JSON.stringify(data.raw_json, null, 2);
    
    saveHistory(data.prompt, zhParts.join(" | "));
}

// --- 5. 歷史紀錄與複製 ---
function saveHistory(en, zh) {
    if(!en) return;
    let history = JSON.parse(localStorage.getItem('v6_history') || '[]');
    if(history[0]?.en === en) return;
    history.unshift({ time: new Date().toLocaleTimeString(), en: en, zh: zh });
    if(history.length > 10) history.pop();
    localStorage.setItem('v6_history', JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    const list = document.getElementById('historyList');
    const history = JSON.parse(localStorage.getItem('v6_history') || '[]');
    list.innerHTML = history.map((item, index) => `
        <div class="history-item">
            <div class="history-meta"><span>🕒 ${item.time}</span><button class="copy-btn" onclick="copyTextH('${index}')">複製</button></div>
            <div class="history-prompt">${item.en}</div>
            <input type="hidden" id="h-${index}" value="${item.en}">
        </div>
    `).join('');
}

function clearHistory() {
    localStorage.removeItem('v6_history');
    renderHistory();
}

function copyTextH(i) {
    navigator.clipboard.writeText(document.getElementById(`h-${i}`).value).then(() => alert("已複製歷史紀錄"));
}

function copyText(id) {
    navigator.clipboard.writeText(document.getElementById(id).textContent).then(() => alert("內容已複製"));
}

// --- 啟動 ---
document.getElementById('promptForm').addEventListener('submit', generatePrompt);

document.addEventListener('DOMContentLoaded', () => {
    loadLibrary(); // 啟動時先載入 JSON
    renderHistory();
});