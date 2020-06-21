window.timers = new Timers(settings = {
  ui: true,
  inject: "justacenteredwrapper"
});

const timerInput = document.getElementById("timeinput");
const addCntBtn = document.getElementById("addCnt");
const rmCntBtn = document.getElementById("rmCnt");

const startBtn = document.getElementById("start");
const pauseBtn = document.getElementById("pause");
const stopBtn = document.getElementById("stop");
const resetBtn = document.getElementById("reset");

const addExtraTimeBtn = document.getElementById("addExtraTime");


addCntBtn.addEventListener("click", (e) => {
  new Timer(timerInput.value, options = {
    type: "bar",
    parent: window.timers,
    ui: true,
  });
});

rmCntBtn.addEventListener("click", (e) => {
  const selectedTimer = window.timers.currentTimer;

  window.timers.delete(selectedTimer);
});

startBtn.addEventListener("click", (e) => {
  window.timers.currentTimer.start();
});

stopBtn.addEventListener("click", (e) => {
  window.timers.currentTimer.stop();
});

pauseBtn.addEventListener("click", (e) => {
  window.timers.currentTimer.pause();
});

resetBtn.addEventListener("click", (e) => {
  window.timers.currentTimer.reset();
});

addExtraTimeBtn.addEventListener("click", (e) => {
  window.timers.currentTimer.add(timerInput.value);
});