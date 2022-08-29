/* eslint-disable*/
import * as THREE from "three";
function replaceAll( string, find, replace ) {
  return string.split( find ).join( replace );
}
const meshphong_frag_head = THREE.ShaderChunk[ 'meshphysical_frag' ].slice( 0, THREE.ShaderChunk[ 'meshphysical_frag' ].indexOf( 'void main() {' ) );
const meshphong_frag_body = THREE.ShaderChunk[ 'meshphysical_frag' ].slice( THREE.ShaderChunk[ 'meshphysical_frag' ].indexOf( 'void main() {' ) );
const SubsurfaceScatteringShader = {
uniforms: THREE.UniformsUtils.merge( [ THREE.ShaderLib[ 'standard' ].uniforms, {
// 'thicknessMap': {
//  value: null
//  },
//  'thicknessColor': {
//  value: new THREE.Color( 0xffffff )
//  },
//  'thicknessDistortion': {
//  value: 0.1
//  },
// 'thicknessAmbient': {
// value: 0.0
// },
// 'thicknessAttenuation': {
// value: 0.1
// },
// 'thicknessPower': {
// value: 2.0
//  },
// 'thicknessScale': {
// value: 10.0
// }
} ] ),
//vertexShader: [ '#define USE_UV', THREE.ShaderChunk[ 'meshphong_vert' ] ].join( '\n' ),
vertexShader: [  THREE.ShaderChunk[ 'meshphysical_vert' ] ].join( '\n' ),
//fragmentShader: [ '#define USE_UV', '#define SUBSURFACE', meshphong_frag_head, 'uniform sampler2D thicknessMap;', 'uniform float thicknessPower;', 'uniform float thicknessScale;', 'uniform float thicknessDistortion;', 'uniform float thicknessAmbient;', 'uniform float thicknessAttenuation;', 'uniform vec3 thicknessColor;', 'void RE_Direct_Scattering(const in IncidentLight directLight, const in vec2 uv, const in GeometricContext geometry, inout ReflectedLight reflectedLight) {', '	vec3 thickness = thicknessColor * texture2D(thicknessMap, uv).r;', '	vec3 scatteringHalf = normalize(directLight.direction + (geometry.normal * thicknessDistortion));', '	float scatteringDot = pow(saturate(dot(geometry.viewDir, -scatteringHalf)), thicknessPower) * thicknessScale;', '	vec3 scatteringIllu = (scatteringDot + thicknessAmbient) * thickness;', '	reflectedLight.directDiffuse += scatteringIllu * thicknessAttenuation * directLight.color;', '}', meshphong_frag_body.replace( '#include <lights_fragment_begin>', replaceAll( THREE.ShaderChunk[ 'lights_fragment_begin' ], 'RE_Direct( directLight, geometry, material, reflectedLight );', [ 'RE_Direct( directLight, geometry, material, reflectedLight );', '#if defined( SUBSURFACE ) && defined( USE_UV )', ' RE_Direct_Scattering(directLight, vUv, geometry, reflectedLight);', '#endif' ].join( '\n' ) ) ) ].join( '\n' )
fragmentShader:[ THREE.ShaderChunk[ 'meshphysical_frag' ] ].join( '\n' )
};

const standard= {
  uniforms: /*@__PURE__*/THREE.UniformsUtils.merge([THREE.UniformsLib.common, THREE.UniformsLib.envmap, THREE.UniformsLib.aomap, THREE.UniformsLib.lightmap, THREE.UniformsLib.emissivemap, THREE.UniformsLib.bumpmap, THREE.UniformsLib.normalmap, THREE.UniformsLib.displacementmap, THREE.UniformsLib.roughnessmap, THREE.UniformsLib.metalnessmap, THREE.UniformsLib.fog, THREE.UniformsLib.lights, {
    emissive: {
      value: /*@__PURE__*/new THREE.Color(0x000000)
    },
    roughness: {
      value: 1.0
    },
    metalness: {
      value: 0.0
    },
    envMapIntensity: {
      value: 1
    } // temporary

  }]),
  vertexShader: THREE.ShaderChunk.meshphysical_vert,
  fragmentShader: THREE.ShaderChunk.meshphysical_frag
}


