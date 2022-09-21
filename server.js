const express = require('express');
const path = require('path');
const fs = require('fs');
const generate = require('nanoid/generate')
const app = express();
const port = 3000;

app.use(express.json());

app.get('/', (req, res) => {
  return res.status(200).sendFile(path.join(__dirname, '/index.html'));
});

app.get('/:id', async (req, res) => {
  if (req.params.id?.length !== 6) {
    return res.status(500).send('Invalid short id.');
  }

  let urlsRaw = await fs.readFileSync('data.json');
  let urls = JSON.parse(urlsRaw); 
  const realUrl = urls[req.params.id];

  if (!realUrl) {
    return res.status(404).send('The short URL does not exist.');
  }

  // Redirect counter by id
  urls[req.params.id].redirect++;
  fs.writeFileSync('data.json', JSON.stringify(urls, null, 2));
  
  return res.status(302).redirect(realUrl.url);
});

app.post('/api/url/short', async (req, res, next) => {
  const validationUrl = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;
  const regexUrl = new RegExp(validationUrl);

  if (!req.body?.url || !req.body?.url.match(regexUrl)) {
    return res.status(500).json({ message: 'Invalid link' });
  }

  const realUrl = req.body.url;

  try {
    let urlsRaw = await fs.readFileSync('data.json');
    let urls = JSON.parse(urlsRaw);
  
    // generate custom unique shortenUrl with date
    // const id = shortenUrl(urls);
  
    // generate shortenUrl by library
    const id = generate('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);
  
    urls[id] = { url: realUrl, redirect: 0 };
    await fs.writeFileSync('data.json', JSON.stringify(urls, null, 2));
  
    return res.status(201).json({ url: `${req.headers.origin}/${id}` });
  } catch(error) {
    return res.status(500).json({ message: error });
  };
  
});

app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});

function shortenUrl(urls) {
  console.log("test4");

  const charset = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const now = new Date();
  const keys = [
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
    now.getSeconds() + now.getMilliseconds()
  ];

  let hash = '';
  for (let i = 0; i < 6; i++) {
    const key = keys[i];
    hash += charset[key % 62]; 
  }

  return hash;
}