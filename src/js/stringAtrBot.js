import { speak } from "./speaker";
export const PARAMS = {
  COUNT_POINTS: 100,
  DELAY_TIME: 5,
};
const refs = {
  formElem: document.querySelector(".js-form"),
  form1Elem: document.querySelector(".js-form1"),
  canvas: document.querySelector("canvas"),
  btnElems: document.querySelector(".js-btn"),
  visibleBtn: document.querySelector(".js-visible-canvas"),
  audioElem: document.querySelector(".js-audio"),
  playerElem: document.querySelector(".js-player"),
};
const ctx = refs.canvas.getContext("2d");
ctx.lineWidth = 1;
let arrPoints = [];

const drawPoints = {
  currentPoint: 0,
};

refs.visibleBtn.addEventListener("change", (e) => {
  if (e.target.checked) {
    refs.canvas.style.visibility = "hidden";
  } else {
    refs.canvas.style.visibility = "";
  }
});

refs.formElem.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = e.target.elements.data.value;
  if (data) {
    loadData(data);
  } else {
    loadPoint();
  }
});
refs.form1Elem.addEventListener("submit", (e) => {
  e.preventDefault();
  const point = Number(e.target.elements.point.value);
  const count = Number(e.target.elements.count.value);
  const delay = Number(e.target.elements.delay.value);
  PARAMS.COUNT_POINTS = count || PARAMS.COUNT_POINTS;
  PARAMS.DELAY_TIME = delay || PARAMS.DELAY_TIME;
  setPoint(point || drawPoints.currentPoint);
});

document.body.addEventListener("keydown", (e) => {
  if (e.code === "Enter") {
    loadPoint();
  } else if (e.code === "ArrowLeft") {
    prevPoint();
  } else if (e.code === "ArrowRight" || e.code === "Space") {
    nextPoint();
  }
});

function loadPoint() {
  drawPoints.currentPoint = 0;
  if (arrPoints.length === 0) {
    arrPoints = JSON.parse(localStorage.getItem("dataPoint"));
    drawPoints.currentPoint = Number(localStorage.getItem("lastPoint"));
  }
  draw();
}
export function nextPoint() {
  drawPoints.currentPoint++;
  draw();
}
export function prevPoint() {
  drawPoints.currentPoint--;
  draw();
}

function saveData() {
  localStorage.setItem("points", JSON.stringify(drawPoints));
  localStorage.setItem("lastPoint", drawPoints.currentPoint);
}
function loadData(dataString) {
  arrPoints = dataString.split("\n");
  localStorage.setItem("dataPoint", JSON.stringify(arrPoints));
  localStorage.setItem("lastPoint", 0);
}

function draw() {
  saveData();
  const prevPoint = +(arrPoints[drawPoints.currentPoint - 1] || 0);
  const currentPoint = +(arrPoints[drawPoints.currentPoint] || 0);
  const nextPoint = +(arrPoints[drawPoints.currentPoint + 1] || 0);

  refs.form1Elem.elements.point.value = drawPoints.currentPoint;
  // drawLine(
  //   ctx,
  //   currentPoint,
  //   nextPoint,
  //   COUNT_POINTS,
  //   { x: refs.canvas.width / 2, y: refs.canvas.height / 2 },
  //   refs.canvas.width / 2 - 5
  // );
  ctx.clearRect(0, 0, refs.canvas.width, refs.canvas.height);
  drawCircle(
    ctx,
    refs.canvas.width / 2 - 5,
    PARAMS.COUNT_POINTS,
    { x: refs.canvas.width / 2, y: refs.canvas.height / 2 },
    prevPoint,
    currentPoint,
    nextPoint
  );

  try {
    speak(arrPoints[drawPoints.currentPoint]);
  } catch {
    console.log("err");
  }
  drawText(
    ctx,
    prevPoint,
    {
      x: refs.canvas.width / 2,
      y: refs.canvas.height / 2 - 200,
    },
    40
  );
  drawText(ctx, currentPoint, {
    x: refs.canvas.width / 2,
    y: refs.canvas.height / 2,
  });
  drawText(
    ctx,
    nextPoint,
    {
      x: refs.canvas.width / 2,
      y: refs.canvas.height / 2 + 200,
    },
    40
  );
}

function drawText(ctx, point, { x, y }, font = 100) {
  ctx.fillStyle = "black";
  ctx.font = `${font}px serif`;
  ctx.textAlign = "center";
  ctx.fillText(point, x, y);
}

function drawCircle(ctx, r, countPoint, center, ...points) {
  const radian = (Math.PI * 2) / countPoint;

  for (let i = 0; i < countPoint; i++) {
    let angle =
      radian *
      (PARAMS.COUNT_POINTS - (i - Math.round(PARAMS.COUNT_POINTS / 4)));
    const endPoint = {
      x: r * Math.sin(angle) + center.x,
      y: r * Math.cos(angle) + center.y,
    };

    const minR = i % 10 == 0 ? 4 : 2;
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.ellipse(endPoint.x, endPoint.y, minR, minR, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < points.length; i++) {
    let angle =
      radian *
      (PARAMS.COUNT_POINTS -
        (+points[i] - Math.round(PARAMS.COUNT_POINTS / 4)));
    const endPoint = {
      x: r * Math.sin(angle) + center.x,
      y: r * Math.cos(angle) + center.y,
    };
    let minR = 5;
    switch (i) {
      case 0:
        ctx.fillStyle = "green";
        break;
      case 1:
        ctx.fillStyle = "red";
        minR = 15;
        break;
      case 2:
        ctx.fillStyle = "blue";
        break;
    }

    ctx.beginPath();
    ctx.ellipse(endPoint.x, endPoint.y, minR, minR, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLine(ctx, currentPoint, nextPoint, countPoint, center, r) {
  // currentPoint -= 60;
  // nextPoint -= 60;

  const radian = (Math.PI * 2) / countPoint;

  const startPoint = {
    x: r * Math.sin(radian * currentPoint) + center.x,
    y: r * Math.cos(radian * currentPoint) + center.y,
  };
  const endPoint = {
    x: r * Math.sin(radian * nextPoint) + center.x,
    y: r * Math.cos(radian * nextPoint) + center.y,
  };

  ctx.beginPath(); // Start a new path
  ctx.moveTo(startPoint.x, startPoint.y); // Move the pen to (30, 50)
  ctx.lineTo(endPoint.x, endPoint.y); // Draw a line to (150, 100)
  ctx.stroke();
}

function setPoint(point) {
  drawPoints.currentPoint = point;
  draw();
}

refs.btnElems.addEventListener("click", (e) => {
  if (e.target != e.currentTarget) {
    const btn = e.target.closest("button");
    const value = btn.dataset.value;

    if (value == "prev") {
      prevPoint();
    } else {
      nextPoint();
    }
  }
});

refs.canvas.addEventListener("click", () => {
  nextPoint();
});

refs.audioElem.addEventListener("change", (e) => {
  const file = e.target.files[0];
  refs.playerElem.src = URL.createObjectURL(file);
});
