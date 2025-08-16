const imgEl = document.getElementById('signImg');
const form = document.getElementById('answerForm');
const input = document.getElementById('answer');
const feedback = document.getElementById('feedback');
const meta = document.getElementById('meta');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const revealBtn = document.getElementById('revealBtn');
const reviewBtn = document.getElementById('reviewBtn');
const exportBtn = document.getElementById('exportBtn');
const reviewBar = document.getElementById('reviewBar');
const reviewList = document.getElementById('reviewList');
const reviewCount = document.getElementById('reviewCount');
const markUnknownBtn = document.getElementById('markUnknownBtn');
const unknownBtn = document.getElementById('unknownBtn');
const unknownBar = document.getElementById('unknownBar');
const unknownList = document.getElementById('unknownList');
const unknownCount = document.getElementById('unknownCount');
const hintBtn = document.getElementById('hintBtn');
const hintsBox = document.getElementById('hints');

let data = Array.isArray(DATA) ? DATA : [];
let order = shuffle([...Array(data.length).keys()]);
let idx = 0;

let stats = JSON.parse(localStorage.getItem('cysigns_stats_v3') || '{"ok":0,"almost":0,"no":0}');
let mistakes = JSON.parse(localStorage.getItem('cysigns_mistakes_v3') || '[]');
let unknowns = JSON.parse(localStorage.getItem('cysigns_unknowns_v3') || '[]');
let reviewMode = false;
let unknownMode = false;
let reviewOrder = [];
let unknownOrder = [];

updateStats();
updateReviewUI();
updateUnknownUI();

load(idx);

function showHints(item){
  const ru = item.ru || '';
  const memo = item.memo || '';
  const ruRow = ru ? `<div><b>по-русски:</b> ${ru}</div>` : '';
  const memoRow = memo ? `<div><b>как запомнить:</b> ${memo}</div>` : '';
  hintsBox.innerHTML = ruRow + memoRow || '<div>подсказка не задана</div>';
  hintsBox.style.display = 'block';
}

hintBtn?.addEventListener('click', ()=>{
  const item = data[ order[idx] ];
  showHints(item);
});

function load(i){
  const context = unknownMode ? unknownOrder : reviewMode ? reviewOrder : order;
  const item = data[ context[i] ];
  const url = new URL(item.image, location.href);
  imgEl.onerror = () => {
    feedback.className = 'no';
    feedback.textContent = `image not found: ${url}`;
  };
  imgEl.src = url + `?cb=${Date.now()}`;
  imgEl.alt = 'road sign';
  meta.textContent = `${unknownMode ? 'unknowns ' : reviewMode ? 'review ' : ''}${i+1}/${context.length}`;
  input.value = '';
  input.focus();
  feedback.textContent = '';
  feedback.className = '';
  hintsBox.style.display = 'none';
}

