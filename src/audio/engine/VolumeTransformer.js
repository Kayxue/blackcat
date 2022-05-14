import { Transform } from "stream";

class VolumeTransformer extends Transform {
  constructor(options = {}) {
    super(options);

    this._readInt = (buffer, index) => buffer.readInt16LE(index);
    this._writeInt = (buffer, int, index) =>
      buffer.writeInt16LE(int, index);
    this._bits = 16;
    this._bytes = this._bits / 8;
    this._extremum = Math.pow(2, this._bits - 1);
    this._volume =
      typeof options.volume === "undefined" ? 1 : options.volume;
    this._chunk = Buffer.alloc(0);
  }

  _readInt(_buffer, index) {
    return index;
  }
  _writeInt(_buffer, _int, index) {
    return index;
  }

  _transform(chunk, _encoding, done) {
    // If the volume is 1, act like a passthrough stream
    if (this._volume === 1) {
      this.push(chunk);
      return done();
    }

    const { _bytes, _extremum } = this;

    chunk = this._chunk = Buffer.concat([this._chunk, chunk]);
    if (chunk.length < _bytes) return done();

    const complete = Math.floor(chunk.length / _bytes) * _bytes;

    for (let i = 0; i < complete; i += _bytes) {
      const int = Math.min(
        _extremum - 1,
        Math.max(
          -_extremum,
          Math.floor(this._volume * this._readInt(chunk, i)),
        ),
      );
      this._writeInt(chunk, int, i);
    }

    this._chunk = chunk.slice(complete);
    this.push(chunk.slice(0, complete));
    return done();
  }

  _destroy(err, cb) {
    super._destroy(err, cb);
    this._chunk = null;
  }

  setVolume(volume) {
    this._volume = volume;
  }

  get volume() {
    return this._volume;
  }
}

export default VolumeTransformer;
