let DICTIONARY = {};
let UI_LANG = 'zh';

const UI_TEXT = {
    zh: {
        subtitle: "核心權重優化 | 雙語切換介面",
        btnUpdate: "更新配置",
        btnRandom: "✨ 隨機靈感",
        btnGenerate: "🚀 立即生成提示詞 (Generate)",
        legCore: "🎨 核心視覺 (Core Style)",
        legEnv: "📸 環境與攝影",
        legSub: "👤 角色設定 Subject",
        labelTitle: "1. 描述你的圖像主題 (Title):",
        labelGenre: "2. 藝術風格 (Genre):",
        labelVibe: "3. 視覺氛圍 (Vibe):",
        labelNum: "👥 角色數量:",
        history: "📜 歷史紀錄",
        labels: {
            gender: "性別", age: "年齡層", species: "物種", ethnicity: "族裔",
            hairStyle: "髮型", hairColor: "髮色", body: "身材", outfit: "服裝",
            pose: "姿勢", expression: "表情", angle: "視角", location: "地點",
            lighting: "光影", quality: "畫質"
        }
    },
    en: {
        subtitle: "Core Weight Optimized | Dual-Language UI",
        btnUpdate: "Update UI",
        btnRandom: "✨ Randomize All",
        btnGenerate: "🚀 Generate Prompt Now",
        legCore: "🎨 Core Style",
        legEnv: "📸 Environment & Camera",
        legSub: "👤 Subject Settings",
        labelTitle: "1. Image Topic (Title):",
        labelGenre: "2. Art Genre:",
        labelVibe: "3. Visual Vibe:",
        labelNum: "👥 Subject Count:",
        history: "📜 History",
        labels: {
            gender: "Gender", age: "Age Group", species: "Species", ethnicity: "Ethnicity",
            hairStyle: "Hair Style", hairColor: "Hair Color", body: "Body Type", outfit: "Outfit",
            pose: "Pose", expression: "Expression", angle: "Angle", location: "Location",
            lighting: "Lighting", quality: "Quality"
        }
    }
};

async function loadLibrary() {
    try {
        const res = await fetch('data.json');
        DICTIONARY = await res.json();
        setLanguage('zh'); 
    } catch (e) { console.error("Data load failed", e); }
}

function setLanguage(lang) {
    UI_LANG = lang;
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.innerText.toLowerCase().includes(lang)));
    updateUI();
}

function updateUI() {
    const t = UI_TEXT[UI_LANG];
    document.getElementById('ui-subtitle').innerText = t.subtitle;
    document.getElementById('btn-update').innerText = t.btnUpdate;
    document.getElementById('randomizeBtn').innerText = t.btnRandom;
    document.getElementById('ui-leg-core').innerText = t.legCore;
    document.getElementById('ui-leg-env').innerText = t.legEnv;
    document.getElementById('ui-label-title').innerText = t.labelTitle;
    document.getElementById('ui-label-genre').innerText = t.labelGenre;
    document.getElementById('ui-label-vibe').innerText = t.labelVibe;
    document.getElementById('ui-label-num').innerText = t.labelNum;
    document.getElementById('ui-history-title').innerText = t.history;
    document.querySelector('.large-primary').innerText = t.btnGenerate;

    // 更新全域 datalists
    ["genre", "vibe", "angle", "location", "lighting", "quality"].forEach(k => {
        document.getElementById(`ui-label-${k}`).innerText = t.labels[k] + ":";
        renderDatalist(`list-${k}`, k);
    });
    renderForm();
}

function renderDatalist(id, key) {
    const dl = document.getElementById(id);
    if (!dl || !DICTIONARY[key]) return;
    dl.innerHTML = DICTIONARY[key].map(i => `<option value="${i.en}">${i[UI_LANG]}</option>`).join('');
}

function renderForm() {
    const container = document.getElementById('subjectsContainer');
    const num = document.getElementById('numSubjects').value;
    const t = UI_TEXT[UI_LANG];
    container.innerHTML = '';

    const attrs = ["gender", "age", "species", "ethnicity", "body", "hairStyle", "hairColor", "outfit", "pose", "expression"];
    
    for(let i=0; i<num; i++) {
        const fieldset = document.createElement('fieldset');
        fieldset.innerHTML = `<legend>${t.legSub} ${i+1}</legend><div class="field-grid"></div>`;
        const grid = fieldset.querySelector('.field-grid');
        
        attrs.forEach(attr => {
            const listId = `list-s${i}-${attr}`;
            grid.innerHTML += `
                <div class="input-unit">
                    <label>${t.labels[attr]}:</label>
                    <input type="text" id="subject-${i}-${attr}" list="${listId}">
                    <datalist id="${listId}"></datalist>
                </div>
            `;
            setTimeout(() => renderDatalist(listId, attr), 0);
        });
        container.appendChild(fieldset);
    }
}

function generatePrompt() {
    const title = document.getElementById('title').value;
    const genre = document.getElementById('genre').value;
    const vibe = document.getElementById('vibe').value;
    
    // 組合英文
    let en = `${genre}, ${title}, ${vibe}`;
    const num = document.getElementById('numSubjects').value;
    let subjects = [];

    for(let i=0; i<num; i++){
        let subParts = [];
        ["gender", "age", "species", "ethnicity", "body", "hairStyle", "hairColor", "outfit", "pose", "expression"]
        .forEach(a => {
            let val = document.getElementById(`subject-${i}-${a}`).value;
            if(val) subParts.push(val);
        });
        subjects.push(subParts.join(', '));
    }
    
    en += subjects.length ? `, ${subjects.join(' and ')}` : "";
    en += `, ${document.getElementById('location').value}, ${document.getElementById('angle').value}, ${document.getElementById('lighting').value}, ${document.getElementById('quality').value}`;

    document.getElementById('out-en').innerText = en;
    document.getElementById('out-zh').innerText = "提示詞已生成，結構如上。";
    
    const jsonData = {
        title, genre, vibe, 
        subjects: subjects,
        settings: { 
            location: document.getElementById('location').value,
            camera: document.getElementById('angle').value 
        }
    };
    document.getElementById('out-json').innerText = JSON.stringify(jsonData, null, 2);
    saveHistory(en);
}

function saveHistory(en) {
    let history = JSON.parse(localStorage.getItem('v7_history') || '[]');
    history.unshift({ time: new Date().toLocaleTimeString(), en });
    localStorage.setItem('v7_history', JSON.stringify(history.slice(0, 10)));
    renderHistory();
}

function renderHistory() {
    const list = document.getElementById('historyList');
    const history = JSON.parse(localStorage.getItem('v7_history') || '[]');
    list.innerHTML = history.map(item => `
        <div class="history-item">
            <small>${item.time}</small>
            <div class="history-prompt">${item.en}</div>
        </div>
    `).join('');
}

function copyText(id) {
    navigator.clipboard.writeText(document.getElementById(id).innerText).then(() => alert("Copied!"));
}

document.getElementById('randomizeBtn').onclick = () => {
    const keys = ["genre", "vibe", "angle", "location", "lighting", "quality"];
    keys.forEach(k => {
        const items = DICTIONARY[k];
        document.getElementById(k).value = items[Math.floor(Math.random()*items.length)].en;
    });
    generatePrompt();
};

window.onload = loadLibrary;