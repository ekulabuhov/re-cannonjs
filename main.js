// global variables
var renderer;
var scene;
var camera;

var world;
var dt = 1 / 60;

var control;

var xAxis = new THREE.Vector3(1, 0, 0);
var yAxis = new THREE.Vector3(0, 1, 0);
var zAxis = new THREE.Vector3(0, 0, 1);

var omega = new THREE.Vector3(0.01, 0.01, 0.01);
var ix = 90;


// To be synced
var meshes = [];
var bbMeshes = {};

var m = 0.1, // Cube mass in kg
  rho = 1.2, // Density of air.
  // https://en.wikipedia.org/wiki/Drag_coefficient
  C_d = 1.05, // Drag for ball is 0.47. Cube is 1.05
  A = 6 / 1e4, // Surface area for cube is 6a^2
  vy = 0, // Speed of the object
  dt = 0.02, // Time step
  e = -0.5, // Coefficient of restitution ("bounciness")
  height = -4,
  ay = 0,
  r = 0.5;

initCannon();
init();

function init() {
  container = document.createElement('div');
  document.body.appendChild(container);
  // create a scene, that will hold all our elements such as objects, cameras and lights.
  scene = new THREE.Scene();

  // create a camera, which defines where we're looking at.
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

  // create a render, sets the background color and the size
  renderer = new THREE.WebGLRenderer();
  renderer.gammaInput = true;
  renderer.gammaOutput = true;

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.cullFace = THREE.CullFaceBack;
  renderer.setClearColor(0xFFF, 1.0);
  renderer.setSize(window.innerWidth, window.innerHeight);

  // create a cube and add to scene
  createBroadPhaseColisionScene();

  // position and point the camera to the center of the scene
  camera.position.x = 0;
  camera.position.y = 0;
  camera.position.z = 13;
  camera.lookAt(scene.position);

  // add the output of the renderer to the html element
  document.body.appendChild(renderer.domElement);

  // call the render function
  render();
}

var _cubeRed, boxBody;

function initCannon() {
  world = new World();
  world.broadphase = new SAPBroadphase(world);

  // Add an impulse to the center
  var f = 500,
    dt = 1 / 60,
    damping = 0.5;
  var worldPoint = new Vec3(0, 0.1, 0);
  var impulse = new Vec3(0, 0, f * dt);
  //boxBody.applyImpulse(impulse, worldPoint);
}

function createCube(position) {
  var dynamicTexture = new THREEx.DynamicTexture(512, 512)
  dynamicTexture.context.font = "bolder 90px Verdana";
  dynamicTexture.texture.anisotropy = renderer.getMaxAnisotropy()

  var cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
  var cubeMaterial = new THREE.MeshPhongMaterial({
    map: dynamicTexture.texture
  });
  cubeMaterial.color = new THREE.Color('red');
  _cubeRed = new THREE.Mesh(cubeGeometry, cubeMaterial);
  _cubeRed.castShadow = true;
  _cubeRed.receiveShadow = true;

  meshes.push(_cubeRed);
  scene.add(_cubeRed);

  // Physics setup
  boxBody = new Body({
    mass: 5,
    linearDamping: 0.5,
    angularDamping: 0,
    position: position
  });
  var shape = new Box({
    halfExtents: new Vec3(0.5, 0.5, 0.5)
  });
  boxBody.addShape(shape);
  boxBody.invInertiaWorld.copy(new Mat3([1.2, 0, 0, 0, 1.2, 0, 0, 0, 1.2]));
  world.addBody(boxBody);

  // Debug code
  dynamicTexture.clear('cyan')
    .drawText(boxBody.id, undefined, 256, 'red');
}

function createContactScene() {
  addLightAndPlaneToScene();
}

function createBroadPhaseColisionScene() {
  for (var i = 0; i <= 10; i++) {
    createCube(new Vec3(Math.random() * 5 - 2.5, Math.random() * 3 - 1, Math.random()));
  }

  addLightAndPlaneToScene();

  control = new function() {
    this.cube = _cubeRed;
    this.omega = omega;
    this.drag = 0.01;
  };
  addControls(control);

  this.objectBehaviourFunc = rotateAndSwingBehaviour;
}

function addLightAndPlaneToScene() {
  // LIGHTS

  hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
  hemiLight.color.setHSL(0.6, 1, 0.6);
  hemiLight.groundColor.setHSL(0.095, 1, 0.75);
  hemiLight.position.set(0, 500, 0);
  scene.add(hemiLight);

  //

  dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.color.setHSL(0.1, 1, 0.95);
  dirLight.position.set(-1, 1.75, 1);
  dirLight.position.multiplyScalar(50);
  scene.add(dirLight);

  dirLight.castShadow = true;

  dirLight.shadowCameraFar = 3500;
  dirLight.shadowBias = -0.0001;

  //var lightDebug = new THREE.DirectionalLightHelper(dirLight, 10000);
  //scene.add(lightDebug);
  dirLight.shadowCameraVisible = true;

  // GROUND

  var groundGeo = new THREE.PlaneBufferGeometry(30, 30);
  var groundMat = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    specular: 0x050505
  });
  groundMat.color.setHSL(0.095, 1, 0.75);

  var ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -2;
  scene.add(ground);

  ground.receiveShadow = true;
}

