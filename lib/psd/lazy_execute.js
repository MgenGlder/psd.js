/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// LazyExecute is very important when it comes to speed. Because some PSD documents
// can be extremely large and hold a LOT of data, we can significantly speed up
// parsing by temporarily skipping over chunks of the PSD. Chances are that you aren't
// going to use every piece of data in the document. This means, when you do request
// some data that's proxied through LazyExecute, we can parse it on the fly. This overhead
// should be incredibly minimal.
// 
// While not as elegant as the PSD.rb counterpart, it gets the job done. We look at the
// object we need to proxy, and define proxies for every item on its prototype on this
// one. The proxy checks to see if the object has been loaded first before passing on
// the call to the object.
// 
// If the object has not been loaded yet, we record our current position in the file, jump
// to the known start position of the data, parse it by calling a set method on the object,
// jump back to the original position in the file, and then call the proxied property.
// 
// ## Example
// ``` coffeescript
// obj = new SomeObject()
// data = new LazyExecute(obj, file)
//   .now('skip')
//   .later('parse')
//   .ignore('foo', 'bar')
//   .get()
// ```
let LazyExecute;
module.exports = (LazyExecute = class LazyExecute {
  constructor(obj, file) {
    this.obj = obj;
    this.file = file;
    this.startPos = this.file.tell();
    this.loaded = false;
    this.loadMethod = null;
    this.loadArgs = [];
    this.passthru = [];
  }

  // This describes the method that we want to run at object instantiation. Typically this
  // will skip over the data that we will parse on-demand later. We can pass any arguments
  // we want to the method as well.
  now(method, ...args) {
    this.obj[method].apply(this.obj, args);
    return this;
  }

  // Here we describe the method we want to run when the first method/property on the object
  // is accessed. We can also define any arguments that need to be passed to the function.
  later(method, ...args) {
    this.loadMethod = method;
    this.loadArgs = args;
    return this;
  }

  // Sometimes we don't have to parse the data in order to get some important information.
  // For example, we can get the widht/height from the full preview image without parsing the
  // image itself, since that data comes from the header. Purely convenience, but helps to 
  // optimize usage.
  // 
  // The arguments are a list of method/property names we don't want to trigger on-demand parsing.
  ignore(...args) {
    this.passthru.concat(args);
    return this;
  }

  // This is called once all of the paramters of the proxy have been set up, i.e. now, later, and skip.
  // This defines all items on the proxied objects prototype on this object, and checks to make sure
  // the proxied object has been loaded before passing on the call.
  get() {
    for (let key in this.obj) { const val = this.obj[key]; ((key, val) => {
      if (this[key] != null) { return; }
      return Object.defineProperty(this, key, {
        get() {
          if (!this.loaded && !(Array.from(this.passthru).includes(key))) { this.load(); }
          return this.obj[key];
        }
      });
    })(key, val); }

    return this;
  }

  // If we are accessing a property for the first time, then this will call the load method, which
  // was defined during setup with `later()`. The steps this performs are:
  // 
  // 1. Records the current file position.
  // 2. Jumps to the recorded start position for the proxied data.
  // 3. Calls the load method, which was defined with `later()`.
  // 4. Jumps back to the original file position.
  // 5. Sets the `@loaded` flag to true so we know this object has been parsed.
  load() {
    const origPos = this.file.tell();
    this.file.seek(this.startPos);

    this.obj[this.loadMethod].apply(this.obj, this.loadArgs);

    this.file.seek(origPos);
    return this.loaded = true;
  }
});
