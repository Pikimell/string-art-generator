import { nextPoint, PARAMS } from "./stringAtrBot.js";

const audioElement = document.querySelector("audio");
let idTimer = null;

audioElement.addEventListener("play", function () {
  if (idTimer === null) idTimer = setInterval(tick, PARAMS.DELAY_TIME * 1000);
});

audioElement.addEventListener("pause", function () {
  clearInterval(idTimer);
  idTimer = null;
});

function tick() {
  nextPoint();
}
