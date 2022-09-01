/* eslint-disable*/
import * as THREE from "three";
function replaceAll( string, find, replace ) {
  return string.split( find ).join( replace );
}
const meshphong_frag_head = THREE.ShaderChunk[ 'meshphysical_frag' ].slice( 0, THREE.ShaderChunk[ 'meshphysical_frag' ].indexOf( 'void main() {' ) );
const meshphong_frag_body = THREE.ShaderChunk[ 'meshphysical_frag' ].slice( THREE.ShaderChunk[ 'meshphysical_frag' ].indexOf( 'void main() {' ) );
const loader = new THREE.TextureLoader();
const _SSSLUTTexture = loader.load( 'models/fbx/SSSLUT.png' );
const SubsurfaceScatteringShader = {
uniforms: THREE.UniformsUtils.merge( [ THREE.ShaderLib[ 'standard' ].uniforms, {
'_SSSLUT': {
  value: _SSSLUTTexture
},
'_CurveFactor': {
  value: 0.9
},
} ] ),
vertexShader: [ '#define USE_UV', THREE.ShaderChunk[ 'meshphong_vert' ] ].join( '\n' ),
fragmentShader: [ '#define USE_UV', '#define SUBSURFACE', meshphong_frag_head, 'uniform sampler2D _SSSLUT;', 'uniform float _CurveFactor;',
 'void RE_Direct_Scattering(const in IncidentLight directLight, const in vec2 uv, const in GeometricContext geometry, inout ReflectedLight reflectedLight) {', 
 //'	vec3 thickness = thicknessColor * texture2D(thicknessMap, uv).r;',
 //'	vec3 scatteringHalf = normalize(directLight.direction + (geometry.normal * thicknessDistortion));', 
 //'	float scatteringDot = pow(saturate(dot(geometry.viewDir, -scatteringHalf)), thicknessPower) * thicknessScale;', 
 //'	vec3 scatteringIllu = (scatteringDot + thicknessAmbient) * thickness;', 
 //'	reflectedLight.directDiffuse += scatteringIllu * thicknessAttenuation * directLight.color;',

  
  '	float NoL = dot(geometry.normal, directLight.direction);', 
  '	vec4 diffuse =texture2D(_SSSLUT,vec2(NoL * 0.5 + 0.5,_CurveFactor))*0.03;', 
  '	reflectedLight.directDiffuse += diffuse.xyz * directLight.color;',


  '}',
 meshphong_frag_body.replace( '#include <lights_fragment_begin>', replaceAll( THREE.ShaderChunk[ 'lights_fragment_begin' ], 'RE_Direct( directLight, geometry, material, reflectedLight );', [ 'RE_Direct( directLight, geometry, material, reflectedLight );', '#if defined( SUBSURFACE ) && defined( USE_UV )', ' RE_Direct_Scattering(directLight, vUv, geometry, reflectedLight);', '#endif' ].join( '\n' ) ) ) ].join( '\n' )

};




export function resetPolygonOffset(model,camera)
{
  model.traverse((n) => {
    if (n.material != null ){
      if(n.material.name.indexOf("Hair") >= 0) {
      } else if (n.material.name.indexOf("DiffNormalPacked") >= 0) {
      }else if (n.material.name.indexOf("head_sss") >= 0||n.material.name.indexOf("body_sss") >= 0 ){
      } else if(n.material.side==THREE.DoubleSide){
        console.log("XXXXXXXXXXXXXXXXXXXXXXX"+n.name);
        var m=n.material.clone();
        m.polygonOffset=true;
        m.polygonOffsetFactor = -1.0;
        var p=model.position.clone().sub(camera.position);
        p.y=0;
        console.log(p);
        m.polygonOffsetUnits =-3000.0/p.length();
        n.material=m;
      }
  }
  });

}
export function resetMaterial(model) {
  const hairs: any[] = [];
  model.traverse((n) => {
    if (n.material != null ){
      if(n.material.name.indexOf("Hair") >= 0) {
      hairs.push(n);
      } else if (n.material.name.indexOf("DiffNormalPacked") >= 0||n.material.name.indexOf("Custom/Diff") >= 0) {
       n.material.depthWrite = true;
       n.material.roughness=1;
       //hairs.push(n);
      }else{
      // n.material.roughness=0.8;
      }
    resetSSSMaterial(n) ;
    }
   }
  );

   
  hairs.forEach((n) => {
    const materialFirstPass = new THREE.MeshBasicMaterial({
      alphaTest: 0.99,
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
    materialFirstPass.name=n.material.name+"materialFirstPass";
    materialBackSide.name=n.material.name+"materialBackSide";
    materialFrontSide.name=n.material.name+"materialFrontSide";
    
    // if(n.material.name.indexOf("Hair") < 0) {
    //   materialFirstPass.polygonOffset=true;
    //   materialFirstPass.polygonOffsetFactor=-1.0
    //   materialFirstPass.polygonOffsetUnits =-10000.0;
    //   materialBackSide.polygonOffset=true;
    //   materialBackSide.polygonOffsetFactor=-1.0
    //   materialBackSide.polygonOffsetUnits =10000.0;
    //   materialFrontSide.polygonOffset=true;
    //   materialFrontSide.polygonOffsetFactor=-1.0
    //   materialFrontSide.polygonOffsetUnits =10000.0;
    //   console.log("XXXXXXXXXXXXXXXXXXXYYYYYYYYYYYYYYYYYYYY")
    // }
   
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
function resetSSSMaterial(n) 
{

    if (n.material.name.indexOf("head_sss") >= 0||n.material.name.indexOf("body_sss") >= 0) 
    {
     
      const shader = SubsurfaceScatteringShader;
      var material = new THREE.ShaderMaterial( {
      uniforms: THREE.UniformsUtils.clone( SubsurfaceScatteringShader.uniforms ),
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader,
      } );
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

      console.log(n.material);
      material.name=n.material.name;
      n.material=material;
      console.log(n.material);
    }
}