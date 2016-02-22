/**
 * A 3d box shape.
 * @class Box
 * @constructor
 * @param {Object} options
 */
function Box(options) {
  options = options || {};

  /**
   * @property halfExtents
   * @type {Vec3}
   */
  this.halfExtents = new Vec3();
  if (options.halfExtents) {
    this.halfExtents.copy(options.halfExtents);
  }
}

var worldCornersTemp = [
  new Vec3(),
  new Vec3(),
  new Vec3(),
  new Vec3(),
  new Vec3(),
  new Vec3(),
  new Vec3(),
  new Vec3()
];

// This method returns two points that are opposite corners of the encompasing cube
Box.prototype.calculateWorldAABB = function(pos, quat) {
  var min = new Vec3(),
    max = new Vec3();

  var e = this.halfExtents;
  // Cube has 8 corners, let's define each one of them
  worldCornersTemp[0].set(e.x, e.y, e.z);
  worldCornersTemp[1].set(-e.x, e.y, e.z);
  worldCornersTemp[2].set(-e.x, -e.y, e.z);
  worldCornersTemp[3].set(-e.x, -e.y, -e.z);
  worldCornersTemp[4].set(e.x, -e.y, -e.z);
  worldCornersTemp[5].set(e.x, e.y, -e.z);
  worldCornersTemp[6].set(-e.x, e.y, -e.z);
  worldCornersTemp[7].set(e.x, -e.y, e.z);

  var wc = worldCornersTemp[0];
  // apply current rotation
  quat.vmult(wc, wc);
  // apply current position
  pos.vadd(wc, wc);
  max.copy(wc);
  min.copy(wc);
  for (var i = 1; i < 8; i++) {
    var wc = worldCornersTemp[i];
    quat.vmult(wc, wc);
    pos.vadd(wc, wc);
    var x = wc.x;
    var y = wc.y;
    var z = wc.z;
    if (x > max.x) {
      max.x = x;
    }
    if (y > max.y) {
      max.y = y;
    }
    if (z > max.z) {
      max.z = z;
    }

    if (x < min.x) {
      min.x = x;
    }
    if (y < min.y) {
      min.y = y;
    }
    if (z < min.z) {
      min.z = z;
    }
  }

  return new AABB({
    lowerBound: min,
    upperBound: max
  });
};
