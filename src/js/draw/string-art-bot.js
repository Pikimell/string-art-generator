import hash from 'https://cdn.jsdelivr.net/npm/hash-it@6.0.0/+esm';
import { speak } from './speaker';
let PARAMS = {
  ID: null,
  COUNT_POINTS: 100,
  DELAY_TIME: 5,
  POINTS: [],
  CURRENT_INDEX: 0,
  DRAW_LINES: true,
  PROGRESS: 0,
  TITLE: 'Simple Art',
};

const refs = {
  formElem: document.querySelector('.js-form'),
  formInfo: document.querySelector('.js-form1'),
  canvas: document.querySelector('.js-canvas'),
  canvas2: document.querySelector('.js-canvas2'),
  btnElems: document.querySelector('.js-btn'),
  visibleBtn: document.querySelector('.js-visible-canvas'),
  playerElem: document.querySelector('.js-player'),
  progressBar: document.querySelector('.js-art-progess'),
  openFileBtn: document.querySelector('.js-load'),
  artName: document.querySelector('.js-art-name'),
};

let isCanvas2Initialized = false;
const ctx = refs.canvas.getContext('2d');
const ctx2 = refs.canvas2.getContext('2d');

refs.visibleBtn.addEventListener('change', e => {
  if (!e.target.checked) {
    refs.canvas2.style.visibility = 'hidden';
  } else {
    refs.canvas2.style.visibility = '';
    drawArt(PARAMS.CURRENT_INDEX);
  }
  PARAMS.DRAW_LINES = e.target.checked;
  draw();
});

refs.formElem.addEventListener('submit', e => {
  e.preventDefault();
  const data = e.target.elements.data.value;

  if (data) {
    loadData(data);
  } else {
    loadPoint();
  }
  ctx2.clearRect(0, 0, refs.canvas2.width, refs.canvas2.height);
  const max = Math.max(...PARAMS.POINTS) + 1 || 0;
  refs.formInfo.elements.count.value = max;
  PARAMS.COUNT_POINTS = max;
  draw();
});
refs.formInfo.addEventListener('submit', e => {
  e.preventDefault();
  const point = Number(e.target.elements.point.value);
  const count = Number(e.target.elements.count.value);
  const delay = Number(e.target.elements.delay.value);
  PARAMS.COUNT_POINTS = count || PARAMS.COUNT_POINTS;
  PARAMS.DELAY_TIME = delay || PARAMS.DELAY_TIME;
  ctx2.clearRect(0, 0, refs.canvas2.width, refs.canvas2.height);
  setPoint(point || PARAMS.CURRENT_INDEX);
});

document.body.addEventListener('keydown', e => {
  if (e.code === 'Enter') {
    loadPoint();
  } else if (e.code === 'ArrowLeft') {
    prevPoint();
  } else if (e.code === 'ArrowRight' || e.code === 'Space') {
    e.preventDefault();
    nextPoint();
  }
});

function loadPoint() {
  PARAMS.CURRENT_INDEX = 0;
  if (PARAMS.POINTS.length === 0) {
    const data = JSON.parse(localStorage.getItem('stringArt'));
    PARAMS = data || PARAMS;
  }
  refs.formElem.elements.data.value = PARAMS.POINTS;
  refs.artName.value = PARAMS.TITLE;
}
function nextPoint() {
  if (PARAMS.POINTS.length && PARAMS.CURRENT_INDEX < PARAMS.POINTS.length) {
    PARAMS.CURRENT_INDEX++;
    draw();
  }
}
function prevPoint() {
  if (PARAMS.POINTS.length) {
    PARAMS.CURRENT_INDEX--;
    draw();
  }
}

function loadData(dataString) {
  PARAMS.POINTS = dataString.split(',');
  saveData();
}

function draw() {
  saveData();
  refs.canvas.width = refs.canvas.getBoundingClientRect().width;
  refs.canvas.height = refs.canvas.getBoundingClientRect().width;
  if (!isCanvas2Initialized) {
    refs.canvas2.width = refs.canvas2.getBoundingClientRect().width;
    refs.canvas2.height = refs.canvas2.getBoundingClientRect().width;
    isCanvas2Initialized = true;
  }

  const prevPoint = +(PARAMS.POINTS[PARAMS.CURRENT_INDEX - 1] || 0);
  const currentPoint = +(PARAMS.POINTS[PARAMS.CURRENT_INDEX] || 0);
  const nextPoint = +(PARAMS.POINTS[PARAMS.CURRENT_INDEX + 1] || 0);

  refs.formInfo.elements.point.value = PARAMS.CURRENT_INDEX;

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
    speak(PARAMS.POINTS[PARAMS.CURRENT_INDEX]);
  } catch (err) {
    console.log('err', err);
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

  drawLine(
    ctx2,
    currentPoint,
    nextPoint,
    PARAMS.COUNT_POINTS,
    { x: refs.canvas2.width / 2, y: refs.canvas2.height / 2 },
    refs.canvas2.width / 2 - 5
  );

  PARAMS.PROGRESS = (PARAMS.CURRENT_INDEX / PARAMS.POINTS.length) * 100;
  updateProgress();
}

