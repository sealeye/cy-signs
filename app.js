const imgEl = document.getElementById('signImg');
const form = document.getElementById('answerForm');
const input = document.getElementById('answer');
const feedback = document.getElementById('feedback');
const meta = document.getElementById('meta');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const revealBtn = document.getElementById('revealBtn');
const strictToggle = document.getElementById('strictToggle');
const statOk = document.getElementById('correct');
const statAlmost = document.getElementById('almost');
const statNo = document.getElementById('wrong');

let data = Array.isArray(DATA) ? DATA : [];
let order = [];
let idx = 0;
let stats = JSON.parse(localStorage.getItem('cysigns_stats_inline') || '{"ok":0,"almost":0,"no":0}');
updateStats();

order = shuffle([...Array(data.length).keys()]);
load(idx);

function load(i){
  const item = data[ order[i] ];
  const url = new URL(item.image, location.href);
  imgEl.onerror = () => {
    feedback.className = 'no';
    feedback.textContent = `image not found: ${url}`;
  };
  imgEl.src = url + `?cb=${Date.now()}`;
  imgEl.alt = 'road sign';
  meta.textContent = `${i+1}/${data.length}`;
  input.value = '';
  input.focus();
  feedback.textContent = '';
  feedback.className = '';
}

function shuffle(a){
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function norm(s){
  return s
    .toLowerCase()
    .replace(/[–—-]/g,'-')
    .replace(/[^a-z0-9\s\-]/g,'')
    .replace(/\s+/g,' ')
    .trim();
}

function levenshtein(a,b){
  const m = Array.from({length:a.length+1}, (_,i)=>[i]);
  for(let j=1;j<=b.length;j++) m[0][j]=j;
  for(let i=1;i<=a.length;i++){
    for(let j=1;j<=b.length;j++){
      const cost = a[i-1]===b[j-1]?0:1;
      m[i][j] = Math.min(
        m[i-1][j]+1,
        m[i][j-1]+1,
        m[i-1][j-1]+cost
      );
    }
  }
  return m[a.length][b.length];
}

function isMatch(user, target, strict){
  const u = norm(user);
  const t = norm(target);
  if(u === t) return 'ok';
  if(!strict){
    if(u.includes(t) || t.includes(u)) return 'almost';
    if(Math.abs(u.length - t.length) <= 2 && levenshtein(u, t) <= 1) return 'almost';
  }
  return 'no';
}

form.addEventListener('submit', (e)=>{
  e.preventDefault();
  const ans = input.value;
  if(!ans) return;
  const item = data[ order[idx] ];
  const res = isMatch(ans, item.name, strictToggle.checked);
  feedback.className = res === 'ok' ? 'ok' : res === 'almost' ? 'almost' : 'no';
  if(res === 'ok'){
    feedback.textContent = '✓ correct';
    stats.ok++; saveStats(); updateStats();
  } else if(res === 'almost'){
    feedback.textContent = '≈ almost — answer: ' + item.name;
    stats.almost++; saveStats(); updateStats();
  } else {
    feedback.textContent = '✕ nope — answer: ' + item.name;
    stats.no++; saveStats(); updateStats();
  }
});

nextBtn.addEventListener('click', ()=>{
  idx = (idx + 1) % data.length;
  load(idx);
});

prevBtn.addEventListener('click', ()=>{
  idx = (idx - 1 + data.length) % data.length;
  load(idx);
});

revealBtn.addEventListener('click', ()=>{
  const item = data[ order[idx] ];
  feedback.className = 'almost';
  feedback.textContent = 'answer: ' + item.name;
});

document.addEventListener('keydown', (e)=>{
  const inInput = document.activeElement && document.activeElement.id === 'answer';
  const mod = e.altKey || e.ctrlKey || e.metaKey;
  if(e.key === 'ArrowRight' && (!inInput || mod)){ e.preventDefault(); nextBtn.click(); }
  if(e.key === 'ArrowLeft'  && (!inInput || mod)){ e.preventDefault(); prevBtn.click(); }
  if(e.key === 'ArrowUp'    && (!inInput || mod)){ e.preventDefault(); revealBtn.click(); }
  if(e.key === 'ArrowDown'  && (!inInput || mod)){ e.preventDefault(); strictToggle.checked = !strictToggle.checked; }
});

function saveStats(){ localStorage.setItem('cysigns_stats_inline', JSON.stringify(stats)); }
function updateStats(){ statOk.textContent = stats.ok; statAlmost.textContent = stats.almost; statNo.textContent = stats.no; }