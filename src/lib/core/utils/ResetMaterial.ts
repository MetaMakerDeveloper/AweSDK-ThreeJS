/* eslint-disable*/
import * as THREE from "three";
export function resetMaterial(model) {
  const materialBackSide = new THREE.MeshBasicMaterial({
    blending: THREE.NormalBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.SrcAlphaFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    depthWrite: false,
    depthTest: true,
    transparent: true,
    side: THREE.BackSide,
  });
  const materialFrontSide = new THREE.MeshBasicMaterial({
    blending: THREE.NormalBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.SrcAlphaFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    depthWrite: false,
    depthTest: true,
    transparent: true,
    side: THREE.FrontSide,
  });
  const materialDoubleSide = new THREE.MeshBasicMaterial({
    blending: THREE.NormalBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.SrcAlphaFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    depthWrite: false,
    depthTest: true,
    transparent: true,
    side: THREE.DoubleSide,
  });

  const materialFirstPass = new THREE.MeshBasicMaterial({
    alphaTest: 0.9,
    transparent: false,
    side: THREE.DoubleSide,
  });
  const hairs: any[] = [];
  model.traverse((n) => {
    if (n.material != null && n.material.name.indexOf("Hair") >= 0) {
      hairs.push(n);
    } else if (n.material != null && n.material.name.indexOf("DiffNormalPacked") >= 0) {
      n.material.depthWrite = true;
    }
   
    // if (n.material != null) {
    //   // eslint-disable-next-line no-empty
    //   if (n.material.name.indexOf("BrownEye") >= 0) {
    //     // console.log("///////////////////////////////////");
    //     // console.log(n.material.name);
    //     // console.log(n.material);
    //     // eslint-disable-next-line no-empty
    //   }
    //   else {
    //     n.material.roughness = 0.8;
    //   }
    // }
  });
  hairs.forEach((n) => {
    materialFirstPass.map = n.material.map;
    materialBackSide.map = n.material.map;
    materialFrontSide.map = n.material.map;
    materialDoubleSide.map = n.material.map;
    n.material = materialFirstPass;
    let mesh2 = n.clone();
    n.parent.add(mesh2);
    mesh2.material = materialBackSide;
    mesh2.renderOrder = n.renderOrder + 1;

    mesh2 = n.clone();
    n.parent.add(mesh2);
    mesh2.material = materialFrontSide;
    mesh2.renderOrder = n.renderOrder + 2;
  });
}
