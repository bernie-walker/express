const getUsedImages = function (content) {
  return content.reduce((images, block) => {
    if (block.type === 'image') {
      const imageUrl = block.data.file.url || '';
      const indexFromLast = -2;
      const [folder, image] = imageUrl.split('/').slice(indexFromLast);
      const [imageName] = image.split('.');
      image && images.push(`${folder}/${imageName}`);
    }
    return images;
  }, []);
};

const destroyImage = function (cloud, imageId) {
  return new Promise((resolve) => {
    cloud.destroy(imageId, resolve);
  });
};

class ImageStorage {
  constructor(cloud, db) {
    this.cloud = cloud;
    this.db = db;
  }

  upload(storyID, file) {
    return new Promise((resolve, reject) => {
      const imageOptions = { tags: storyID, folder: 'blog_image' };
      const callBack = function (err, res) {
        if (err) {
          reject(err);
        } else {
          resolve(res.secure_url);
        }
      };

      const stream = this.cloud.uploader.upload_stream(imageOptions, callBack);
      stream.write(file.buffer);
      stream.end();
    });
  }

  async delete(storyID, userID, currentContent) {
    const story = await this.db.getStoryOfUser(storyID, userID);
    const storedImages = getUsedImages(JSON.parse(story.content));
    const usedImages = getUsedImages(currentContent);

    for (const image of storedImages) {
      if (!usedImages.includes(`${image}`)) {
        await destroyImage(this.cloud.uploader, image);
      }
    }

    return true;
  }
}
module.exports = { ImageStorage };
