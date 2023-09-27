import {vec3, vec4,mat4} from 'gl-matrix';
const Stats = require('stats-js');
import * as DAT from 'dat.gui';
import Icosphere from './geometry/Icosphere';
import Square from './geometry/Square'
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  tesselations: 5,
  'Load Scene': loadScene, // A function pointer, essentially
  primaryColor:[219, 85, 21,1],
  secondaryColor:[0, 0, 0,1],
  highAmp: 0.5,
  lowAmp: 1.0,
};

let icosphere: Icosphere;
let square: Square;
let prevTesselations: number = 5;
let color: vec4;
let color2: vec4;

function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations);
  icosphere.create();

  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();
}

function loadGUI(){
    const gui = new DAT.GUI();
    gui.add(controls, 'tesselations', 0, 8).step(1);
    color = vec4.fromValues(0.86,0.33,0.08,1);
    gui.addColor(controls,"primaryColor").name("primary color").onChange((value)=>{
      color = vec4.fromValues(value[0]/255.0,value[1]/255.0,value[2]/255.0,1);
    });
    color2 = vec4.fromValues(0,0,0,1);
    gui.addColor(controls,"secondaryColor").name("secondary color").onChange((value)=>{
      color2 = vec4.fromValues(value[0]/255.0,value[1]/255.0,value[2]/255.0,1);
    });
    gui.add(controls,"highAmp",0.0,1.0).name("high amp");
    gui.add(controls,"lowAmp",0.0,1.0).name("low amp");

    var resetSliders = function (name:string,val:any) {
      for (var i = 0; i < gui.__controllers.length; i++) {
          if (gui.__controllers[i].property==name){
             gui.__controllers[i].setValue(val);
          }   
      }
    };

    var obj = {
      reset: function() {
        controls.tesselations = 5;
        color = vec4.fromValues(219/255., 85/255., 21/255.,1);
        color2 = vec4.fromValues(0, 0, 0,1);
        controls.highAmp = 0.5;
        controls.lowAmp = 1.0;
        resetSliders("tesselations",5);
        resetSliders("primaryColor",[219, 85, 21,1]);
        resetSliders("secondaryColor",[0, 0, 0,1]);
        resetSliders("highAmp",.5);
        resetSliders("lowAmp",1.0);
      }
    };

    gui.add(obj, "reset").name("reset");
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();
  loadGUI();
  
  const camera = new Camera(vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0));
  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);

  lambert.addUnif("u_Time");
  lambert.addUnif("u_Color2");
  lambert.addUnif("u_lowAmp");
  lambert.addUnif("u_highAmp");

  const background = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/background-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/background-frag.glsl')),
  ]);

  background.addUnif("u_Time");
  background.addUnif("u_Color2");
  background.addUnif("u_lowAmp");
  background.addUnif("u_highAmp");


  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    if(controls.tesselations != prevTesselations)
    {
      prevTesselations = controls.tesselations;
      icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, prevTesselations);
      icosphere.create();
    }
    lambert.setGeometryColor(color);
    let time = Date.now()%2000000/1000.0;
    lambert.setUnifFloat("u_Time", time);
    lambert.setUnifVec4("u_Color2", color2);
    lambert.setUnifFloat("u_highAmp", controls.highAmp);
    lambert.setUnifFloat("u_lowAmp", controls.lowAmp);

    background.setGeometryColor(color);
    background.setUnifVec4("u_Color2", color2);
    background.setUnifFloat("u_Time", time);

    let model = mat4.create();
    mat4.identity(model);

    lambert.setModelMatrix(model);


    gl.depthMask(true);
    renderer.render(camera, lambert, [
      icosphere,
    ]);

    renderer.render(camera, background, [
      square,
    ]);
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
    background.setDimensions(window.innerWidth, window.innerHeight);
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();
  background.setDimensions(window.innerWidth, window.innerHeight);

  // Start the render loop
  tick();
}

main();
