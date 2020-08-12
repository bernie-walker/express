const sinon = require('sinon');
const { ImageStorage } = require('../src/imageStorage');
const { assert } = require('chai');

describe('ImageStorage', function () {
  const fakeDb = {};
  const fakeCloud = { uploader: {}, api: {} };
  const imageStorage = new ImageStorage(fakeCloud, fakeDb);
  const fakeStream = { write: sinon.fake(), end: sinon.fake() };

  afterEach(sinon.restore);

  context('.upload', function () {
    before(() => {
      const fakeUploadStream = sinon
        .stub()
        .callsArgWithAsync(1, null, { secure_url: 'image' })
        .returns(fakeStream);
      fakeCloud.uploader.upload_stream = fakeUploadStream;
    });

    it('should upload image and give image name', function () {
      imageStorage
        .upload({ mimetype: 'image/png', buffer: '' }, 1)
        .then((imagePath) => {
          sinon.assert.called(fakeStream.write);
          sinon.assert.called(fakeStream.end);
          assert.equal(imagePath, 'image');
        });
    });
  });

  context('.delete', function () {
    let oldContent;

    beforeEach(() => {
      fakeCloud.uploader.destroy = sinon.stub();
      oldContent = [
        {
          type: 'image',
          data: { file: { url: 'http//blog_image/image_1.png' } },
        },
      ];
    });

    it('should not delete an image if it is present in usedImages', function () {
      const content = [
        { type: 'image', data: { file: { url: '/blog_image/image_1.png' } } },
      ];

      imageStorage.delete(content, oldContent).then((reply) => {
        sinon.assert.notCalled(fakeCloud.uploader.destroy);
        assert.isTrue(reply);
      });
    });

    it('should delete an image if it is not present in usedImages', function () {
      const content = [
        { type: 'image', data: { file: { url: '/blog_image/image_2.png' } } },
      ];

      imageStorage.delete(content, oldContent).then((reply) => {
        sinon.assert.called(fakeCloud.uploader.destroy);
        assert.isTrue(reply);
      });
    });
  });
});
