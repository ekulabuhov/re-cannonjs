function Narrowphase() {

}

var planePoint = new THREE.Vector3(0, -2, 0);
var planeNormal = new THREE.Vector3(0, 1, 0);

/**
 * @param {array} pairs Array of tuples
 */
Narrowphase.prototype.getContacts = function(pairs, bodies) {
  var results = [];

  // Check each vertex against ground
  for (var i = 0; i < bodies.length; i++) {
    var vertices = bodies[i].mesh.geometry.vertices;
    for (var j = 0; j < vertices.length; j++) {
      var mesh = bodies[i].mesh;
      var translated = mesh.localToWorld(vertices[j].clone());
      var distance = translated.clone().sub(planePoint).dot(planeNormal);

      if (distance <= 0) {
        results.push({
          body: bodies[i],
          point: translated
        });
      }
    };
  };

  return results;

  // for (var i = 0; i !== pairs.length; i++) {
  //   // Get current collision bodies
  //   var bi = pairs[i][0],
  //     bj = pairs[i][1];


  // }
}

Narrowphase.prototype.boxBox = function(si, sj, xi, xj, qi, qj, bi, bj) {
  this.convexConvex(si, sj, xi, xj, qi, qj, bi, bj);
}

Narrowphase.prototype.convexConvex = function(si, sj, xi, xj, qi, qj, bi, bj) {

}
