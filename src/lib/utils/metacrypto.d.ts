declare class CryptoModule {
  private loadWasm(): Promise<WebAssembly.Instance>;
  decryptData(data: ArrayBuffer): ArrayBuffer;
}
