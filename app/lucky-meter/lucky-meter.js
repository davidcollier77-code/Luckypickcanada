/* ============================================
   LUCKY METER — INTERACTIVE JS LOGIC
   ============================================ */

const LuckyMeter = {
  percent: 0,
  interval: null,

  init() {
    this.percentEl = document.getElementById("lm-percent-value");
    this.greenLight = document.querySelector(".lm-light-green");
    this.yellowLight = document.querySelector(".lm-light-yellow");
    this.redLight = document.querySelector(".lm-light-red");

    this.startReveal();
  },

  /* --------------------------------------------
     Start the percentage reveal animation
     -------------------------------------------- */
  startReveal() {
    let target = this.generateRandomPercent();
    let speed = this.getSpeedForTarget(target);

    this.interval = setInterval(() => {
      if (this.percent >= target) {
        clearInterval(this.interval);
        this.updateLights(target);
        return;
      }

      this.percent++;
      this.updatePercentDisplay();
    }, speed);
  },

  /* --------------------------------------------
     Generate a random percent (0–100)
     -------------------------------------------- */
  generateRandomPercent() {
    return Math.floor(Math.random() * 101);
  },

  /* --------------------------------------------
     Speed curve — slower near high values
     -------------------------------------------- */
  getSpeedForTarget(target) {
    if (target < 30) return 20;
    if (target < 60) return 35;
    if (target < 85) return 50;
    return 70;
  },

  /* --------------------------------------------
     Update the percentage text
     -------------------------------------------- */
  updatePercentDisplay() {
    this.percentEl.textContent = `${this.percent}%`;
  },

  /* --------------------------------------------
     Update indicator lights based on final percent
     -------------------------------------------- */
  updateLights(finalPercent) {
    if (finalPercent >= 70) {
      this.activateLight(this.greenLight);
    } else if (finalPercent >= 40) {
      this.activateLight(this.yellowLight);
    } else {
      this.activateLight(this.redLight);
    }
  },

  activateLight(light) {
    light.classList.add("active");
  }
};

/* --------------------------------------------
   Initialize Lucky Meter when DOM is ready
   -------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  LuckyMeter.init();
});
