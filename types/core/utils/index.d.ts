/**
 *
 * @param { string } name 文件名称
 * @returns { string } 后缀名
 */
export declare const getSuffixName: (name: any) => any;
export declare function Uint8ArrayToString(fileData: any): string;
export declare function largeUint8ArrayToString(uint8arr: any): Promise<string>;
export declare const b64toBlob: (b64Data: any, contentType?: string, sliceSize?: number) => Blob;
export declare const splitb64: (str: string) => {
    b64Data: string;
    contentType: string;
};