function shuffle(a){
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function norm(s){
  return s.toLowerCase().replace(/[–—-]/g,'-').replace(/[^a-z0-9\s\-]/g,'').replace(/\s+/g,' ').trim();
}

function levenshtein(a,b){
  const m = Array.from({length:a.length+1}, (_,i)=>[i]);
  for(let j=1;j<=b.length;j++) m[0][j]=j;
  for(let i=1;i<=a.length;i++){
    for(let j=1;j<=b.length;j++){
      const cost = a[i-1]===b[j-1]?0:1;
      m[i][j] = Math.min(m[i-1][j]+1, m[i][j-1]+1, m[i-1][j-1]+cost);
    }
  }
  return m[a.length][b.length];
}

function isMatch(user, target){
  const u = norm(user), t = norm(target);
  if(u === t) return 'ok';
  if(u.includes(t) || t.includes(u)) return 'almost';
  if(Math.abs(u.length - t.length) <= 2 && levenshtein(u, t) <= 1) return 'almost';
  return 'no';
}

form.addEventListener('submit', (e)=>{
  e.preventDefault();
  const ans = input.value;
  if(!ans) return;
  const context = unknownMode ? unknownOrder : reviewMode ? reviewOrder : order;
  const item = data[ context[idx] ];
  const res = isMatch(ans, item.name);
  feedback.className = res === 'ok' ? 'ok' : res === 'almost' ? 'almost' : 'no';
  if(res === 'ok'){
    feedback.textContent = '✓ correct';
    stats.ok++; saveStats(); updateStats();
    mistakes = mistakes.filter(m => m.image !== item.image);
    unknowns = unknowns.filter(u => u.image !== item.image);
    saveMistakes(); saveUnknowns(); updateReviewUI(); updateUnknownUI();
  } else if(res === 'almost'){
    feedback.textContent = '≈ almost — answer: ' + item.name;
    stats.almost++; saveStats(); updateStats();
    upsertMistake(item, 'almost');
  } else {
    feedback.textContent = '✕ nope — answer: ' + item.name;
    stats.no++; saveStats(); updateStats();
    upsertMistake(item, 'no');
  }
});

nextBtn.addEventListener('click', ()=>{
  const context = unknownMode ? unknownOrder : reviewMode ? reviewOrder : order;
  idx = (idx + 1) % context.length;
  load(idx);
});

prevBtn.addEventListener('click', ()=>{
  const context = unknownMode ? unknownOrder : reviewMode ? reviewOrder : order;
  idx = (idx - 1 + context.length) % context.length;
  load(idx);
});

revealBtn.addEventListener('click', ()=>{
  const context = unknownMode ? unknownOrder : reviewMode ? reviewOrder : order;
  const item = data[ context[idx] ];
  feedback.className = 'almost';
  feedback.textContent = 'answer: ' + item.name;
  upsertUnknown(item);
});

markUnknownBtn.addEventListener('click', ()=>{
  const context = unknownMode ? unknownOrder : reviewMode ? reviewOrder : order;
  const item = data[ context[idx] ];
  upsertUnknown(item);
  updateUnknownUI();
});

reviewBtn.addEventListener('click', ()=>{
  reviewMode = !reviewMode; unknownMode = false;
  buildReviewOrder(); buildUnknownOrder();
  idx = 0;
  load(idx);
  updateReviewUI(); updateUnknownUI();
});

unknownBtn.addEventListener('click', ()=>{
  unknownMode = !unknownMode; reviewMode = false;
  buildUnknownOrder(); buildReviewOrder();
  idx = 0;
  load(idx);
  updateReviewUI(); updateUnknownUI();
});

exportBtn.addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify(mistakes, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'mistakes.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

hintBtn.addEventListener('click', ()=>{
  const context = unknownMode ? unknownOrder : reviewMode ? reviewOrder : order;
  const item = data[ context[idx] ];
  const key = item.name.toLowerCase();
  const pack = RU_HINTS[key];
  if(pack){
    hintsBox.innerHTML = `<div><b>по-русски:</b> ${pack.ru}</div><div><b>как запомнить:</b> ${pack.memo}</div>`;
  }else{
    hintsBox.innerHTML = `<div>подсказка пока пустая — напомни мне добавить для: <i>${item.name}</i></div>`;
  }
  hintsBox.style.display = 'block';
});

document.addEventListener('keydown', (e)=>{
  const inInput = document.activeElement && document.activeElement.id === 'answer';
  const mod = e.altKey || e.ctrlKey || e.metaKey;
  if(e.key === 'ArrowRight' && (!inInput || mod)){ e.preventDefault(); nextBtn.click(); }
  if(e.key === 'ArrowLeft'  && (!inInput || mod)){ e.preventDefault(); prevBtn.click(); }
  if(e.key === 'ArrowUp'    && (!inInput || mod)){ e.preventDefault(); revealBtn.click(); }
  if(e.key === 'ArrowDown'  && (!inInput || mod)){ e.preventDefault(); reviewBtn.click(); }
});

function buildReviewOrder(){
  const map = new Map(data.map((d,i)=>[d.image,i]));
  reviewOrder = mistakes.map(m => map.get(m.image)).filter(x => typeof x === 'number');
  reviewBar.classList.toggle('active', reviewOrder.length > 0 || reviewMode);
  renderPills(reviewList, reviewOrder);
  reviewCount.textContent = reviewOrder.length;
}

function buildUnknownOrder(){
  const map = new Map(data.map((d,i)=>[d.image,i]));
  unknownOrder = unknowns.map(m => map.get(m.image)).filter(x => typeof x === 'number');
  unknownBar.classList.toggle('active', unknownOrder.length > 0 || unknownMode);
  renderPills(unknownList, unknownOrder);
  unknownCount.textContent = unknownOrder.length;
}

function renderPills(container, orderList){
  container.innerHTML = '';
  orderList.forEach((index, j)=>{
    const item = data[index];
    const el = document.createElement('span');
    el.className = 'pill';
    el.textContent = item.name || item.image.split('/').pop();
    el.title = item.image;
    el.addEventListener('click', ()=>{
      if(container === reviewList){ reviewMode = true; unknownMode = false; idx = j; }
      else { unknownMode = true; reviewMode = false; idx = j; }
      load(idx);
    });
    container.appendChild(el);
  });
}

function upsertMistake(item, severity){
  const i = mistakes.findIndex(m => m.image === item.image);
  const rec = { image: item.image, name: item.name, severity, ts: Date.now() };
  if(i >= 0){ mistakes[i] = rec; } else { mistakes.push(rec); }
  saveMistakes(); updateReviewUI();
}

function upsertUnknown(item){
  if(!unknowns.find(u => u.image === item.image)){
    unknowns.push({ image: item.image, name: item.name, ts: Date.now() });
    saveUnknowns();
  }
  updateUnknownUI();
}

function saveStats(){ localStorage.setItem('cysigns_stats_v3', JSON.stringify(stats)); }
function saveMistakes(){ localStorage.setItem('cysigns_mistakes_v3', JSON.stringify(mistakes)); }
function saveUnknowns(){ localStorage.setItem('cysigns_unknowns_v3', JSON.stringify(unknowns)); }

function updateStats(){
  document.getElementById('correct').textContent = stats.ok;
  document.getElementById('almost').textContent = stats.almost;
  document.getElementById('wrong').textContent = stats.no;
}
function updateReviewUI(){ buildReviewOrder(); }
function updateUnknownUI(){ buildUnknownOrder(); }