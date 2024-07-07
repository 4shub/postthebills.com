import fs from 'node:fs/promises';
import sharp from 'sharp';
import path from 'path';

const PHOTO_PATH = path.join(__dirname, '..', 'photos');
const OUTPUT_IMAGE_PATH = path.join(__dirname, '..', 'public', 'bills');
const OUTPUT_PATH = path.join(__dirname, '..', 'public');

const allPhotos = await fs.readdir(PHOTO_PATH)

// get all files in folder that are images
const photoMap = await Promise.all(allPhotos
  .filter(photoName => photoName.endsWith('.jpeg') || photoName.endsWith('.jpg'))
  .map(async (photoName) => {
  const [title, date] = photoName.split(/\||\./).map(s => s.trim())
  const id = `${title}_${date}`.toLowerCase().replace(/ |,/g, '')

  const sharpFile = await sharp(path.join(PHOTO_PATH, photoName));


  await Promise.all([
    await sharpFile.jpeg({ mozjpeg: true }).toFile(path.join(OUTPUT_IMAGE_PATH, `${id}-original.jpg`)),
  ])

  const imagePath = `./bills/${id}-original.jpg`

  return ({
    id,
    imagePath,
    link: path.join(PHOTO_PATH, photoName),
    title,
    date: new Date(date),
  })
}))


photoMap.sort((first, second) => second.date - first.date)

const rootFileData = await fs.readFile(path.join(__dirname, './root.html'), { encoding: 'utf-8' })

const firstPhotoId = photoMap[0].id;

await Promise.all(photoMap.map(async (details, index, all) => {
  let localFileData = rootFileData;
  const fileName = firstPhotoId === details.id ? 'index' : details.id;

  const fileToCreate = path.join(OUTPUT_PATH, fileName);

  const prev = all[index + 1] || all[0]
  const next = all[index - 1] || all[all.length - 1]


  localFileData = localFileData.replace('_IMAGE_LINK_', details.imagePath)
  localFileData = localFileData.replace('_ADDRESS_LINK_', details.title)

  localFileData = localFileData.replace('_PREV_LINK_URL_', `/${prev.id}.html`)
  localFileData = localFileData.replace('_NEXT_LINK_URL_', `/${next.id}.html`)

  await fs.writeFile(`${fileToCreate}.html`, localFileData)
}))