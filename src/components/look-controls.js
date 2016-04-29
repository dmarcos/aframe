var registerComponent = require('../core/component').registerComponent;
var THREE = require('../lib/three');
var isMobile = require('../utils/').isMobile();

// To avoid recalculation at every mouse movement tick
var PI_2 = Math.PI / 2;
var radToDeg = THREE.Math.radToDeg;

module.exports.Component = registerComponent('look-controls', {
  dependencies: ['position', 'rotation'],

  schema: {
    enabled: { default: true },
    hmdEnabled: { default: true },
    standing: { default: true }
  },

  init: function () {
    this.previousHMDPosition = new THREE.Vector3();
    this.setupMouseControls();
    this.setupHMDControls();
    this.bindMethods();
  },

  update: function (oldData) {
    var data = this.data;
    var hmdEnabled = data.hmdEnabled;
    if (!data.enabled) { return; }
    if (!hmdEnabled && oldData && hmdEnabled !== oldData.hmdEnabled) {
      this.pitchObject.rotation.set(0, 0, 0);
      this.yawObject.rotation.set(0, 0, 0);
    }
    this.controls.standing = data.standing;
    this.controls.update();
    this.updateOrientation();
    this.updatePosition();
  },

  play: function () {
    this.addEventListeners();
  },

  pause: function () {
    this.removeEventListeners();
  },

  tick: function (t) {
    this.update();
  },

  remove: function () {
    this.pause();
  },

  bindMethods: function () {
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.releaseMouse = this.releaseMouse.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
  },

  setupMouseControls: function () {
    // The canvas where the scene is painted
    this.mouseDown = false;
    this.pitchObject = new THREE.Object3D();
    this.yawObject = new THREE.Object3D();
    this.yawObject.position.y = 10;
    this.yawObject.add(this.pitchObject);
  },

  setupHMDControls: function () {
    this.dolly = new THREE.Object3D();
    this.euler = new THREE.Euler();
    this.controls = new THREE.VRControls(this.dolly);
  },

  addEventListeners: function () {
    var sceneEl = this.el.sceneEl;
    var canvasEl = sceneEl.canvas;

    // listen for canvas to load.
    if (!canvasEl) {
      sceneEl.addEventListener('render-target-loaded', this.addEventListeners.bind(this));
      return;
    }

    // Mouse Events
    canvasEl.addEventListener('mousedown', this.onMouseDown, false);
    canvasEl.addEventListener('mousemove', this.onMouseMove, false);
    canvasEl.addEventListener('mouseup', this.releaseMouse, false);
    canvasEl.addEventListener('mouseout', this.releaseMouse, false);

    // Touch events
    canvasEl.addEventListener('touchstart', this.onTouchStart);
    canvasEl.addEventListener('touchmove', this.onTouchMove);
    canvasEl.addEventListener('touchend', this.onTouchEnd);
  },

  removeEventListeners: function () {
    var sceneEl = document.querySelector('a-scene');
    var canvasEl = sceneEl && sceneEl.canvas;
    if (!canvasEl) { return; }

    // Mouse Events
    canvasEl.removeEventListener('mousedown', this.onMouseDown);
    canvasEl.removeEventListener('mousemove', this.onMouseMove);
    canvasEl.removeEventListener('mouseup', this.releaseMouse);
    canvasEl.removeEventListener('mouseout', this.releaseMouse);

    // Touch events
    canvasEl.removeEventListener('touchstart', this.onTouchStart);
    canvasEl.removeEventListener('touchmove', this.onTouchMove);
    canvasEl.removeEventListener('touchend', this.onTouchEnd);
  },

  updateOrientation: (function () {
    var hmdEuler = new THREE.Euler();
    return function () {
      var pitchObject = this.pitchObject;
      var yawObject = this.yawObject;
      var hmdQuaternion = this.calculateHMDQuaternion();
      var sceneEl = this.el.sceneEl;
      var rotation;
      hmdEuler.setFromQuaternion(hmdQuaternion, 'YXZ');
      if (!sceneEl.is('vr-mode') || isNullVector(hmdEuler) || !this.data.hmdEnabled) {
        // Mouse look only if HMD disabled or no info coming from the sensors
        rotation = {
          x: radToDeg(pitchObject.rotation.x),
          y: radToDeg(yawObject.rotation.y),
          z: 0
        };
      } else {
        if (isMobile) {
          // In mobile we allow camera rotation with touch events and sensors
          rotation = {
            x: radToDeg(hmdEuler.x) + radToDeg(pitchObject.rotation.x),
            y: radToDeg(hmdEuler.y) + radToDeg(yawObject.rotation.y),
            z: radToDeg(hmdEuler.z)
          };
        } else {
          // Mouse rotation ignored with an active headset.
          // The user head rotation takes priority
          rotation = {
            x: radToDeg(hmdEuler.x),
            y: radToDeg(hmdEuler.y),
            z: radToDeg(hmdEuler.z)
          };
        }
      }
      this.el.setAttribute('rotation', rotation);
    };
  })(),

  calculateHMDQuaternion: (function () {
    var hmdQuaternion = new THREE.Quaternion();
    return function () {
      hmdQuaternion.copy(this.dolly.quaternion);
      return hmdQuaternion;
    };
  })(),

  updatePosition: (function () {
    var deltaHMDPosition = new THREE.Vector3();
    return function () {
      var el = this.el;
      var currentPosition = el.getComputedAttribute('position');
      var currentHMDPosition;
      var previousHMDPosition = this.previousHMDPosition;
      var sceneEl = this.el.sceneEl;
      currentHMDPosition = this.calculateHMDPosition();
      deltaHMDPosition.copy(currentHMDPosition).sub(previousHMDPosition);
      if (!sceneEl.is('vr-mode') || isNullVector(deltaHMDPosition)) { return; }
      previousHMDPosition.copy(currentHMDPosition);
      // Do nothing if we have not moved.
      if (!sceneEl.is('vr-mode')) { return; }
      el.setAttribute('position', {
        x: currentPosition.x + deltaHMDPosition.x,
        y: currentPosition.y + deltaHMDPosition.y,
        z: currentPosition.z + deltaHMDPosition.z
      });
    };
  })(),

  calculateHMDPosition: function () {
    var dolly = this.dolly;
    var position = new THREE.Vector3();
    dolly.updateMatrix();
    position.setFromMatrixPosition(dolly.matrix);
    return position;
  },

  onMouseMove: function (event) {
    var pitchObject = this.pitchObject;
    var yawObject = this.yawObject;
    var previousMouseEvent = this.previousMouseEvent;

    if (!this.mouseDown || !this.data.enabled) { return; }

    var movementX = event.movementX || event.mozMovementX;
    var movementY = event.movementY || event.mozMovementY;

    if (movementX === undefined || movementY === undefined) {
      movementX = event.screenX - previousMouseEvent.screenX;
      movementY = event.screenY - previousMouseEvent.screenY;
    }
    this.previousMouseEvent = event;

    yawObject.rotation.y -= movementX * 0.002;
    pitchObject.rotation.x -= movementY * 0.002;
    pitchObject.rotation.x = Math.max(-PI_2, Math.min(PI_2, pitchObject.rotation.x));
  },

  onMouseDown: function (event) {
    this.mouseDown = true;
    this.previousMouseEvent = event;
  },

  releaseMouse: function () {
    this.mouseDown = false;
  },

  onTouchStart: function (e) {
    if (e.touches.length !== 1) { return; }
    this.touchStart = {
      x: e.touches[0].pageX,
      y: e.touches[0].pageY
    };
    this.touchStarted = true;
  },

  onTouchMove: function (e) {
    var deltaY;
    var yawObject = this.yawObject;
    if (!this.touchStarted) { return; }
    deltaY = 2 * Math.PI * (e.touches[0].pageX - this.touchStart.x) /
            this.el.sceneEl.canvas.clientWidth;
    // Limits touch orientaion to to yaw (y axis)
    yawObject.rotation.y -= deltaY * 0.5;
    this.touchStart = {
      x: e.touches[0].pageX,
      y: e.touches[0].pageY
    };
  },

  onTouchEnd: function () {
    this.touchStarted = false;
  }
});

function isNullVector (vector) {
  return vector.x === 0 && vector.y === 0 && vector.z === 0;
}
