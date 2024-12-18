import fs from 'node:fs/promises';
import sharp from 'sharp';
import path from 'path';

const PHOTO_PATH = path.join(__dirname, '..', 'photos');
const OUTPUT_IMAGE_PATH = path.join(__dirname, '..', 'public', 'bills');
const OUTPUT_PATH = path.join(__dirname, '..', 'public');

const allPhotos = await fs.readdir(PHOTO_PATH)

const reprocessImages = process.argv.includes('--reprocess-images')

const imageBuildIndex = JSON.parse( await fs.readFile(path.join(__dirname, 'imageBuildIndex.json'), { encoding: 'utf-8' }))


// get all files in folder that are images
const photoMap = await Promise.all(allPhotos
  .filter(photoName => photoName.endsWith('.jpeg') || photoName.endsWith('.jpg'))
  .map(async (photoName) => {

  const [title, date, ...rest] = photoName.split(/\||\./).map(s => s.trim());

  let source = '';

  // if rest is just one, it means the last attribute is just the image type
  if (rest.length > 1) {
    source = rest[0];
  }

  const id = `${title}_${date}`.toLowerCase().replace(/ |,/g, '')


  if (reprocessImages || !imageBuildIndex[id]) {
    await sharp(path.join(PHOTO_PATH, photoName))
      .rotate()
      .jpeg({
        quality: 75,
      })
      .resize(null, 1440)
      .toFile(path.join(OUTPUT_IMAGE_PATH, `${id}-original.jpg`))

    imageBuildIndex[id] = true;
  }


  const imagePath = `./bills/${id}-original.jpg`

  return ({
    id,
    source,
    imagePath,
    link: path.join(PHOTO_PATH, photoName),
    title,
    date: new Date(date),
  })
}))


photoMap.sort((first, second) => second.date - first.date)

const rootFileData = await fs.readFile(path.join(__dirname, './root.html'), { encoding: 'utf-8' })

const firstPhotoId = photoMap[0].id;

// code to generate a sitemap
const generateSitemap = async (photoMap) => {
  const baseSiteMap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${photoMap.map(detail => `<url><loc>https://www.postthebills.com/${detail.id}.html</loc></url>`).join('\n')}
  </urlset>
  `;

  await fs.writeFile(path.join(OUTPUT_PATH, 'sitemap.xml'), baseSiteMap)
}


const createPage = async (fileName, current, next, prev) => {
  const fileToCreate = path.join(OUTPUT_PATH, fileName);


  let localFileData = rootFileData;

  localFileData = localFileData.replace('__SOURCE__', current.source || '')
  localFileData = localFileData.replace('_IMAGE_LINK_', current.imagePath)
  localFileData = localFileData.replace(/_ADDRESS_LINK_/g, current.title)

  localFileData = localFileData.replace('_PREV_LINK_URL_', `/${prev.id}.html`)
  localFileData = localFileData.replace('_NEXT_LINK_URL_', `/${next.id}.html`)

  await fs.writeFile(`${fileToCreate}.html`, localFileData)
}

await Promise.all([
  ...photoMap.map(async (details, index, all) => {
    const prev = all[index + 1] || all[0]
    const next = (() => {
      if ((index - 1) === 0) {
        return all[index - 1]
      }

      return all[index - 1] || all[all.length - 1];
    })();

    if (firstPhotoId === details.id) {
      await createPage('index', details, next, prev)
    }

    await createPage(details.id, details, next, prev)
  }),
  generateSitemap(photoMap),
  fs.writeFile(path.join(__dirname, 'imageBuildIndex.json'), JSON.stringify(imageBuildIndex, null, 2))
])

