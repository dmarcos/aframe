/* global AFRAME, THREE */
AFRAME.registerComponent('page-controls', {
  init: function () {
    var self = this;
    var pageIndex = 0;
    var pages = [
      {
        page: 'page1',
        color: '#494949'
      },
      {
        page: 'page2',
        color: '#d471aa'
      },
      {
        page: 'page3',
        color: '#794782'
      },
      {
        page: 'page4',
        color: '#7d0147'
      },
      {
        page: 'page5',
        color: '#b06c85'
      }];
    this.pageEl = document.querySelector('[layer]');
    this.velocity = new THREE.Vector3();
    this.acceleration = new THREE.Vector3();
    this.friction = 2.0;
    this.onThumbstickChanged = this.onThumbstickChanged.bind(this);
    this.el.addEventListener('thumbstickmoved', this.onThumbstickChanged);
    this.el.addEventListener('bbuttondown', function () {
      self.zoomOut = true;
    });
    this.el.addEventListener('triggerdown', function () {
      var pageId;
      pageIndex = (pageIndex + 1) % (pages.length);
      pageId = pages[pageIndex].page;
      self.pageEl.setAttribute('layer', 'src', '#' + pageId);
      self.el.sceneEl.setAttribute('background', 'color', pages[pageIndex].color);
    });
    this.el.addEventListener('ybuttondown', function () {
      self.zoomOut = true;
    });
    this.el.addEventListener('bbuttonup', function () {
      self.zoomOut = false;
    });
    this.el.addEventListener('ybuttonup', function () {
      self.zoomOut = false;
    });
    this.el.addEventListener('abuttondown', function () {
      self.zoomIn = true;
    });
    this.el.addEventListener('xbuttondown', function () {
      self.zoomIn = true;
    });
    this.el.addEventListener('abuttonup', function () {
      self.zoomIn = false;
    });
    this.el.addEventListener('xbuttonup', function () {
      self.zoomIn = false;
    });
  },

  tick: function (time, delta) {
    var timeDelta = delta / 1000;
    this.updateVelocity(timeDelta);
    this.updatePosition(timeDelta);
    this.zoom(timeDelta);
  },

  updateVelocity: function (delta) {
    this.velocity.x += this.acceleration.x * delta;
    this.velocity.y += this.acceleration.y * delta;

    var scaledEasing = Math.pow(1 / this.friction, delta * 60);
    this.velocity.x = this.velocity.x * scaledEasing;
    this.velocity.y = this.velocity.y * scaledEasing;

    if (Math.abs(this.velocity.x) < 0.0001) { this.velocity.x = 0; }
    if (Math.abs(this.velocity.y) < 0.0001) { this.velocity.y = 0; }
  },

  updatePosition: function (delta) {
    this.pageEl.object3D.position.x += this.velocity.x * delta;
    this.pageEl.object3D.position.y += this.velocity.y * delta;
  },

  onThumbstickChanged: function (evt) {
    this.acceleration.x = evt.detail.x * 80;
    this.acceleration.y = -evt.detail.y * 80;
  },

  zoom: function (delta) {
    var position = this.pageEl.object3D.position;
    if (position.z < -1.0 && this.zoomIn) {
      position.z += 2.5 * delta;
    }

    if (position.z > -1.8 && this.zoomOut) {
      position.z -= 2.5 * delta;
    }
  }
});
