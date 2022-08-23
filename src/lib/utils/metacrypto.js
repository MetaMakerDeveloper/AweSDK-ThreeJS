/* eslint-disable @typescript-eslint/no-empty-function */

import wasm from "@/assets/metacrypto.wasm";
const importObject = {
  wasi_snapshot_preview1: { proc_exit: () => {} },
};
let loadPromise = wasm(importObject);
class CryptoModule {
  constructor() {
    this.initPromise = new Promise((_resolve) => {});
    this.info = {
      wasi_snapshot_preview1: { proc_exit: () => {} },
    };
    this.loadWasm();
  }
  loadWasm() {
    this.initPromise = loadPromise;
  }
  decryptData(data) {
    return this.initPromise.then(({ instance }) => {
      let {
        cppDecodeEncrypt,
        cppGetReadDataLength,
        cppGetWriteDataPtr,
        cppSetEncryptKey,
        cppEncodeEncrypt,
        memory,
      } = instance.exports;
      let Int8View = new Uint8Array(memory.buffer);
      if (ArrayBuffer.isView(data)) {
        //if(true){
        var intdata = new Uint8Array(data);
        let bytesSize = intdata.length;

        let writeDataOffset = cppGetWriteDataPtr(bytesSize);
        Int8View.set(intdata, writeDataOffset);

        let readDataOffset = cppDecodeEncrypt(bytesSize);
        let readDataLength = cppGetReadDataLength();
        let out_intdata = Int8View.subarray(readDataOffset, readDataOffset + readDataLength);

        return out_intdata.slice(0);
      }
    });
  }
}

let cryptoModule = new CryptoModule();
export default cryptoModule;
