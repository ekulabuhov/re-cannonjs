/**
 * Sweep and prune broadphase along one axis.
 *
 * @class SAPBroadphase
 * @constructor
 * @param {World} [world]
 */
function SAPBroadphase(world) {
  /**
   * List of bodies currently in the broadphase.
   * @property axisList
   * @type {Object}
   */
  this.axisList = {};

  /**
   * The world to search in.
   * @property world
   * @type {World}
   */
  this.world = world;

  /**
   * Axis to sort the bodies along. Set to 0 for x axis, 1 for y axis, and 2 for z axis. 
   * For best performance, choose an axis that the bodies are spread out more on.
   * @property axisIndex
   * @type {Number}
   */
  this.axisIndex = 0;

  this.axes = ['x', 'y', 'z'];
}

/**
 * Get the colliding pairs
 * @method getCollisionPairs
 * @param  {World} world
 * @return {Array}
 */
SAPBroadphase.prototype.getCollisionPairs = function() {
  var result = [],
    bodies = this.world.bodies,
    potentials = {
      x: [],
      y: [],
      z: []
    },
    overlaps = {
      x: [],
      y: [],
      z: []
    };

  for (var i = 0; i < bodies.length; i++) {
    bodies[i].computeAABB();
  }

  this.sortList('x');
  this.sortList('y');
  this.sortList('z');

  for (var axisNum = 0; axisNum < 3; axisNum++) {
    var axisName = this.axes[axisNum];
    var axis = this.axisList[axisName]
    axis.forEach(function(val) {
      // Each time a startpoint is reached insert into active list
      if (val.lb !== undefined) {
        potentials[axisName].push(val);
      } else {
        // If endpoint is hit remove it from active list
        potentials[axisName] = potentials[axisName].filter(function(v) {
          return v.body !== val.body;
        })
      }

      if (potentials[axisName].length > 1 && val.lb) {
        // go through every item in potentials list and them as colliding
        for (var m = 0; m < potentials[axisName].length - 1; m++) {
          overlaps[axisName].push([potentials[axisName][m], val]);
        }
      }
    })
  }

  overlaps.sap = overlaps.x.filter(function(pair) {
    var pairId = [pair[0].body.id, pair[1].body.id].sort().join(';');
    var yMatch = overlaps.y.find(function(yPair) {
      return [yPair[0].body.id, yPair[1].body.id].sort().join(';') === pairId;
    });
    var zMatch = overlaps.z.find(function(zPair) {
      return [zPair[0].body.id, zPair[1].body.id].sort().join(';') === pairId;
    });
    return yMatch && zMatch;
  })

  return overlaps;
}

SAPBroadphase.prototype.sortList = function(axis) {
  var world = this.world;

  // First we need to create sorted list of start and end points

  // Grab all the start points
  var lbounds = world.bodies.map(function(b) {
    return {
      'body': b,
      'lb': b.aabb.lowerBound[axis]
    }
  });

  // Grab all the end points
  var ubounds = world.bodies.map(function(b) {
    return {
      'body': b,
      'ub': b.aabb.upperBound[axis]
    }
  });

  // Concat them together
  var all = lbounds.concat(ubounds);

  // Sort em
  this.axisList[axis] = all.sort(function(a, b) {
    // if lb exists use it, otherwise use ub
    var aCmp = a.lb || a.ub,
      bCmp = b.lb || b.ub;
    return aCmp - bCmp;
  });
};
