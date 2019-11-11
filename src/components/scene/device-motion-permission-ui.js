/* global DeviceOrientationEvent */
var registerComponent = require('../../core/component').registerComponent;
var utils = require('../../utils/');
var bind = utils.bind;

var constants = require('../../constants/');

var DEVICE_PERMISSION_FULL_CLASS = 'a-device-motion-permission-full';
var DEVICE_PERMISSION_FULL_CENTER_CLASS = 'a-device-motion-permission-full-center';
var DEVICE_PERMISSION_CANCEL_CLASS = 'a-device-motion-permission-cancel';
var DEVICE_PERMISSION_CONTINUE_CLASS = 'a-device-motion-permission-continue';

/**
 * UI for enabling device motion permission
 */
module.exports.Component = registerComponent('device-motion-permission-ui', {
  schema: {
    enabled: {default: true},
    deviceMotionEl: {default: ''}
  },

  init: function () {
    this.deviceMotionEl = null;
    this.onDeviceMotionClick = bind(this.onDeviceMotionClick, this);
    this.onOrientationChangeClick = bind(this.onOrientationChangeClick, this);
    this.grantedDeviceMotion = bind(this.grantedDeviceMotion, this);
    if (DeviceOrientationEvent && DeviceOrientationEvent.requestPermission) {
      this.deviceMotionEl = createDeviceMotionPermissionDialog(this.onDeviceMotionClick, this);
      this.el.appendChild(this.deviceMotionEl);
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
    DeviceOrientationEvent.requestPermission().then(response => {
      if (response === 'granted') {
        this.grantedDeviceMotion();
      } else {
        console.log('Device Motion permission not granted.');
      }
    }).catch(console.error);
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
 * Create a modal dialog to accept or decline acccess to DeviceMotionEvents
 *
 * @param {function} onAcceptClicked - accept button click event handler
 * @returns {Element} Wrapper <div>.
 */
function createDeviceMotionPermissionDialog (onAcceptClicked, component) {
  var acceptButton;
  var cancelButton;
  var innerWrapper;
  var wrapper;

  // Create elements.
  wrapper = document.createElement('div');
  wrapper.classList.add(DEVICE_PERMISSION_FULL_CLASS);
  wrapper.setAttribute(constants.AFRAME_INJECTED, '');
  innerWrapper = document.createElement('div');
  innerWrapper.className = DEVICE_PERMISSION_FULL_CENTER_CLASS;
  innerWrapper.setAttribute(constants.AFRAME_INJECTED, '');
  cancelButton = document.createElement('div');
  cancelButton.className = DEVICE_PERMISSION_CANCEL_CLASS;
  cancelButton.setAttribute(constants.AFRAME_INJECTED, '');
  acceptButton = document.createElement('div');
  acceptButton.className = DEVICE_PERMISSION_CONTINUE_CLASS;
  acceptButton.setAttribute(constants.AFRAME_INJECTED, '');
  // Insert elements.
  innerWrapper.appendChild(cancelButton);
  innerWrapper.appendChild(acceptButton);
  wrapper.appendChild(innerWrapper);
  acceptButton.addEventListener('click', function (evt) {
    onAcceptClicked();
    component.remove();
    evt.stopPropagation();
  });
  cancelButton.addEventListener('click', function (evt) {
    component.remove();
    evt.stopPropagation();
  });
  return wrapper;
}
