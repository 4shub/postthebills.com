
const ImageUploader = document.getElementById('image-upload');
const ImageWarning = document.getElementById('image-warning');
const ImagePreviewContainer = document.getElementById('image-preview-container');

function setImageErrorMessage(message) {
  ImageWarning.innerHTML = `<p class="alert">${message}</p>`;
}

function clearImageValue() {
  ImageUploader.value = '';
  ImageUploader.type = '';
  ImageUploader.type = 'file';
}

function previewImage(e) {

  const [imageToUpload] = e.target.files;

  if (!imageToUpload) return;


  const image = new Image();
  image.src = URL.createObjectURL(imageToUpload);

  image.onload = function () {
    if (image.width < 1440 || image.height < 900) {
      setImageErrorMessage('Image size must be at least 1440x900');
      clearImageValue();
      return;
    }

    if (image.height > image.width) {
      setImageErrorMessage('Image should ideally be in landscape mode');
    }



    ImagePreviewContainer.innerHTML = `
      <img src="${image.src}" alt="Image Preview" class="image-preview">
    `;




  }
}


window.onload = function () {
  const accessToken = localStorage.getItem('accessToken');
  if (accessToken) {
    document.getElementById('accessToken').value = accessToken;
  }
}


ImageUploader.addEventListener('change', previewImage);


// const AddressInput = document.getElementById('address');
// const AutoIdentifyAddressButton = document.getElementById('auto-identify-address');
//
// function autoIdentifyAddress() {
//   if (!navigator.geolocation) {
//     alert('Geolocation is not supported by your browser');
//     return;
//   }
//
//   navigator.geolocation.getCurrentPosition((position) => {
//     const { latitude, longitude } = position.coords;
//     console.log(latitude, longitude)
//
//   })
// }

// AutoIdentifyAddressButton.addEventListener('click', autoIdentifyAddress);

function getBase64(file) {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  return new Promise((resolve) => {
    reader.onload = () => resolve(reader.result);

  });
}

const PreserveKeyInLocalStorageCheckbox = document.getElementById('preserve-key');

PreserveKeyInLocalStorageCheckbox.addEventListener('change', function (e) {
  if (e.target.checked) {
    localStorage.setItem('accessToken', document.getElementById('accessToken').value);
  } else {
    localStorage.removeItem('accessToken');
  }
});

const AccessTokenInput = document.getElementById('accessToken');

AccessTokenInput.addEventListener('change', function (e) {
  console.log('a')
  if (PreserveKeyInLocalStorageCheckbox.checked) {

    localStorage.setItem('accessToken', e.target.value);
  }
});

const ContributeForm = document.getElementById('contribute');
let isProcessing = false;

const SubmitButton = document.getElementById('submit');

async function contribute(e) {
  if (isProcessing) {
    return;
  }

  try {
    SubmitButton.disabled = true;
    SubmitButton.innerText = 'Processing...';
    isProcessing = true;
    e.preventDefault();
    const formData = new FormData(ContributeForm);

    const accessToken = formData.get('accessToken')
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    }

    const data = {
      address: formData.get('address'),
      image: formData.get('image'),
    }

    if (!data.address) {
      alert('Please enter an address');
      return;
    }

    if (!data.image) {
      alert('Please upload an image');
      return;
    }

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          ...headers,
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }).then(response => response.json());

      // see if user already has a fork
      const fork = await fetch(`https://api.github.com/repos/${response.login}/postthebills.com`, {
        headers: {
          ...headers,
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });

      // if user does not have a fork, create a fork
      if (fork.status === 404) {
        await fetch('https://api.github.com/repos/4shub/postthebills.com/forks', {
          method: 'POST',
          headers: {
            ...headers,
            'X-GitHub-Api-Version': '2022-11-28'
          }
        });
      }

      // get the sha of the main branch
      const mainBranch = await fetch(`https://api.github.com/repos/4shub/postthebills.com/branches/main`, {
        headers: {
          ...headers,
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }).then(response => response.json());

      const contribueBranchName = `contribute-${new Date().getTime()}}`

      // create a branch
      await fetch(`https://api.github.com/repos/${response.login}/postthebills.com/git/refs`, {
        method: 'POST',
        headers: {
          ...headers,
          'X-GitHub-Api-Version': '2022-11-28'
        },
        body: JSON.stringify({
          ref: `refs/heads/${contribueBranchName}`,
          sha: mainBranch.commit.sha
        })
      });

      const currentDate = new Date();
      const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
      const currentDateDay = currentDate.getDate();
      const currentYear = currentDate.getFullYear();

      const fileName = `${data.address} | ${currentMonth} ${currentDateDay}, ${currentYear}.jpg`;

      // upload image
      const image = await fetch(`https://api.github.com/repos/${response.login}/postthebills.com/contents/photos/${fileName}`, {
        method: 'PUT',
        headers: {
          ...headers,
          'X-GitHub-Api-Version': '2022-11-28'
        },
        body: JSON.stringify({
          message: `Add image for ${data.address}`,
          content: (await getBase64(data.image)).split(',')[1],
          branch: contribueBranchName
        })
      });

      // create PR
      const pr = await fetch(`https://api.github.com/repos/4shub/postthebills.com/pulls`, {
        method: 'POST',
        headers: {
          ...headers,
          'X-GitHub-Api-Version': '2022-11-28'
        },
        body: JSON.stringify({
          title: `Contribute image for ${data.address}`,
          head: `${response.login}:${contribueBranchName}`,
          base: 'main'
        })
      }).then(response => response.json());


      const prUrl = await fetch(pr.url, {
        headers: {
          ...headers,
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }).then(response => response.json());

      window.location.href = prUrl.html_url;
    } catch (e) {
      console.log(e)
      alert('Failed to create PR')
    }
  } finally {

    SubmitButton.disabled = false;
    SubmitButton.innerText = 'Submit';
    isProcessing = false;

  }
}



ContributeForm.addEventListener('submit', contribute);


