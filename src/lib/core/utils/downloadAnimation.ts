import * as THREE from "three";
import { downloadData } from "./downloadData";
import * as fflate from "fflate";
import { getSuffixName, largeUint8ArrayToString } from ".";
import cryptoModule from "./metacrypto.js";
export async function downloadAnimation(animationName, geometryName) {
  let arraybuffer: ArrayBuffer;
  // eslint-disable-next-line prefer-const
  arraybuffer = (await downloadData(animationName, "arraybuffer")) as ArrayBuffer;
  console.log(arraybuffer);
  const dataView = new DataView(arraybuffer);
  let offset = 0;
  const nameLen = dataView.getInt32(offset, true);
  offset += 4;
  console.log(nameLen);
  offset += nameLen;
  const length = dataView.getFloat32(offset, true);
  offset += 4;
  console.log(length);
  const num = dataView.getUint32(offset, true);
  offset += 4;
  console.log(num);

  const dict = {};

  for (let i = 0; i < num; i++) {
    const time = dataView.getFloat32(offset, true);
    offset += 4;
    const posLen = dataView.getUint32(offset, true);
    offset += 4;
    const pos = [];
    const mag = [];
    for (let j = 0; j < posLen; j++) {
      const posj = dataView.getUint16(offset, true);
      offset += 2;
      const magj = dataView.getFloat32(offset, true);
      offset += 4;
      if (dict[posj] == undefined) {
        dict[posj] = {};
        dict[posj].times = [];
        dict[posj].values = [];
      }
      dict[posj].times.push(time);
      dict[posj].values.push(magj * 0.65);
    }
  }
  console.log(dict);
  const kfs = new Array<THREE.KeyframeTrack>();
  for (const key in dict) {
    const track = new THREE.KeyframeTrack(
      geometryName + ".morphTargetInfluences[" + key + "]",
      dict[key].times,
      dict[key].values,
      THREE.InterpolateLinear
    );
    kfs.push(track);
  }
  const ac = new THREE.AnimationClip(animationName, -1, kfs, THREE.NormalAnimationBlendMode);
  return ac;
}

/**
 *
 * @param animateName 动画名称
 * @param baseUrl 地址前缀
 * @returns {Promise<object>}
 * 通过动画名称加载动画的描述，得到的是JSON结构的数据
 */
export const loadAnimationData = async function (
  animateName: string,
  baseUrl = "//img.metaworks.cn/webgl/app/"
): Promise<object> {
  let url: string;
  if (!animateName) {
    return Promise.reject("没有对应的动画名称");
  }
  if (animateName.startsWith("http")) {
    url = animateName;
  } else {
    url = `${baseUrl}/${animateName}`;
  }

  const result = (await downloadData(url, "arraybuffer")) as ArrayBuffer;
  const buffer = new Uint8Array(result) as Uint8Array;
  let fileBuffer = await new Promise((resolve) => {
    const unzipper = new fflate.Unzip();
    unzipper.register(fflate.UnzipInflate);
    unzipper.onfile = (file) => {
      // file.name is a string, file is a stream
      if (getSuffixName(file.name) == "json") {
        return;
      }
      file.ondata = (err, dat, final) => {
        // Stream output here
        resolve(dat);
      };
      console.log("Reading:", file.name);
      // File sizes are sometimes not set if the ZIP file did not encode
      // them, so you may want to check that file.size != undefined
      console.log("Compressed size", file.size);
      console.log("Decompressed size", file.originalSize);

      file.start();
    };
    unzipper.push(buffer, true);
  });

  fileBuffer = new Uint8Array(fileBuffer as any);

  let s = await largeUint8ArrayToString(fileBuffer);
  if (s[0] != "{") {
    const arraybuffer = await cryptoModule.decryptData(fileBuffer);
    s = await largeUint8ArrayToString(arraybuffer);
  }
  const json = JSON.parse(s);
  return json;
};
