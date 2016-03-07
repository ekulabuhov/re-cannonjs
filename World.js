function World() {
  this.bodies = [];

  /**
   * Set to true to use fast quaternion normalization. It is often enough accurate to use. If bodies tend to explode, set to false.
   * @property quatNormalizeFast
   * @type {Boolean}
   * @see Quaternion.normalizeFast
   * @see Quaternion.normalize
   */
  this.quatNormalizeFast = false;

  /**
   * Number of timesteps taken since start
   * @property stepnumber
   * @type {Number}
   */
  this.stepnumber = 0;

  /**
   * @property broadphase
   * @type {Broadphase}
   */
  this.broadphase = new SAPBroadphase(this);

  /**
   * @property narrowphase
   * @type {Narrowphase}
   */
  this.narrowphase = new Narrowphase();

  /**
   * @property gravity
   * @type {Vec3}
   */
  this.gravity = new Vec3(0, -0.0098, 0);
}

World.prototype.step = function(dt) {
  this.internalStep(dt);
}

World.prototype.internalStep = function(dt) {
  var half_dt = dt * 0.5;

  // Add gravity to all objects
  for (i = 0; i !== this.bodies.length; i++) {
    var body = this.bodies[i];

    body.force.x += body.mass * this.gravity.x;
    body.force.y += body.mass * this.gravity.y;
    body.force.z += body.mass * this.gravity.z;
  }

  // Apply damping, see http://code.google.com/p/bullet/issues/detail?id=74 for details
  for (i = 0; i !== this.bodies.length; i++) {
    var body = this.bodies[i];

    var linearDamping = Math.pow(1.0 - body.linearDamping, dt);
    body.velocity = body.velocity.mult(linearDamping);
    if (body.angularVelocity) {
      var angularDamping = Math.pow(1.0 - body.angularDamping, dt);
      body.angularVelocity = body.angularVelocity.mult(angularDamping);
    }
  }

  // Apply linear and angular velocity
  for (i = 0; i !== this.bodies.length; i++) {
    var body = this.bodies[i];

    body.velocity.x += body.force.x * body.invMass * dt;
    body.velocity.y += body.force.y * body.invMass * dt;
    body.velocity.z += body.force.z * body.invMass * dt;

    if (body.angularVelocity) {
      /* World_step_step_w, World_step_step_wq - integration I guess? */
      var w = new Quaternion(body.angularVelocity.x, body.angularVelocity.y, body.angularVelocity.z, 0);
      var wq = w.mult(body.quaternion);
      body.quaternion.x += half_dt * wq.x;
      body.quaternion.y += half_dt * wq.y;
      body.quaternion.z += half_dt * wq.z;
      body.quaternion.w += half_dt * wq.w;
      body.quaternion.normalize();
    }
  }

  this.collidingPairs = this.broadphase.getCollisionPairs();

  this.contacts = this.narrowphase.getContacts(this.collidingPairs, this.bodies);

  for (var i = 0; i < this.contacts.length; i++) {
    var contact = this.contacts[i];
    contact.body.applyImpulse(new Vec3(0, -contact.body.velocity.y*8, 0), new Vec3().copy(contact.body.position));
  };

  for (i = 0; i !== this.bodies.length; i++) {
    var body = this.bodies[i];
    // Use new velocity  - leap frog
    body.position.x += body.velocity.x * dt;
    body.position.y += body.velocity.y * dt;
    body.position.z += body.velocity.z * dt;
  }
}

/**
 * Add a rigid body to the simulation.
 * @method addBody
 * @param {Body} body
 * @todo If the simulation has not yet started, why recrete and copy arrays for each body? Accumulate in dynamic arrays in this case.
 * @todo Adding an array of bodies should be possible. This would save some loops too
 */
World.prototype.addBody = function(body) {
  this.bodies.push(body);
};
