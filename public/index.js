


window.onload = function () {
  const memoryCache = localStorage.getItem('memoryCache');

  if (memoryCache) {
    localStorage.removeItem('memoryCache');
    window.location.href = memoryCache;

    return;
  }

  const prevData = document.getElementById('prev').dataset.prev;

  if (prevData !== '_PREV_DATA_') {
    localStorage.setItem('memoryCache', `/${prevData}.html`);
  } else {
    localStorage.setItem('memoryCache' , '/');
  }

}