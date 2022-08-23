import * as THREE from "three";
export const getSuffixName: (name: string) => string;
export const Uint8ArrayToString: (file: ArrayBuffer) => string;
export const downloadAnimation: (animateName: string, geometryName: string) => THREE.AnimationClip;
export const loadAnimateData: (animationName: string) => THREE.AnimationClip;
