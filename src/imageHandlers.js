const getUsedImages = function (content) {
  return content.reduce((images, block) => {
    if (block.type === 'image') {
      const imageUrl = block.data.file.url || '';
      const indexFromLast = -2;
      const [folder, image] = imageUrl.split('/').slice(indexFromLast);
      image && images.push(`${folder}/${image}`);
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
  constructor(cloud) {
    this.cloud = cloud;
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

  getImagesOfStory(storyID) {
    return new Promise((resolve) => {
      this.cloud.api.resources_by_tag(storyID, (err, res) => {
        if (!err) {
          resolve(res.resources);
        }
      });
    });
  }

  async delete(storyID, content) {
    const res = await this.getImagesOfStory(storyID);
    const usedImages = getUsedImages(content);

    for (const image of res) {
      if (!usedImages.includes(`${image.public_id}.png`)) {
        await destroyImage(this.cloud.uploader, image.public_id);
      }
    }

    return true;
  }
}
module.exports = { ImageStorage };
