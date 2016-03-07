// global variables
var renderer;
var scene;
var camera;

var world;
var dt = 1 / 60;
var ix = 90;


// To be synced
var meshes = [],
  bbMeshes = {},
  showBBMeshes = true,
  contactMeshes = [],
  showBoundingSpheres = true;

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
  //createContactScene();

  // position and point the camera to the center of the scene
  camera.position.x = 0;
  camera.position.y = 0;
  camera.position.z = 13;
  camera.lookAt(scene.position);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  //controls.addEventListener( 'change', render ); // add this only if there is no animation loop (requestAnimationFrame)
  controls.enableDamping = true;
  controls.dampingFactor = 0.25;
  controls.enableZoom = false;

  // add the output of the renderer to the html element
  document.body.appendChild(renderer.domElement);

  // call the render function
  render();
}

function initCannon() {
  world = new World();
  world.broadphase = new SAPBroadphase(world);

  // Add an impulse to the center
  var f = 500,
    dt = 1 / 60,
    damping = 0.5;
  var worldPoint = new Vec3(0, 0.1, 0);
  var impulse = new Vec3(0, 0, f * dt);
}

/**
 * @param {Vec3} position
 */
function createCube(position) {
  var dynamicTexture = new THREEx.DynamicTexture(512, 512)
  dynamicTexture.context.font = "bolder 90px Verdana";
  dynamicTexture.texture.anisotropy = renderer.getMaxAnisotropy()

  var cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
  var cubeMaterial = new THREE.MeshPhongMaterial({
    map: dynamicTexture.texture
  });
  cubeMaterial.color = new THREE.Color('red');
  var cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
  cubeMesh.castShadow = true;
  cubeMesh.receiveShadow = true;

  meshes.push(cubeMesh);
  scene.add(cubeMesh);

  // Physics setup
  boxBody = new Body({
    mass: 5,
    linearDamping: 0.5,
    angularDamping: 0.5,
    position: position,
    mesh: cubeMesh
  });
  var shape = new Box({
    halfExtents: new Vec3(0.5, 0.5, 0.5)
  });
  boxBody.addShape(shape);
  boxBody.invInertiaWorld.copy(new Mat3([1.2, 0, 0, 0, 1.2, 0, 0, 0, 1.2]));
  world.addBody(boxBody);

  // Draw id of the cube on its body
  dynamicTexture.clear('cyan')
    .drawText(boxBody.id, undefined, 256, 'red');
}

function createContactScene() {
  addLightAndPlaneToScene();
  createCube(new Vec3(-1, 0, 5));
  createCube(new Vec3(1, 0, 5));
}

function createBroadPhaseColisionScene() {
  for (var i = 0; i <= 10; i++) {
    createCube(new Vec3(Math.random() * 5 - 2.5, Math.random() * 3 - 1, Math.random()));
  }

  addControls();
  addLightAndPlaneToScene();

  this.objectBehaviourFunc = rotateAndSwingBehaviour;
  world.gravity = new Vec3(0, 0, 0);
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

function addControls() {
  var gui = new dat.GUI();
  gui.add(world.bodies[0].mesh.position, 'x', -5.0, 5.0).step(0.01).listen();
  gui.add(world.bodies[0].mesh.position, 'y', -5.0, 5.0).step(0.01).listen();
  gui.add(world.bodies[0].mesh.position, 'z', -5.0, 5.0).step(0.01).listen();
  gui.add(this, 'showBBMeshes');
  gui.add(this, 'showBoundingSpheres');
}

function render() {
  renderer.render(scene, camera);

  if (this.objectBehaviourFunc) {
    this.objectBehaviourFunc();
  }

  updatePhysics();

  requestAnimationFrame(render);
}

function rotateAndSwingBehaviour() {
  var vel;
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

    /* PHYSICS DEBUG AABB START */
    if (showBBMeshes) {
      drawBBMeshes(i, body);
    } else {
      bbMeshes[meshes[i].uuid].position.x = 200;
    }
    /* PHYSICS DEBUG AABB END */

    /* PHYSICS DEBUG CONTACTS START */
    contactMeshes.forEach(mesh => {
      mesh.position.x = 20;
    });

    for (var k = 0; k < world.contacts.length; k++) {
      if (contactMeshes.length === 0) {
        var geometry = new THREE.SphereGeometry(0.1, 8, 6);
        var material = new THREE.MeshBasicMaterial({
          color: 0xffff00
        });
        for (var j = 0; j < 16; j++) {
          contactMeshes[j] = new THREE.Mesh(geometry, material);
          // put them of screen
          contactMeshes[j].position.x = 20;
          scene.add(contactMeshes[j]);
        };
      }

      contactMeshes[k].position.copy(world.contacts[k].point);
    };
    /* PHYSICS DEBUG CONTACTS END */

    /* PHYSICS DEBUG BOUNDING SPHERE START */
    if (!body.boundingSphere) {
      var geometry = new THREE.SphereGeometry(body.mesh.geometry.boundingSphere.radius, 8, 8);
      var material = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        wireframe: true
      });
      var sphere = new THREE.Mesh(geometry, material);
      body.boundingSphere = sphere;
      body.mesh.add(sphere);
    }

    body.boundingSphere.visible = showBoundingSpheres;

    var boundingSphereCollides = world.bodies.some(function(otherBody) {
      if (otherBody.boundingSphere && otherBody.id !== body.id) {
        var distance = otherBody.mesh.position.distanceTo(body.mesh.position);
        var radiusSum = otherBody.mesh.geometry.boundingSphere.radius + body.mesh.geometry.boundingSphere.radius;
        return (distance < radiusSum);
      }
    });

    body.boundingSphere.material.color = boundingSphereCollides ? new THREE.Color(0xff0000) : new THREE.Color(0x00ff00);
    /* PHYSICS DEBUG BOUNDING SPHERE END */
  }
}

function drawBBMeshes(i, body) {
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
  bbMesh.material.color = (collidingIds.indexOf(body.id) !== -1) ? new THREE.Color(0xff0000) : new THREE.Color(0x00ff00);
}
