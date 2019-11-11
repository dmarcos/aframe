var registerComponent = require("../../core/component").registerComponent;
var utils = require("../../utils/");
var bind = utils.bind;

var constants = require("../../constants/");

var DEVICE_PERMISSION_CLASS = "a-device-motion-permission";
var DEVICE_PERMISSION_BTN_CLASS = "a-device-motion-permission-button";
var DEVICE_PERMISSION_FULL_CLASS = "a-device-motion-permission-full";
var DEVICE_PERMISSION_FULL_CENTER_CLASS = "a-device-motion-permission-full-center";
var DEVICE_PERMISSION_CANCEL_CLASS = "a-device-motion-permission-cancel";
var DEVICE_PERMISSION_CONTINUE_CLASS = "a-device-motion-permission-continue";

/**
 * UI for enabling device motion permission
 */
module.exports.Component = registerComponent("device-motion-permission-ui", {
  schema: {
    enabled: { default: true },
    deviceMotionEl: { default: "" }
  },

  init: function() {
    this.deviceMotionEl = null;
    this.onDeviceMotionClick = bind(this.onDeviceMotionClick, this);
    this.onOrientationChangeClick = bind(this.onOrientationChangeClick, this);
    this.grantedDeviceMotion = bind(this.grantedDeviceMotion, this);
    if (typeof window.orientation !== "undefined") {
      try {
        if (
          DeviceOrientationEvent &&
          typeof DeviceOrientationEvent.requestPermission === "function"
        ) {
          DeviceOrientationEvent.requestPermission()
            .then(response => {
              if (response === "granted") {
                this.grantedDeviceMotion();
              }
          }).catch(err=>{
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

  remove: function() {
    if (this.deviceMotionEl) {
      this.el.removeChild(this.deviceMotionEl);
    }
  },

  /**
   * Enable device motion permission when clicked.
   */
  onDeviceMotionClick: function() {
    try {
      if (
        DeviceOrientationEvent &&
        typeof DeviceOrientationEvent.requestPermission === "function"
      ) {
        DeviceOrientationEvent.requestPermission()
          .then(response => {
            if (response === "granted") {
              this.grantedDeviceMotion();
            } else {
              console.log("Device Motion permission not granted.");
            }
          })
          .catch(console.error);
      } else {
        this.grantedDeviceMotion(func);
      }
    } catch (oops) {
      console.log(
        "Your device and application combination do not support device motion events."
      );
    }
  },

  grantedDeviceMotion: function() {
    this.remove();
    const func = this.el.getAttribute("enableFunc")
      ? this.el.getAttribute("enableFunc")
      : "";
    window.addEventListener("deviceorientation", e => {
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
function createDeviceMotionButton(onClick) {
  var dmButton;
  var wrapper;

  // Create elements.
  wrapper = document.createElement("div");
  wrapper.classList.add(DEVICE_PERMISSION_CLASS);
  wrapper.setAttribute(constants.AFRAME_INJECTED, "");
  dmButton = document.createElement("button");
  dmButton.className = DEVICE_PERMISSION_BTN_CLASS;

  // Insert elements.
  wrapper.appendChild(dmButton);
  dmButton.addEventListener("click", function(evt) {
    onClick();
    evt.stopPropagation();
  });
  return wrapper;
}

function createDeviceMotionPermissionWindow(onClick, obj) {
  var wrapper, innerWrapper;
  var cancelBtn, continueBtn;

  // Create elements.
  wrapper = document.createElement("div");
  wrapper.classList.add(DEVICE_PERMISSION_FULL_CLASS);
  wrapper.setAttribute(constants.AFRAME_INJECTED, "");
  innerWrapper = document.createElement("div");
  innerWrapper.className = DEVICE_PERMISSION_FULL_CENTER_CLASS;
  innerWrapper.setAttribute(constants.AFRAME_INJECTED, "");
  cancelBtn = document.createElement("div");
  cancelBtn.className = DEVICE_PERMISSION_CANCEL_CLASS;
  cancelBtn.setAttribute(constants.AFRAME_INJECTED, "");
  continueBtn = document.createElement("div");
  continueBtn.className = DEVICE_PERMISSION_CONTINUE_CLASS;
  continueBtn.setAttribute(constants.AFRAME_INJECTED, "");
  // Insert elements.
  innerWrapper.appendChild(cancelBtn);
  innerWrapper.appendChild(continueBtn);
  wrapper.appendChild(innerWrapper);
  continueBtn.addEventListener("click", function(evt) {
    onClick();
    obj.remove();
    evt.stopPropagation();
  });
  cancelBtn.addEventListener("click", function(evt) {
    obj.remove();
    evt.stopPropagation();
  });
  return wrapper;
}