function addControls(controlObject) {
  var gui = new dat.GUI();
  controlObject.cube.position.set(0.01, 0.01, 0.01);
  gui.add(controlObject.cube.position, 'x', -5.0, 5.0).step(0.01).listen();
  gui.add(controlObject.cube.position, 'y', -5.0, 5.0).step(0.01).listen();
  gui.add(controlObject.cube.position, 'z', -5.0, 5.0).step(0.01).listen();
  var f2 = gui.addFolder('omega');
  f2.add(controlObject.omega, 'x', -5.0, 5.0).step(0.1).listen();
  f2.add(controlObject.omega, 'y', -5.0, 5.0).step(0.1).listen();
  f2.add(controlObject.omega, 'z', -5.0, 5.0).step(0.1).listen();
  f2.open();
  controlObject.omega.set(0, 0, 0);

  gui.add(controlObject, 'drag', -5.0, 5.0).step(0.01).listen();
  //gui.add(controlObject.quaternion, 'x', -1.0, 1.0).step(0.01).listen();
}

var vel;

function render() {
  renderer.render(scene, camera);

  this.objectBehaviourFunc();

  updatePhysics();

  requestAnimationFrame(render);
}

function rotateAndSwingBehaviour() {
  ix++;

  for (var i = 0; i < world.bodies.length; i++) {
    if (i % 2) {
      vel = Math.sin((ix - (i + 10) * 10) / 180 * Math.PI) * 2;
      world.bodies[i].angularVelocity.x = world.bodies[i].velocity.x = vel;
    } else {
      vel = Math.cos((ix + (i + 10) * 10) / 180 * Math.PI) * 2;
      world.bodies[i].angularVelocity.z = world.bodies[i].velocity.z = vel;
    }
  }
}

function updatePhysics() {
  world.step(dt);
  for (var i = 0; i !== meshes.length; i++) {
    var body = world.bodies[i];
    meshes[i].position.copy(body.position);
    meshes[i].quaternion.copy(body.quaternion);

    /* PHYSICS DEBUG START */
    var bbMesh = bbMeshes[meshes[i].uuid];

    body.computeAABB();

    if (bbMesh === undefined) {
      var bboxGeometry = new THREE.BoxGeometry(1, 1, 1);
      var bboxMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        wireframe: true
      });
      bbMesh = bbMeshes[meshes[i].uuid] = new THREE.Mesh(bboxGeometry, bboxMaterial);
      scene.add(bbMesh);
    }

    var aabb = body.aabb;

    bbMesh.scale.set(aabb.lowerBound.x - aabb.upperBound.x,
      aabb.lowerBound.y - aabb.upperBound.y,
      aabb.lowerBound.z - aabb.upperBound.z);

    bbMesh.position.set((aabb.lowerBound.x + aabb.upperBound.x) * 0.5,
      (aabb.lowerBound.y + aabb.upperBound.y) * 0.5,
      (aabb.lowerBound.z + aabb.upperBound.z) * 0.5);

    var collidingIds = [].concat.apply([], world.collidingPairs.sap).map(function(x) {
      return x.body.id
    });
    bbMesh.material.color = (collidingIds.indexOf(body.id) !== -1) ? new THREE.Color(0xff0000) : new THREE.Color(0x000000);
    /* PHYSICS DEBUG END */
  }
}

function physicsSimulation() {
  debugger;
  var fy = 0;

  /* Gravity of Earth */
  //fy += m * 9.81;

  /* Air resistance force; this would affect both x- and y-directions, but we're only looking at the y-axis in this example. */
  // https://en.wikipedia.org/wiki/Drag_(physics)
  var drag = -0.5 * rho * C_d * A * vy * vy;
  control.drag = drag;
  fy += drag;

  /* Verlet integration for the y-direction */
  dy = vy * dt + (0.5 * ay * dt * dt);

  /* The following line is because the math assumes meters but we're assuming 1 cm per pixel, so we need to scale the results */
  _cubeRed.position.y -= dy; //* 100;
  new_ay = fy / m;
  avg_ay = 0.5 * (new_ay + ay);
  vy += avg_ay * dt;

  /* Let's do very simple collision detection */
  if (_cubeRed.position.y + r < height && vy > 0) {
    /* This is a simplification of impulse-momentum collision response. e should be a negative number, which will change the velocity's direction. */
    vy *= e;
    /* Move the ball back a little bit so it's not still "stuck" in the wall. */
    _cubeRed.position.y = height - r;
  }

  _cubeRed.position.y -= fy / 100;

  // rotation 
  var xVelocity = new THREE.Quaternion().setFromAxisAngle(xAxis, omega.x / 180 * Math.PI);
  var yVelocity = new THREE.Quaternion().setFromAxisAngle(yAxis, omega.y / 180 * Math.PI);
  var zVelocity = new THREE.Quaternion().setFromAxisAngle(zAxis, omega.z / 180 * Math.PI);
  _cubeRed.quaternion.multiply(xVelocity);
  _cubeRed.quaternion.multiply(yVelocity);
  _cubeRed.quaternion.multiply(zVelocity);
}
