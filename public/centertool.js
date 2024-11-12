// async load script files
// https://cdn.jsdelivr.net/npm/@tensorflow/tfjs
// https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd


const asyncLoadScript = async (src) => {
  const script = document.createElement('script');
  script.src = src;

  document.body.appendChild(script);

  return new Promise((resolve, reject) => {
    script.onload = resolve;
    script.onerror = reject;
  });
}

const randomNumber = () => Math.floor(Math.random() * 4);

const createError = (errorMessage) => {
  const el = document.createElement('div');

  el.innerText = errorMessage;
  el.classList.add('error');

  document.getElementById('error-container').append(el);
}

const baseMath = 6;

const createLoadingUI = () => {
  const loadPattern = ['left', 'right'];
  const oppositePattern = {
    'top': 'bottom',
    'left': 'right',
    'bottom': 'top',
    'right': 'left'
  }


  document.getElementById('loading').innerHTML = new Array(baseMath*baseMath).fill(0).map((_, v) => {
    const pattern = loadPattern[randomNumber()];
    const opposite = oppositePattern[pattern];

    return `<div class="loadblock" >
        <div
         style="animation-delay: -${v * 0.1}s;"
         data-loadPattern="${pattern}" class="loadblock-inner"></div>
        <div data-loadPattern="${opposite}"
         style="animation-delay: -${v * 0.1}s;
         class="loadblock-inner"></div>
      </div>`;
  }).join('')
}


const loadScripts = async () => {
  try {
    await Promise.all([
      Promise.all([
        asyncLoadScript('./dependencies/tfjs.js'),
        asyncLoadScript('./dependencies/coco-ssd.js')
      ]),
      new Promise((resolve) => setTimeout(() => resolve('Timeout'), 2500))
    ])

    console.log(tf.ready())
    await tf.ready();

    document.getElementById('loaded-content').classList.remove('hidden');
    document.getElementById('loader').classList.add('hidden');
  } catch (e) {
    console.log(e)
    createError(e)
  }
}


const handleImageChange = async (image) => {
  const imageElement = document.getElementById('image');

  if (!image) {
    return;
  }

  imageElement.classList.remove('hidden');

  imageElement.src = URL.createObjectURL(image);

  const model = await cocoSsd.load();

  const predictions = await model.detect(imageElement);

  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = imageElement.width;
  canvas.height = imageElement.height;

  // ctx.drawImage(imageElement, 0, 0);

  console.log(predictions)
  predictions.forEach(prediction => {
    const [x, y, width, height] = prediction.bbox;
    const text = `${prediction.class} - ${Math.round(prediction.score * 100)}%`;

    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 2;
    ctx.font = '20px Arial';
    ctx.fillStyle = '#00FFFF';

    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.stroke();
    ctx.fillText(text, x, y - 10);
  });
}

const setupDragToUploadImage = () => {
  const dropArea = document.getElementById('uploader-area');
  const input = document.getElementById('image-upload');

  dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.classList.add('dragover');
  });

  dropArea.addEventListener('dragleave', (e) => {
    e.preventDefault()

    dropArea.classList.remove('dragover');
  });

  dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.classList.remove('dragover');

    handleImageChange(e.dataTransfer.files[0]);
  });

}


const setupImageHandler = () => {
  const input = document.getElementById('image-upload');

  input.addEventListener('change', async (e) => {
    const image = e.target.files[0];

    handleImageChange(image);
  });
}

setupDragToUploadImage()
createLoadingUI()
loadScripts();
setupImageHandler();