function drawText(ctx, point, { x, y }, font = 100) {
  if (PARAMS.DRAW_LINES) return;
  ctx.fillStyle = 'black';
  ctx.font = `${font}px serif`;
  ctx.textAlign = 'center';
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
    ctx.fillStyle = 'black';
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
        ctx.fillStyle = 'green';
        break;
      case 1:
        ctx.fillStyle = 'red';
        minR = 15;
        break;
      case 2:
        ctx.fillStyle = 'blue';
        break;
    }

    ctx.beginPath();
    ctx.ellipse(endPoint.x, endPoint.y, minR, minR, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLine(ctx, currentPoint, nextPoint, countPoint, center, r) {
  const partOf = Math.round(countPoint / 4);
  currentPoint = countPoint - currentPoint + partOf;
  nextPoint = countPoint - nextPoint + partOf;

  const radian = (Math.PI * 2) / countPoint;

  const startPoint = {
    x: r * Math.sin(radian * currentPoint) + center.x,
    y: r * Math.cos(radian * currentPoint) + center.y,
  };
  const endPoint = {
    x: r * Math.sin(radian * nextPoint) + center.x,
    y: r * Math.cos(radian * nextPoint) + center.y,
  };
  ctx.lineWidth = 0.3;
  ctx.beginPath(); // Start a new path
  ctx.moveTo(startPoint.x, startPoint.y); // Move the pen to (30, 50)
  ctx.lineTo(endPoint.x, endPoint.y); // Draw a line to (150, 100)
  ctx.stroke();
}

function setPoint(point) {
  PARAMS.CURRENT_INDEX = point;
  draw();
  drawArt(PARAMS.CURRENT_INDEX);
}

refs.btnElems.addEventListener('click', e => {
  if (e.target != e.currentTarget) {
    const btn = e.target.closest('button');
    const value = btn.dataset.value;

    if (value == 'prev') {
      prevPoint();
    } else {
      nextPoint();
    }
  }
});

refs.canvas.addEventListener('click', () => {
  nextPoint();
});

function drawArt(lastIndex) {
  ctx2.clearRect(0, 0, refs.canvas2.width, refs.canvas2.height);
  for (let i = 0; i < lastIndex; i++) {
    const currentPoint = +(PARAMS.POINTS[i] || 0);
    const nextPoint = +(PARAMS.POINTS[i + 1] || 0);
    drawLine(
      ctx2,
      currentPoint,
      nextPoint,
      PARAMS.COUNT_POINTS,
      { x: refs.canvas2.width / 2, y: refs.canvas2.height / 2 },
      refs.canvas2.width / 2 - 5
    );
  }
}

function updateProgress() {
  refs.progressBar.value = PARAMS.PROGRESS;
}

function init() {
  refs.formElem.elements.send.click();
  drawArt(PARAMS.CURRENT_INDEX);
}
init();

function loadFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.stringart'; // Дозволяємо вибирати тільки файли з розширенням .stringart

  input.addEventListener('change', async event => {
    const file = event.target.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = e => {
        PARAMS = {
          COUNT_POINTS: 100,
          DELAY_TIME: 5,
          POINTS: [],
          CURRENT_INDEX: 0,
          DRAW_LINES: true,
          PROGRESS: 0,
          TITLE: 'Simple Art',
        };
        refs.formElem.elements.data.value = e.target.result;
        refs.formElem.elements.send.click();
      };

      reader.readAsText(file); // Читаємо файл як текст
    }
  });

  input.click(); // Викликаємо клік, щоб відкрити вікно вибору файлу
}

refs.openFileBtn.addEventListener('click', loadFile);

function saveData() {
  PARAMS.ID = hash(PARAMS.POINTS.toString());

  const data = JSON.stringify(PARAMS);
  localStorage.setItem('stringArt', data);

  const jobs = JSON.parse(localStorage.getItem('jobs') || '{}');
  jobs[PARAMS.ID] = PARAMS;
  localStorage.setItem('jobs', JSON.stringify(jobs));
}
//!======================================================

refs.artName.addEventListener('input', e => {
  const value = e.target.value;
  PARAMS.TITLE = value || 'Simple art';
  saveData();
});

//!======================================================

const audioElement = document.querySelector('audio');
let idTimer = null;

audioElement.addEventListener('play', function () {
  if (idTimer === null) idTimer = setInterval(tick, PARAMS.DELAY_TIME * 1000);
});

audioElement.addEventListener('pause', function () {
  clearInterval(idTimer);
  idTimer = null;
});

function tick() {
  nextPoint();
}
