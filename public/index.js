
let nextPageHtml = '';
let prevPageHtml = '';


window.onload = () => {
  document.body.addEventListener('keydown', (e) => {
    // if left arrow key is pressed
    if (e.keyCode === 37) {
      window.location.href = document.getElementById('prev-url').href;
    }

    // if right arrow key is pressed
    if (e.keyCode === 39) {
      window.location.href = document.getElementById('next-url').href;
    }
  });

  checkSwipe();

  preloadNextPages();
  preloaPrevPages();


  document.getElementById('next').addEventListener('click', (e) => {
    e.preventDefault();

    if (!nextPageHtml) {
      return;
    }

    const nextUrl = document.getElementById('next-url').href;


    document.getElementById('next-page').innerHTML = nextPageHtml;
    preloadNextPages();
    history.pushState({}, '', nextUrl);
  });

  document.getElementById('prev').addEventListener('click', (e) => {
    e.preventDefault();
    if (!prevPageHtml) {
      return;
    }

    const prevUrl = document.getElementById('prev-url').href;


    document.getElementById('prev-page').innerHTML = prevPageHtml;
    preloaPrevPages();

    history.pushState({}, '', prevUrl);

  })
}


function preloadNextPages() {
  const nextUrl = document.getElementById('next-url').href;

  if (nextUrl) {
    nextPageHtml = fetch(nextUrl).then(res => res.text());
  }
}

function preloaPrevPages() {
  const prevUrl = document.getElementById('prev-url').href;

  if (prevUrl) {
    prevPageHtml = fetch(prevUrl).then(res => res.text());
  }
}




function checkSwipe() {
  const touchSurface = document.body
  let touchstartX = 0;
  let touchendX = 0;

  touchSurface.addEventListener('touchstart', function (event) {
    touchstartX = event.changedTouches[0].screenX;
  }, false);

  touchSurface.addEventListener('touchend', function (event) {
    touchendX = event.changedTouches[0].screenX;
    handleGesture();
  }, false);

  function handleGesture() {
    if (touchendX < touchstartX) {
      window.location.href = document.getElementById('next-url').href;
    }

    if (touchendX > touchstartX) {
      window.location.href = document.getElementById('prev-url').href;
    }
  }
}