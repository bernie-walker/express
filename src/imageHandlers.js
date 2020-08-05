const fs = require('fs');

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

const isUnusedImage = function (image, storyID, usedImages) {
  return image.startsWith(`image_${storyID}_`) && !usedImages.includes(image);
};

class ImageHandlers {
  constructor(dsClient, path) {
    this.dsClient = dsClient;
    this.path = path;
  }

  async getNewImageName(storyID, mimetype) {
    const imageID = await this.dsClient.incrID(`img_${storyID}`);
    const [, extension] = mimetype.split('/');
    return `image_${storyID}_${imageID}.${extension}`;
  }

  uploadImage({ buffer, mimetype }, storyID) {
    return new Promise((resolve) => {
      this.getNewImageName(storyID, mimetype).then((imageName) => {
        fs.writeFileSync(`${this.path}/${imageName}`, buffer);
        resolve(imageName);
      });
    });
  }

  deleteUnusedImages(storyID, content) {
    return new Promise((resolve) => {
      const storyImages = getStoryImages(content);
      const allImages = fs.readdirSync(this.path);

      allImages.forEach((image) => {
        if (isUnusedImage(image, storyID, storyImages)) {
          fs.unlinkSync(`${this.path}/${image}`);
        }
      });
      resolve();
    });
  }
}

module.exports = { ImageHandlers };
