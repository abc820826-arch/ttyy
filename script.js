let DICTIONARY = {};
let UI_LANG = 'zh';

const UI_TEXT = {
    zh: {
        subtitle: "核心權重優化 | 雙語切換介面",
        btnUpdate: "更新配置",
        btnRandom: "✨ 隨機靈感 (Randomize All)",
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
        labelNum: "Subject Count:",
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
    document.querySelectorAll('.lang-btn').forEach(b => {
        const btnText = b.innerText.toLowerCase();
        b.classList.toggle('active', (lang === 'zh' ? btnText.includes('繁') : btnText.includes('en')));
    });
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
    
    // 修正標題顯示錯誤
    document.getElementById('ui-label-genre').innerText = t.labelGenre;
    document.getElementById('ui-label-vibe').innerText = t.labelVibe;
    
    document.getElementById('ui-label-num').innerText = t.labelNum;
    document.getElementById('ui-history-title').innerText = t.history;
    document.querySelector('.large-primary').innerText = t.btnGenerate;

    ["genre", "vibe", "angle", "location", "lighting", "quality"].forEach(k => {
        const labelEl = document.getElementById(`ui-label-${k}`);
        if(labelEl) labelEl.innerText = (t.labels[k] || k) + ":";
        renderDatalist(`list-${k}`, k);
        setupSmartInput(k);
    });
    renderForm();
}

// 優化：點擊輸入框自動顯示選單
function setupSmartInput(id) {
    const el = document.getElementById(id);
    if(!el) return;
    el.onfocus = () => { el.oldValue = el.value; el.value = ''; };
    el.onblur = () => { if(el.value === '') el.value = el.oldValue || ''; };
}

function renderDatalist(id, key) {
    const dl = document.getElementById(id);
    if (!dl || !DICTIONARY[key]) return;
    dl.innerHTML = DICTIONARY[key].map(i => `<option value="${i[UI_LANG]}"></option>`).join('');
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
            const inputId = `subject-${i}-${attr}`;
            grid.innerHTML += `
                <div class="input-unit">
                    <label>${t.labels[attr]}:</label>
                    <input type="text" id="${inputId}" list="${listId}" placeholder="...">
                    <datalist id="${listId}"></datalist>
                </div>
            `;
            // 使用非同步確保 DOM 已掛載
            setTimeout(() => {
                renderDatalist(listId, attr);
                setupSmartInput(inputId);
            }, 0);
        });
        container.appendChild(fieldset);
    }
}

function generatePrompt() {
    const getVal = (id) => document.getElementById(id).value;
    const title = getVal('title');
    const genre = getVal('genre');
    const vibe = getVal('vibe');
    const location = getVal('location');
    const angle = getVal('angle');
    const lighting = getVal('lighting');
    const quality = getVal('quality');
    const num = document.getElementById('numSubjects').value;

    let subjectsEn = [];
    let subjectsZh = [];
    const attrs = ["gender", "age", "species", "ethnicity", "body", "hairStyle", "hairColor", "outfit", "pose", "expression"];

    for(let i=0; i<num; i++){
        let subEn = [];
        let subZh = [];
        attrs.forEach(a => {
            let val = document.getElementById(`subject-${i}-${a}`).value;
            if(val) {
                const entry = DICTIONARY[a]?.find(item => item.en === val || item.zh === val);
                subEn.push(entry ? entry.en : val);
                subZh.push(entry ? entry.zh : val);
            }
        });
        if(subEn.length) subjectsEn.push(subEn.join(', '));
        if(subZh.length) subjectsZh.push(subZh.join(', '));
    }
    
    const genreEntry = DICTIONARY.genre.find(i => i.en === genre || i.zh === genre);
    const vibeEntry = DICTIONARY.vibe.find(i => i.en === vibe || i.zh === vibe);
    
    let en = `${genreEntry?.en || genre}, ${title}, ${vibeEntry?.en || vibe}`;
    en += subjectsEn.length ? `, ${subjectsEn.join(' and ')}` : "";
    en += `, ${location}, ${angle}, ${lighting}, ${quality}`;

    let zh = `【風格】${genreEntry?.zh || genre}\n【主題】${title}\n【氛圍】${vibeEntry?.zh || vibe}`;
    if(subjectsZh.length) zh += `\n【角色】${subjectsZh.join(' 與 ')}`;
    zh += `\n【環境】${location} / ${angle} / ${lighting} / ${quality}`;

    document.getElementById('out-en').innerText = en;
    document.getElementById('out-zh').innerText = zh;
    
    const jsonData = { title, genre: genreEntry?.en || genre, vibe: vibeEntry?.en || vibe, subjects: subjectsEn, settings: { location, camera: angle } };
    document.getElementById('out-json').innerText = JSON.stringify(jsonData, null, 2);
    saveHistory(en);
}

// 隨機靈感功能全面升級：含角色屬性
document.getElementById('randomizeBtn').onclick = () => {
    const mainKeys = ["genre", "vibe", "angle", "location", "lighting", "quality"];
    mainKeys.forEach(k => {
        const items = DICTIONARY[k];
        document.getElementById(k).value = items[Math.floor(Math.random()*items.length)][UI_LANG];
    });

    const num = document.getElementById('numSubjects').value;
    const attrs = ["gender", "age", "species", "ethnicity", "body", "hairStyle", "hairColor", "outfit", "pose", "expression"];
    for(let i=0; i<num; i++){
        attrs.forEach(a => {
            const items = DICTIONARY[a];
            const input = document.getElementById(`subject-${i}-${a}`);
            if(items && input) input.value = items[Math.floor(Math.random()*items.length)][UI_LANG];
        });
    }
    generatePrompt();
};

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
            <small class="history-time">${item.time}</small>
            <div class="history-prompt">${item.en}</div>
        </div>
    `).join('');
}

function clearHistory() {
    localStorage.removeItem('v7_history');
    renderHistory();
}

function copyText(id) {
    const text = document.getElementById(id).innerText;
    navigator.clipboard.writeText(text).then(() => {
        const btn = event.target;
        const oldText = btn.innerText;
        btn.innerText = "✅ 已複製";
        setTimeout(() => btn.innerText = oldText, 1000);
    });
}

window.onload = loadLibrary;
