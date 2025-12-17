// --- 1. 全域變數與繁體中文配置 ---
let DICTIONARY = {}; 

const LABELS = { 
    "ethnicity": "種族", "gender": "性別", "hairStyle": "髮型", 
    "hairColor": "髮色", "body": "身材", "pose": "姿勢", 
    "outfit": "服裝", "expression": "表情" 
};

const HINTS = {
    "ethnicity": "例如：東亞裔、精靈", "gender": "例如：女性、女孩", 
    "hairStyle": "例如：長髮、馬尾", "hairColor": "例如：銀色、霓虹粉",
    "body": "例如：苗條、肌肉型", "pose": "例如：自信站立、奔跑", 
    "outfit": "例如：機能服、和服", "expression": "例如：溫暖微笑、冷酷"
};

// --- 2. 載入詞庫 (支援 Fetch) ---
async function loadLibrary() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error('無法載入 data.json');
        DICTIONARY = await response.json();
        initDatalists();
        renderForm();
    } catch (error) {
        console.error("載入失敗:", error);
        alert("詞庫載入失敗！請確保使用 Live Server 開啟且檔案名為 data.json");
        renderForm(); 
    }
}

// --- 3. UI 渲染邏輯 ---
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
    
    // 拆分頭髮為 hairStyle 與 hairColor
    const attrs = ["ethnicity", "gender", "hairStyle", "hairColor", "body", "outfit", "pose", "expression"];
    
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
            if (DICTIONARY[attr]) {
                setTimeout(() => createDatalist(listId, DICTIONARY[attr]), 0);
            }
        });
        container.appendChild(fieldset);
    }
}

// --- 4. 核心功能：隨機與生成 ---
function roll(targetId) {
    let key = targetId.includes('subject') ? targetId.split('-').pop() : targetId;
    const el = document.getElementById(targetId);
    if (DICTIONARY[key] && el) {
        const item = DICTIONARY[key][Math.floor(Math.random() * DICTIONARY[key].length)];
        el.value = item.en;
    }
}

document.getElementById('randomizeBtn').onclick = () => {
    ["genre", "vibe", "quality", "location", "lighting", "angle", "lens"].forEach(k => roll(k));
    document.querySelectorAll('input[id^="subject-"]').forEach(input => roll(input.id));
    generatePrompt();
};

function findChinese(key, enValue) {
    if(!enValue || !DICTIONARY[key]) return enValue;
    const found = DICTIONARY[key].find(item => item.en.toLowerCase() === enValue.toLowerCase());
    return found ? found.zh : enValue;
}

function generatePrompt(e) {
    if(e) e.preventDefault();
    const data = { title: document.getElementById('title').value, prompt: "", raw_json: {} };
    let enParts = [];
    let zhParts = [];

    if(data.title) zhParts.push(`【標題】${data.title}`);

    // 處理角色屬性
    const num = document.getElementById('numSubjects').value;
    for(let i=0; i<num; i++) {
        let sEn = []; let sZh = []; let sObj = {};
        ["ethnicity", "gender", "hairColor", "hairStyle", "body", "outfit", "pose", "expression"].forEach(attr => {
            const val = document.getElementById(`subject-${i}-${attr}`).value;
            if(val) {
                const zhVal = findChinese(attr, val);
                sEn.push(val);
                sZh.push(zhVal);
                sObj[attr] = { en: val, zh: zhVal }; // 補回雙語 JSON 格式
            }
        });
        if(sEn.length > 0) {
            enParts.push(sEn.join(", "));
            zhParts.push(`【角色 ${i+1}】${sZh.join(", ")}`);
            data.raw_json[`subject_${i+1}`] = sObj;
        }
    }

    // 處理場景屬性
    ["location", "lighting", "genre", "vibe", "angle", "lens", "quality"].forEach(key => {
        const val = document.getElementById(key).value;
        if(val) {
            const zhVal = findChinese(key, val);
            enParts.push(val);
            zhParts.push(`【${key}】${zhVal}`);
            data.raw_json[key] = { en: val, zh: zhVal };
        }
    });

    data.prompt = enParts.join(", ");
    document.getElementById('out-en').textContent = data.prompt || "請輸入內容或點擊隨機生成";
    document.getElementById('out-zh').textContent = zhParts.join("\n");
    document.getElementById('out-json').textContent = JSON.stringify(data.raw_json, null, 2);
    
    saveHistory(data.prompt, zhParts.join(" | "));
}

// --- 5. 歷史紀錄 (補回 V5 鍵名) ---
function saveHistory(en, zh) {
    if(!en) return;
    let history = JSON.parse(localStorage.getItem('v5_history') || '[]');
    if(history[0]?.en === en) return;
    history.unshift({ time: new Date().toLocaleTimeString(), en: en, zh: zh });
    if(history.length > 10) history.pop();
    localStorage.setItem('v5_history', JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    const list = document.getElementById('historyList');
    const history = JSON.parse(localStorage.getItem('v5_history') || '[]');
    list.innerHTML = history.map((item, index) => `
        <div class="history-item">
            <div class="history-meta"><span>🕒 ${item.time}</span><button class="copy-btn" onclick="copyTextH('${index}')">複製</button></div>
            <div class="history-prompt">${item.en}</div>
            <input type="hidden" id="h-${index}" value="${item.en}">
        </div>
    `).join('');
}

function clearHistory() { localStorage.removeItem('v5_history'); renderHistory(); }
function copyTextH(i) { navigator.clipboard.writeText(document.getElementById(`h-${i}`).value).then(() => alert("已複製歷史紀錄")); }
function copyText(id) { navigator.clipboard.writeText(document.getElementById(id).textContent).then(() => alert("內容已複製")); }

document.getElementById('promptForm').addEventListener('submit', generatePrompt);
document.addEventListener('DOMContentLoaded', () => { loadLibrary(); renderHistory(); });