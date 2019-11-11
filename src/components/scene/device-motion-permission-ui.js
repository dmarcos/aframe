var registerComponent = require('../../core/component').registerComponent;
var utils = require('../../utils/');
var bind = utils.bind;

var constants = require('../../constants/');

var DEVICE_PERMISSION_FULL_CLASS = 'a-device-motion-permission-full';
var DEVICE_PERMISSION_FULL_CENTER_CLASS = 'a-device-motion-permission-full-center';
var DEVICE_PERMISSION_CONTINUE_CLASS = 'a-device-motion-permission-continue';
var DEVICE_PERMISSION_CANCEL_CLASS = 'a-device-motion-permission-cancel';
var BUILT_WITH_AFRAME_CLASS = 'a-built-with-aframe';

/**
 * UI for enabling device motion permission
 */
module.exports.Component = registerComponent('device-motion-permission-ui', {
  schema: {
    enabled: { default: true },
    deviceMotionEl: { default: '' }
  },

  init: function () {
    this.deviceMotionEl = null;
    this.onDeviceMotionClick = bind(this.onDeviceMotionClick, this);
    this.onOrientationChangeClick = bind(this.onOrientationChangeClick, this);
    this.grantedDeviceMotion = bind(this.grantedDeviceMotion, this);
    if (typeof window.orientation !== 'undefined') {
      try {
        /*eslint-disable */
        if (
          DeviceOrientationEvent &&
          typeof DeviceOrientationEvent.requestPermission === 'function'
        ) {
          DeviceOrientationEvent.requestPermission()
            .then(response => {
              if (response === 'granted') {
                this.grantedDeviceMotion();
              }
            })
            /* eslint-enable */
            .catch(err => {
              console.log(err);
              this.deviceMotionEl = createDeviceMotionPermissionWindow(
                this.onDeviceMotionClick,
                this
              );
              this.el.appendChild(this.deviceMotionEl);
            });
        } else {
          this.grantedDeviceMotion();
        }
      } catch (oops) {
        this.grantedDeviceMotion();
      }
    } else {
      this.remove();
    }
  },

  remove: function () {
    if (this.deviceMotionEl) {
      this.el.removeChild(this.deviceMotionEl);
    }
  },

  /**
   * Enable device motion permission when clicked.
   */
  onDeviceMotionClick: function () {
    try {
      /*eslint-disable */
      if (
        DeviceOrientationEvent &&
        typeof DeviceOrientationEvent.requestPermission === 'function'
      ) {
        DeviceOrientationEvent.requestPermission()
          .then(response => {
            if (response === 'granted') {
              this.grantedDeviceMotion();
            } else {
              console.log('Device Motion permission not granted.');
            }
          })
          .catch(console.error);
          /* eslint-enable */
      } else {
        this.grantedDeviceMotion();
      }
    } catch (oops) {
      console.log(
        'Your device and application combination do not support device motion events.'
      );
    }
  },

  grantedDeviceMotion: function () {
    this.remove();
    const func = this.el.getAttribute('enableFunc')
      ? this.el.getAttribute('enableFunc')
      : '';
    window.addEventListener('deviceorientation', e => {
      func();
    });
  }
});

/**
 * Create a button that when clicked will provide device motion permission.
 *
 * Structure: <div><button></div>
 *
 * @param {function} onClick - click event handler
 * @returns {Element} Wrapper <div>.
 */

function createDeviceMotionPermissionWindow (onClick, obj) {
  var wrapper, innerWrapper, aframeBuilt;
  var cancelBtn, continueBtn;

  // Create elements.
  wrapper = document.createElement('div');
  wrapper.classList.add(DEVICE_PERMISSION_FULL_CLASS);
  wrapper.setAttribute(constants.AFRAME_INJECTED, '');
  innerWrapper = document.createElement('div');
  innerWrapper.className = DEVICE_PERMISSION_FULL_CENTER_CLASS;
  innerWrapper.setAttribute(constants.AFRAME_INJECTED, '');
  cancelBtn = document.createElement('div');
  cancelBtn.className = DEVICE_PERMISSION_CANCEL_CLASS;
  cancelBtn.setAttribute(constants.AFRAME_INJECTED, '');
  continueBtn = document.createElement('div');
  continueBtn.className = DEVICE_PERMISSION_CONTINUE_CLASS;
  continueBtn.setAttribute(constants.AFRAME_INJECTED, '');
  aframeBuilt = document.createElement('div');
  aframeBuilt.className = BUILT_WITH_AFRAME_CLASS;
  aframeBuilt.setAttribute(constants.AFRAME_INJECTED, '');
  // Insert elements.
  innerWrapper.appendChild(cancelBtn);
  innerWrapper.appendChild(continueBtn);
  innerWrapper.appendChild(aframeBuilt);
  wrapper.appendChild(innerWrapper);
  continueBtn.addEventListener('click', function (evt) {
    onClick();
    obj.remove();
    evt.stopPropagation();
  });
  cancelBtn.addEventListener('click', function (evt) {
    obj.remove();
    evt.stopPropagation();
  });
  return wrapper;
}
