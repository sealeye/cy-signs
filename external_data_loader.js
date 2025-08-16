
// external data loader: replaces inline DATA with content from data.json (with ru/memo fields)
(function(){
  function apply(data){
    // normalize: prefer ru/memo inside each item; remove RU_HINTS usage
    window.DATA = Array.isArray(data) ? data : [];
    if (typeof window.loadData === 'function') window.loadData();
  }
  fetch('data.json')
    .then(r => r.json())
    .then(apply)
    .catch(err => {
      console.error('failed to fetch data.json', err);
      alert('не смог загрузить data.json — открой через локальный сервер, либо вставь DATA инлайном');
    });
})();
