import fs from 'fs';
import https from 'https';

const download = (url: string, dest: string) => {
  return new Promise<void>((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
};

async function main() {
  if (!fs.existsSync('public')) {
    fs.mkdirSync('public');
  }
  await download('https://traitorously-great-murre.cloudpub.ru/jpegLogo.jpg', 'public/logo.jpg');
  await download('https://traitorously-great-murre.cloudpub.ru/media/svetlana_y28h3.jpeg', 'public/svetlana.jpeg');
  console.log('Downloaded');
}

main();
