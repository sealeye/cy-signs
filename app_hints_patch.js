// HINTS: call this to toggle hints for the current item
function showHints(currentItem){
  const box = document.getElementById('hints');
  if(!box) return;
  const ru = currentItem.ru || '';
  const memo = currentItem.memo || '';
  if(!ru && !memo){ box.style.display='block'; box.innerHTML='<div>подсказка не задана</div>'; return; }
  const ruRow = ru ? `<div><b>по-русски:</b> ${ru}</div>` : '';
  const memoRow = memo ? `<div><b>как запомнить:</b> ${memo}</div>` : '';
  box.innerHTML = ruRow + memoRow;
  box.style.display = 'block';
}

// пример: повесь на кнопку
document.getElementById('hintBtn')?.addEventListener('click', ()=>{
  const i = order[idx];
  const item = data[i];
  showHints(item);
});