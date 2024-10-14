import * as THREE from "three";
import { downloadAnimation, loadAnimationData } from "./utils/downloadAnimation";
import Convert from "./utils/convert";
export declare const b64toBlob: (b64Data: any, contentType?: string, sliceSize?: number) => Blob;
export declare const splitb64: (str: string) => {
    b64Data: string;
    contentType: string;
};
export declare function parseImageToBase64(url: string): Promise<string>;
declare function loadGLTFModel(url: string): Promise<THREE.Group>;
declare function parseGLTFModel(buffer: ArrayBuffer): Promise<THREE.Group>;
declare function loadGLTFAnimation(url: string): Promise<THREE.AnimationClip>;
declare function setModelInfo(model: any, resetM?: boolean): any;
declare function resetPolygonOffset(model: any, camera: any): void;
declare function loadTTSTeethAnimation(url: string, ratio?: number): Promise<THREE.AnimationClip>;
declare function loadTTSEmoAnimation(url: string, ratio?: number): Promise<THREE.AnimationClip>;
export { Convert, loadAnimationData, downloadAnimation, loadGLTFModel, parseGLTFModel, loadTTSTeethAnimation, loadTTSEmoAnimation, resetPolygonOffset, loadGLTFAnimation, setModelInfo, };
