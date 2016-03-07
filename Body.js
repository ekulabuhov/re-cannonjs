// var Vec3 = require('../math/Vec3');

// Static
Body.idCounter = 0;

function Body(options) {
  this.id = Body.idCounter++;

  var mass = typeof(options.mass) === 'number' ? options.mass : 0;

  /**
   * @property mass
   * @type {Number}
   * @default 0
   */
  this.mass = mass;

  /**
   * Damping is specified as a value between 0 and 1, which is the proportion of velocity lost per second.
   * @property linearDamping
   * @type {Number}
   */
  this.linearDamping = typeof(options.linearDamping) === 'number' ? options.linearDamping : 0.01;

  /**
   * Damping is specified as a value between 0 and 1, which is the proportion of velocity lost per second.
   * @property {Number} angularDamping
   */
  this.angularDamping = typeof(options.angularDamping) !== 'undefined' ? options.angularDamping : 0.01;

  /**
   * Linear force on the body
   * @property force
   * @type {Vec3}
   */
  this.force = new Vec3();

  /**
   * Rotational force on the body, around center of mass
   * @property {Vec3} torque
   */
  this.torque = new Vec3();

  /**
   * Orientation of the body
   * @property quaternion
   * @type {Quaternion}
   */
  this.quaternion = new Quaternion();

  /**
   * @property angularVelocity
   * @type {Vec3}
   */
  this.angularVelocity = new Vec3();

  /**
   * Orientation of the body
   * @property quaternion
   * @type {Quaternion}
   */
  this.quaternion = new Quaternion();

  /**
   * @property position
   * @type {Vec3}
   */
  this.position = new Vec3();

  if (options.position) {
    this.position.copy(options.position);
  }

  /**
   * @property mesh
   * @type {THREE.Mesh}
   */
  this.mesh = new THREE.Mesh();

  if (options.mesh) {
    this.mesh = options.mesh;
  }

  /**
   * @property {Mat3} invInertiaWorld
   */
  this.invInertiaWorld = new Mat3();

  /**
   * @property velocity
   * @type {Vec3}
   */
  this.velocity = new Vec3();

  if (options.velocity) {
    this.velocity.copy(options.velocity);
  }

  /**
   * @property invMass
   * @type {Number}
   */
  this.invMass = mass > 0 ? 1.0 / mass : 0;

  /**
   * @property shapes
   * @type {array}
   */
  this.shapes = [];

  /**
   * @property aabb
   * @type {AABB}
   */
  this.aabb = new AABB();
}


/**
 * Apply impulse to a world point. This could for example be a point on the Body surface. An impulse is a force added to a body during a short period of time (impulse = force * time). Impulses will be added to Body.velocity and Body.angularVelocity.
 * @method applyImpulse
 * @param  {Vec3} impulse The amount of impulse to add.
 * @param  {Vec3} worldPoint A world point to apply the force on.
 */
Body.prototype.applyImpulse = function(impulse, worldPoint) {
  // Compute point position relative to the body center
  var r = worldPoint.vsub(this.position);

  // Compute produced central impulse velocity
  var velo = impulse.mult(this.invMass);

  // Add linear impulse
  this.velocity.vadd(velo, this.velocity);

  // Compute produced rotational impulse velocity
  var rotVelo = r.cross(impulse, rotVelo);

  // Add Moment of Inertia - resistance of the body to rotation
  rotVelo = this.invInertiaWorld.vmult(rotVelo);

  // Add rotational Impulse
  this.angularVelocity = this.angularVelocity.vadd(rotVelo);
};

/**
 * Add a shape to the body.
 * @method addShape
 * @param {Shape} shape
 * @return {Body} The body object, for chainability.
 */
Body.prototype.addShape = function(shape) {
  this.shapes.push(shape);

  return this;
};

/**
 * Updates the .aabb
 * @method computeAABB
 * @todo rename to updateAABB()
 */
Body.prototype.computeAABB = function() {
  for (var i = 0; i !== this.shapes.length; i++) {
    var shape = this.shapes[i];

    // Get shape AABB
    this.aabb = shape.calculateWorldAABB(this.position, this.quaternion);
  }
};
