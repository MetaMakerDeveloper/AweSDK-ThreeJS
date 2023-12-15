import * as THREE from "three";
export declare function downloadAnimation(animationName: any, geometryName: any, ratio?: number): Promise<THREE.AnimationClip>;
/**
 *
 * @param animateName 动画名称
 * @param baseUrl 地址前缀
 * @returns {Promise<object>}
 * 通过动画名称加载动画的描述，得到的是JSON结构的数据
 */
export declare const loadAnimationData: (animateName: string, baseUrl?: string) => Promise<object>;
