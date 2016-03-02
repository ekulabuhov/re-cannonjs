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
}

World.prototype.step = function(dt) {
  this.internalStep(dt);
}

World.prototype.internalStep = function(dt) {
  var half_dt = dt * 0.5;

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

    // Use new velocity  - leap frog
    body.position.x += body.velocity.x * dt;
    body.position.y += body.velocity.y * dt;
    body.position.z += body.velocity.z * dt;

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