export function resetMaterial(model) {
 
 

 
  const hairs: any[] = [];
  model.traverse((n) => {
    if (n.material != null && n.material.name.indexOf("Hair") >= 0) {
      hairs.push(n);
    } else if (n.material != null && n.material.name.indexOf("DiffNormalPacked") >= 0) {
      n.material.depthWrite = true;
    }
   
    if (n.material != null) {
      if (n.material.name.indexOf("head_sss") >= 0)//||n.material.name.indexOf("body_sss") >= 0) 
      {
       
        const shader = SubsurfaceScatteringShader;
        var material = new THREE.ShaderMaterial( {
				uniforms: THREE.UniformsUtils.clone( SubsurfaceScatteringShader.uniforms ),
				vertexShader: shader.vertexShader,
				fragmentShader: shader.fragmentShader,
			} );
if(true)
{


    var source=n.material;

    var m:any=material;

    m.blending = source.blending;
    m.side = source.side;
    m.vertexColors = source.vertexColors;
    m.opacity = source.opacity;
    m.transparent = source.transparent;
    m.blendSrc = source.blendSrc;
    m.blendDst = source.blendDst;
    m.blendEquation = source.blendEquation;
    m.blendSrcAlpha = source.blendSrcAlpha;
    m.blendDstAlpha = source.blendDstAlpha;
    m.blendEquationAlpha = source.blendEquationAlpha;
    m.depthFunc = source.depthFunc;
    m.depthTest = source.depthTest;
    m.depthWrite = source.depthWrite;
    m.stencilWriteMask = source.stencilWriteMask;
    m.stencilFunc = source.stencilFunc;
    m.stencilRef = source.stencilRef;
    m.stencilFuncMask = source.stencilFuncMask;
    m.stencilFail = source.stencilFail;
    m.stencilZFail = source.stencilZFail;
    m.stencilZPass = source.stencilZPass;
    m.stencilWrite = source.stencilWrite;
    const srcPlanes = source.clippingPlanes;
    let dstPlanes = null;

    if (srcPlanes !== null) {
      const n = srcPlanes.length;
      dstPlanes = new Array(n);

      for (let i = 0; i !== n; ++i) {
        dstPlanes[i] = srcPlanes[i].clone();
      }
    }

    m.clippingPlanes = dstPlanes;
    m.clipIntersection = source.clipIntersection;
    m.clipShadows = source.clipShadows;
    m.shadowSide = source.shadowSide;
    m.colorWrite = source.colorWrite;
    m.precision = source.precision;
    m.polygonOffset = source.polygonOffset;
    m.polygonOffsetFactor = source.polygonOffsetFactor;
    m.polygonOffsetUnits = source.polygonOffsetUnits;
    m.dithering = source.dithering;
    m.alphaTest = source.alphaTest;
    m.alphaToCoverage = source.alphaToCoverage;
    m.premultipliedAlpha = source.premultipliedAlpha;
    m.visible = source.visible;
    m.toneMapped = source.toneMapped;
    m.userData = JSON.parse(JSON.stringify(source.userData));

    material.defines = { 'STANDARD': '' };

		m.color= source.color.clone();
		m.roughness = source.roughness;
		m.metalness = source.metalness;
		m.map = source.map;
		m.lightMap = source.lightMap;
		m.lightMapIntensity = source.lightMapIntensity;
		m.aoMap = source.aoMap;
		m.aoMapIntensity = source.aoMapIntensity;
		m.emissive=source.emissive.clone();
		m.emissiveMap = source.emissiveMap;
		m.emissiveIntensity = source.emissiveIntensity;
		m.bumpMap = source.bumpMap;
		m.bumpScale = source.bumpScale;
		m.normalMap = source.normalMap;
		m.normalMapType = source.normalMapType;
		m.normalScale=source.normalScale.clone(); 
		m.displacementMap = source.displacementMap;
		m.displacementScale = source.displacementScale;
		m.displacementBias = source.displacementBias;
		m.roughnessMap = source.roughnessMap;
		m.metalnessMap = source.metalnessMap;
		m.alphaMap = source.alphaMap;
		m.envMap = source.envMap;
		m.envMapIntensity = source.envMapIntensity;
		m.wireframe = source.wireframe;
		m.wireframeLinewidth = source.wireframeLinewidth;
		m.wireframeLinecap = source.wireframeLinecap;
		m.wireframeLinejoin = source.wireframeLinejoin;
		m.flatShading = source.flatShading;
		m.fog = source.fog;

    m.isMeshStandardMaterial=true;
   
  }
  console.log(n.material);
    n.material=material;
    console.log(n.material);
    }
    }

  });
  hairs.forEach((n) => {
    const materialFirstPass = new THREE.MeshBasicMaterial({
      alphaTest: 0.9,
      transparent: false,
      side: THREE.DoubleSide,
    });
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
    materialFirstPass.map = n.material.map;
    materialBackSide.map = n.material.map;
    materialFrontSide.map = n.material.map;
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
