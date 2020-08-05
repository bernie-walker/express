const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');

const upload = multer({
  limits: { fileSize: 2000000 },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      cb(new Error('please upload an image'));
    }
    cb(null, true);
  },
});

const changeImageIntoPng = async function (req) {
  return await sharp(req.file.buffer).png().toBuffer();
};

const getImageDetails = async function (req) {
  const { blogImagePath, expressDS } = req.app.locals;
  const { storyID } = req.params;

  const imageID = await expressDS.incrID(`img_${storyID}`);

  const [, root] = __dirname.match(/(.*express\/)(.*)/);

  const imageName = `image_${storyID}_${imageID}.png`;
  const imageStorePath = root + blogImagePath + imageName;

  return { imageStorePath, imageName };
};

const getStoryImages = function (content) {
  return content.reduce((images, block) => {
    if (block.type === 'image') {
      const imageUrl = block.data.file.url || '';
      const [, , image] = imageUrl.split('/');
      image && images.push(image);
    }
    return images;
  }, []);
};

const handleImages = function (storyID, content) {
  const usedImages = getStoryImages(content);

  const imageDir = `${__dirname}/../data/images`;
  const files = fs.readdirSync(imageDir);

  const isUnusedImage = (file) =>
    file.startsWith(`image_${storyID}_`) && !usedImages.includes(file);

  files.forEach((file) => {
    if (isUnusedImage(file)) {
      fs.unlinkSync(`${imageDir}/${file}`);
    }
  });
};

module.exports = {
  imageValidation: upload.single('image'),
  handleImages,
  changeImageIntoPng,
  getImageDetails,
};
