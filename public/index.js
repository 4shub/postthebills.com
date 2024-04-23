


window.onload = function () {
  const memoryCache = localStorage.getItem('memoryCache');

  if (memoryCache) {
    localStorage.removeItem('memoryCache');
    window.location.href = memoryCache;
  }

  const prevData = document.getElementById('prev').dataset.prev;

  if (prevData) {
    localStorage.setItem('memoryCache', `/${prevData}.html`);
  } else {
    localStorage.setItem('memoryCache' , '/');
  }


}