

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
}

function checkSwipe() {
  const touchSurface = document.getElementById('touch-surface');
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