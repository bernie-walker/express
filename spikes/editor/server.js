const fs = require('fs');
const express = require('express');
const multer = require('multer');
const sharp = require('sharp');

const app = express();
app.use(express.static('public'));

app.use((req, res, next) => {
  console.log(req.method, req.path);
  next();
});

const upload = multer({
  limits: { fileSize: 1000000 },
  fileFilter(req, file, cb) {
    console.log(file);
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      cb(new Error('please upload an image'));
    }
    cb(null, true);
  },
});

let image = 0;
app.post('/uploadImage', upload.single('image'), async (req, res) => {
  const buffer = await sharp(req.file.buffer).png().toBuffer();
  image++;
  fs.writeFileSync(`./public/images/image_${image}.png`, buffer);
  res.send({
    success: 1,
    file: {
      url: `/images/image_${image}.png`,
    },
  });
});

app.use(express.json());

app.post('/saveData', (req, res) => {
  const data = req.body;
  console.log(JSON.stringify(data, null, 2));
  res.status(201);
});

app.listen(3000, () => console.log('server is on'));
