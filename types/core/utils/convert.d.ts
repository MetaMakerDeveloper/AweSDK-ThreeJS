import * as THREE from "three";
export declare let bodyMeshName: any;
export declare let Tooth_downMeshName: any;
export declare function setBodyMorphTargetDictionary(name: any, map: any): void;
export declare function setTeethMorphTargetDictionary(name: any, map: any): void;
/**
 *
 * @param { object } fp 动画文件json结构的描述
 * @param {boolean} isEmotion 是否为表情类型的动画
 * @returns { AnimationClip }
 * @desc 通过将JSON结构的描述转化为 THREEJS 的AnimationClip
 */
export default function Convert(fp: any, isEmotion?: boolean): THREE.AnimationClip;
