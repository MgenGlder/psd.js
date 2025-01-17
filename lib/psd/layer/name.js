/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Util = require('../util.js');

module.exports = {
  // Every Photoshop document has what we can consider to be the "legacy" name.
  // This used to be the sole place that Photoshop stored the layer name, but once
  // people started using fancy UTF-8 characters, they moved the layer name out into
  // a layer info block. This stayed behind for compatibility reasons. The newer layer
  // name is always preferred since it covers all possible characters (even emojis),
  // while this has a much more limited character set.
  parseLegacyLayerName() {
    const len = Util.pad4(this.file.readByte());
    return this.legacyName = this.file.readString(len);
  }
};
