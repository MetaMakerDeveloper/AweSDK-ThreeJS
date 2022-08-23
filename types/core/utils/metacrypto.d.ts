export default cryptoModule;
declare let cryptoModule: CryptoModule;
declare class CryptoModule {
    initPromise: Promise<any>;
    info: {
        wasi_snapshot_preview1: {
            proc_exit: () => void;
        };
    };
    loadWasm(): void;
    decryptData(data: any): Promise<Uint8Array>;
}
