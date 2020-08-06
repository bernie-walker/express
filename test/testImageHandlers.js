const { expect } = require('chai').use(require('chai-as-promised'));
const sinon = require('sinon');
const fs = require('fs');
const { ImageHandlers } = require('../src/imageHandlers');
const { ExpressDS } = require('../src/dataProviders');

describe('function under test', function () {
  let imageHandlers;
  before(() => {
    sinon.stub(fs, 'writeFileSync').returns(undefined);
    sinon.stub(fs, 'readdirSync').returns(['image_1_2.png']);
    sinon.stub(fs, 'unlinkSync').returns(undefined);
    const fakeDSProvider = {};
    const expressDS = new ExpressDS(fakeDSProvider);
    fakeDSProvider.incr = sinon.stub().callsArgWithAsync(1, null, 2);
    imageHandlers = new ImageHandlers(expressDS, 'path');
  });

  after(sinon.restore);

  context('.getNewImageName', function () {
    it('should give image name', function () {
      return expect(
        imageHandlers.getNewImageName(1, 'image/png')
      ).to.eventually.equal('image_1_2.png');
    });
  });

  context('.uploadImage', function () {
    it('should upload image and give image name', function () {
      return expect(
        imageHandlers.uploadImage({ mimetype: 'image/png' }, 1)
      ).to.eventually.equal('image_1_2.png');
    });
  });

  context('.deleteUnusedImages', function () {
    it('should delete unused image of given story', function () {
      return expect(
        imageHandlers.deleteUnusedImages(1, [])
      ).to.eventually.fulfilled;
    });
  });
});
