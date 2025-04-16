function StringArtGenerator(canvas) {
  this.InitCanvas(canvas);
  this.InitSelectButton();
  this.InitControls();
  this.InitSave();
  this.InitEvents();
}
//!======================================================
StringArtGenerator.prototype.SelectImage = function (e) {
  let files = this.fileInput.files;

  if (files.length != 1) return;

  let image = new Image();
  image.onload = () => this.LoadImage(image);
  image.src = URL.createObjectURL(files[0]);

  this.fileInput.value = '';
};

StringArtGenerator.prototype.LoadImage = function (image) {
  this.image = image;
  this.isLineDrawing = false;

  this.Reset();

  if (this.formType === undefined || this.formType == IMAGE_FORM) {
    this.formType = this.formTypeBox.value;
    this.InitNails();
  }

  this.generateBtn.removeAttribute('disabled');
};

StringArtGenerator.prototype.UpdateForm = function () {
  let needInitArt = this.formType != this.formTypeBox.value;
  this.formType = this.formTypeBox.value;

  this.InitBbox();
  this.DrawLoadedImage();

  if (needInitArt) this.InitNails();
};

StringArtGenerator.prototype.ToSignString = function (value) {
  if (value > 0) return `+${value}`;

  if (value < 0) return `-${-value}`;

  return '0';
};

StringArtGenerator.prototype.UpdateContrast = function () {
  let value = +this.contrastBox.value;
  let contrast = 1 + value / 100;

  this.contrastTable = [];

  for (let i = 0; i < 256; i++)
    this.contrastTable[i] = this.LimitPixel((i - 128) * contrast + 128);
};

StringArtGenerator.prototype.UpdateBrightness = function () {
  let value = +this.brightnessBox.value;
  let brightness = 1 + value / 100;

  this.brightnessTable = [];

  for (let i = 0; i < 256; i++)
    this.brightnessTable[i] = this.LimitPixel(i * brightness);
};

StringArtGenerator.prototype.GetPixels = function () {
  this.pixelCtx.drawImage(this.canvas, 0, 0, this.width, this.height);
  let data = this.pixelCtx.getImageData(0, 0, this.width, this.height).data;
  let pixels = [];

  for (let i = 0; i < data.length; i += 4)
    pixels.push(this.GetLightness(data[i], data[i + 1], data[i + 2]));

  return pixels;
};

StringArtGenerator.prototype.GetLineLightness = function (line) {
  let lightness = 0;

  for (let index of line) lightness += this.pixels[index];

  return lightness / line.size;
};

StringArtGenerator.prototype.GetNextNail = function (nail) {
  let nextNail = nail;
  let nextLine = null;
  let minLightness = Infinity;

  for (let i = 0; i < this.nails.length; i++) {
    if (i == nail) continue;

    let line = this.LineRasterization(
      this.nails[i].x,
      this.nails[i].y,
      this.nails[nail].x,
      this.nails[nail].y
    );
    let lightness = this.GetLineLightness(line);

    if (lightness < minLightness) {
      minLightness = lightness;
      nextNail = i;
      nextLine = line;
    }
  }

  return {
    nail: nextNail,
    line: nextLine,
  };
};

StringArtGenerator.prototype.RemoveLine = function (line, lineWeight) {
  for (let index of line)
    this.pixels[index] = Math.min(
      255,
      this.pixels[index] + lineWeight * this.dpr
    );
};

StringArtGenerator.prototype.TimeToString = function (delta) {
  delta = Math.floor(delta);

  let milliseconds = `${delta % 1000}`.padStart(3, '0');
  let seconds = `${Math.floor(delta / 1000) % 60}`.padStart(2, '0');
  let minutes = `${Math.floor(delta / 60000)}`.padStart(2, '0');

  return `${minutes}:${seconds}.${milliseconds}`;
};

StringArtGenerator.prototype.ShowInfo = function (
  linesCount,
  totalCount,
  startTime
) {
  let currTime = performance.now();
  let time = this.TimeToString(currTime - startTime);
  let lost = this.TimeToString(
    ((currTime - startTime) / (totalCount - linesCount)) * linesCount
  );
  let avg = ((currTime - startTime) / (totalCount - linesCount)).toFixed(2);

  this.infoBox.innerHTML = `<b>Залишилось ліній:</b> ${linesCount}<br>`;
  this.infoBox.innerHTML += `<b>Пройшло часу:</b> ${time}<br>`;
  this.infoBox.innerHTML += `<b>Залишилось часу:</b> ${lost}<br>`;
  this.infoBox.innerHTML += `<b>Ср. час лінії:</b> ${avg} мс`;

  const currentLine = totalCount - linesCount;

  this.progressBar.value = (currentLine / totalCount) * 100;
};

StringArtGenerator.prototype.GetActions = function () {
  let actions = '<b>Основні дії:</b><br>';

  if ('ontouchstart' in window) {
    actions += '<b>Масштабування</b> - щіпок<br>';
    actions += '<b>Переміщення</b> - дотик';
  } else {
    actions += '<b>Масштабування</b> - скролінг<br>';
    actions += '<b>Переміщення</b> - ліва кнопка миші';
  }

  return actions;
};

StringArtGenerator.prototype.GetLineWeight = function () {
  return this.LimitPixel((+this.linesWeightBox.value / 100) * 255);
};

StringArtGenerator.prototype.GetLineColor = function () {
  let color = this.linesColorBox.value;
  let weight = this.GetLineWeight();

  return `${color}${weight.toString(16).padStart(2, '0')}`;
};

StringArtGenerator.prototype.ResetImage = function () {
  this.imgWidth = this.image.width;
  this.imgHeight = this.image.height;
  let aspectRatio = this.imgWidth / this.imgHeight;

  if (this.imgWidth > this.imgHeight) {
    this.imgWidth = this.width;
    this.imgHeight = Math.round(this.width / aspectRatio);
  } else {
    this.imgHeight = this.height;
    this.imgWidth = Math.round(this.imgHeight * aspectRatio);
  }

  this.imgX = 0;
  this.imgY = 0;
  this.imgScale = 1;

  this.InitBbox();
};

StringArtGenerator.prototype.Reset = function (needResetImage = true) {
  if (needResetImage) this.ResetImage();

  this.saveBox.style.display = 'none';
  this.infoBox.innerHTML = this.GetActions();
  this.isGenerating = false;
  this.isLineDrawing = false;

  for (let control of this.controls) control.removeAttribute('disabled');

  this.DrawLoadedImage();
};

StringArtGenerator.prototype.StartGenerate = function () {
  this.isGenerating = !this.isGenerating;

  if (!this.isGenerating) return;

  this.saveBox.style.display = 'none';
  this.infoBox.innerHTML = '';

  if (!this.isLineDrawing) {
    this.sequence = [];
    this.DrawLoadedImage();

    this.pixels = this.GetPixels();
    this.isLineDrawing = true;
    this.Clear(this.ctx);
    this.DrawNails();
  }

  for (let control of this.controls) control.setAttribute('disabled', '');

  this.generateBtn.textContent = 'Зупинити';
};

StringArtGenerator.prototype.EndGenerate = function () {
  this.saveBox.style.display = '';
  this.isGenerating = false;
  this.generateBtn.textContent = 'Запустити';

  this.resetBtn.removeAttribute('disabled');
  this.selectBtn.removeAttribute('disabled');
  this.linesCountBox.removeAttribute('disabled');
};

StringArtGenerator.prototype.GenerateIteration = function (
  nail,
  linesCount,
  totalCount,
  lineWeight,
  lineColor,
  startTime
) {
  this.sequence.push(nail);
  if (this.isDraw) this.ShowInfo(linesCount, totalCount, startTime);

  if (linesCount == 0 || !this.isGenerating) {
    this.EndGenerate();
    return;
  }

  let next = this.GetNextNail(nail);
  this.RemoveLine(next.line, lineWeight);
  if (this.isDraw)
    this.DrawLine(this.nails[nail], this.nails[next.nail], lineColor);

  window.requestAnimationFrame(() =>
    this.GenerateIteration(
      next.nail,
      linesCount - 1,
      totalCount,
      lineWeight,
      lineColor,
      startTime
    )
  );
};

StringArtGenerator.prototype.Generate = function () {
  this.StartGenerate();

  let linesCount = +this.linesCountBox.value;
  let lineWeight = this.GetLineWeight();
  let lineColor = this.GetLineColor();
  let startTime = performance.now();

  this.GenerateIteration(
    0,
    linesCount,
    linesCount,
    lineWeight,
    lineColor,
    startTime
  );
};

StringArtGenerator.prototype.ToStringArt = function () {
  return JSON.stringify(
    {
      nails: this.nails,
      color: this.GetLineColor(),
      background: this.backgroundColorBox.value,
      sequence: this.sequence,
    },
    null,
    '    '
  );
};

StringArtGenerator.prototype.ToTxt = function () {
  let result = ``;
  for (let elem of this.sequence) {
    result += elem + `, `;
  }
  return result;
};

StringArtGenerator.prototype.ToSVG = function () {
  let svg = `<svg viewBox="0 0 ${this.width} ${this.height}" width="512" height="512" version="1.1" xmlns="http://www.w3.org/2000/svg">\n`;

  if (this.formType == CIRCLE_FORM) {
    svg += `    <circle cx="${this.x0}" cy="${this.y0}" r="${
      this.radius + PADDING / 2
    }" fill="${this.backgroundColorBox.value}" />\n`;
  } else {
    let x = this.imgBbox.xmin;
    let y = this.imgBbox.ymin;
    let width = this.imgBbox.xmax - this.imgBbox.xmin;
    let height = this.imgBbox.ymax - this.imgBbox.ymin;

    svg += `    <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${this.backgroundColorBox.value}" />\n`;
  }

  for (let nail of this.nails)
    svg += `    <circle cx="${nail.x}" cy="${nail.y}" r="${NAIL_RADIUS}" fill="${NAIL_COLOR}" />\n`;

  for (let i = 1; i < this.sequence.length; i++) {
    let p1 = this.nails[this.sequence[i - 1]];
    let p2 = this.nails[this.sequence[i]];

    svg += `    <path d="M ${p1.x} ${p1.y} L ${p2.x} ${
      p2.y
    }" line-width="1" stroke="${this.GetLineColor()}" fill="none" />\n`;
  }

  svg += '</svg>';

  return svg;
};

StringArtGenerator.prototype.Save = function () {
  let type = this.saveTypeBox.value;
  let link = document.createElement('a');

  if (type == 'save') {
    const data = {
      COUNT_POINTS: 100,
      DELAY_TIME: 5,
      POINTS: this.ToTxt().split(','),
      CURRENT_INDEX: 0,
    };
    localStorage.setItem('stringArt', JSON.stringify(data));
    showNotification();

    return;
  } else if (type == 'stringart') {
    link.href = URL.createObjectURL(
      new Blob([this.ToTxt()], { type: 'text/plain;charset=utf-8' })
    );
    link.download = 'art.stringart';
  } else if (type == 'png') {
    link.href = this.canvas.toDataURL();
    link.download = 'art.png';
  } else if (type == 'svg') {
    link.href = URL.createObjectURL(new Blob([this.ToSVG()], { type: 'svg' }));
    link.download = 'art.svg';
  } else if (type == 'txt') {
    link.href = URL.createObjectURL(
      new Blob([this.ToTxt()], { type: 'text/plain;charset=utf-8' })
    );
    link.download = 'art.txt';
  }

  link.click();
};

StringArtGenerator.prototype.SetScale = function (scale, x, y) {
  let dx = (x - this.imgX) / this.imgScale;
  let dy = (y - this.imgY) / this.imgScale;

  this.imgScale = scale;
  this.imgX = x - dx * this.imgScale;
  this.imgY = y - dy * this.imgScale;
};

//!======================================================

StringArtGenerator.prototype.Clear = function (ctx) {
  ctx.clearRect(0, 0, this.width, this.height);
};

StringArtGenerator.prototype.GetLightness = function (red, green, blue) {
  return Math.floor(0.2126 * red + 0.7152 * green + 0.0722 * blue);
};

StringArtGenerator.prototype.LimitPixel = function (value) {
  if (value < 0) return 0;

  if (value > 255) return 255;

  return Math.round(value);
};

StringArtGenerator.prototype.DrawForm = function () {
  let formType = this.formTypeBox.value;

  this.ctx.strokeStyle = BORDER_COLOR;
  this.ctx.beginPath();

  if (formType == CIRCLE_FORM) {
    this.ctx.arc(this.x0, this.y0, this.radius + PADDING / 2, 0, Math.PI * 2);
  } else if (formType == RECT_FORM) {
    this.ctx.rect(0, 0, this.width, this.height);
  } else if (formType == ALBUM_FORM) {
    let height = this.width / Math.sqrt(2);
    this.ctx.rect(0, (this.height - height) / 2, this.width, height);
  } else if (formType == PORTRAIT_FORM) {
    let width = this.height / Math.sqrt(2);
    this.ctx.rect((this.width - width) / 2, 0, width, this.height);
  } else if (formType == IMAGE_FORM) {
    this.ctx.rect(0, 0, this.imgWidth, this.imgHeight);
  }

  this.ctx.fillStyle = this.backgroundColorBox.value;
  this.ctx.fill();
};

StringArtGenerator.prototype.DrawGrayScale = function () {
  this.Clear(this.fakeCtx);
  this.fakeCtx.drawImage(
    this.image,
    this.imgX,
    this.imgY,
    this.imgWidth * this.imgScale,
    this.imgHeight * this.imgScale
  );

  let data = this.fakeCtx.getImageData(
    0,
    0,
    this.width * this.dpr,
    this.height * this.dpr
  );
  let pixels = data.data;
  let invert = this.invertBox.checked;

  for (let i = 0; i < pixels.length; i += 4) {
    let lightness = this.GetLightness(pixels[i], pixels[i + 1], pixels[i + 2]);

    if (invert) lightness = 255 - lightness;

    lightness = this.brightnessTable[lightness];
    lightness = this.contrastTable[lightness];

    pixels[i] = lightness;
    pixels[i + 1] = lightness;
    pixels[i + 2] = lightness;
  }

  this.fakeCtx.putImageData(data, 0, 0);
  this.ctx.drawImage(this.fakeCanvas, 0, 0, this.width, this.height);
};

StringArtGenerator.prototype.DrawLoadedImage = function () {
  this.Clear(this.ctx);

  this.ctx.save();
  this.DrawForm();
  this.ctx.clip();
  this.DrawGrayScale();
  this.ctx.stroke();
  this.ctx.restore();
};

StringArtGenerator.prototype.DrawNails = function () {
  if (this.isDraw) {
    this.DrawForm();
    this.ctx.fillStyle = NAIL_COLOR;

    for (let nail of this.nails) {
      this.ctx.beginPath();
      this.ctx.arc(nail.x, nail.y, NAIL_RADIUS, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
};

StringArtGenerator.prototype.DrawLine = function (nail1, nail2, lineColor) {
  this.ctx.lineWidth = 1;
  this.ctx.strokeStyle = lineColor;
  this.ctx.beginPath();
  this.ctx.moveTo(nail1.x, nail1.y);
  this.ctx.lineTo(nail2.x, nail2.y);
  this.ctx.stroke();
};

//!======================================================

StringArtGenerator.prototype.Clip = function (value, min, max) {
  if (min > max) [min, max] = [max, min];

  if (value > max) return max;

  if (value < min) return min;

  return value;
};

StringArtGenerator.prototype.NormalizePoint = function () {
  this.imgX = this.Clip(
    this.imgX,
    this.imgBbox.xmin,
    this.imgBbox.xmax - this.imgWidth * this.imgScale
  );
  this.imgY = this.Clip(
    this.imgY,
    this.imgBbox.ymin,
    this.imgBbox.ymax - this.imgHeight * this.imgScale
  );
};

StringArtGenerator.prototype.TouchToPoint = function (touch) {
  return { x: Math.round(touch.clientX), y: Math.round(touch.clientY) };
};

StringArtGenerator.prototype.GetPointDistance = function (p1, p2) {
  let dx = p2.x - p1.x;
  let dy = p2.y - p1.y;

  return Math.sqrt(dx * dx + dy * dy);
};

StringArtGenerator.prototype.MaxAbs = function (a, b) {
  return Math.abs(a) > Math.abs(b) ? a : b;
};

StringArtGenerator.prototype.MouseDown = function (e) {
  this.isPressed = true;
  this.prevX = e.offsetX;
  this.prevY = e.offsetY;
  e.preventDefault();
};

StringArtGenerator.prototype.MouseMove = function (e) {
  e.preventDefault();

  if (!this.isPressed || this.isGenerating || this.isLineDrawing) return;

  let dx = e.offsetX - this.prevX;
  let dy = e.offsetY - this.prevY;

  this.imgX += dx;
  this.imgY += dy;

  this.prevX = e.offsetX;
  this.prevY = e.offsetY;

  this.NormalizePoint();
  this.DrawLoadedImage();
};

StringArtGenerator.prototype.MouseUp = function (e) {
  e.preventDefault();
  this.isPressed = false;
};

StringArtGenerator.prototype.ChangeSize = function (e) {
  e.preventDefault();

  if (this.isGenerating || this.isLineDrawing) return;

  let scale = e.target.value * 1;

  this.SetScale(
    scale,
    this.canvas.scrollWidth / 2,
    this.canvas.scrollHeight / 2
  );
  this.NormalizePoint();
  this.DrawLoadedImage();
};

StringArtGenerator.prototype.MouseWheel = function (e) {
  e.preventDefault();

  if (this.isGenerating || this.isLineDrawing) return;

  let scaleIndex = SCALES.indexOf(this.imgScale) - Math.sign(e.deltaY);
  let scale = SCALES[Math.max(0, Math.min(SCALES.length - 1, scaleIndex))];

  this.SetScale(scale, e.offsetX, e.offsetY);
  this.NormalizePoint();
  this.DrawLoadedImage();
};

StringArtGenerator.prototype.DragOver = function (e) {
  this.dragDropBox.style.display = '';
  e.preventDefault();
};

StringArtGenerator.prototype.DragLeave = function (e) {
  this.dragDropBox.style.display = 'none';
  e.preventDefault();
};

StringArtGenerator.prototype.Drop = function (e) {
  e.preventDefault();
  this.dragDropBox.style.display = 'none';

  if (e.dataTransfer.files.length != 1) {
    alert('Можно перетащить не более одного файла');
    return;
  }

  let image = new Image();
  image.onload = () => this.LoadImage(image);
  image.src = URL.createObjectURL(e.dataTransfer.files[0]);
};

StringArtGenerator.prototype.TouchStart = function (e) {
  e.preventDefault();
  this.touches = [];

  if (e.targetTouches.length == 1) {
    let point = this.TouchToPoint(e.targetTouches[0]);
    e.offsetX = point.x;
    e.offsetY = point.y;
    this.MouseDown(e);
  } else if (e.targetTouches.length == 2) {
    this.touches.push(this.TouchToPoint(e.targetTouches[0]));
    this.touches.push(this.TouchToPoint(e.targetTouches[1]));
  }
};

StringArtGenerator.prototype.TouchMove = function (e) {
  if (!this.isPressed || this.isGenerating || this.isLineDrawing) return;

  e.preventDefault();

  if (e.targetTouches.length == 1) {
    let point = this.TouchToPoint(e.targetTouches[0]);
    e.offsetX = point.x;
    e.offsetY = point.y;
    this.MouseMove(e);
    return;
  }

  if (e.targetTouches.length != 2) return;

  let p1 = this.TouchToPoint(e.targetTouches[0]);
  let p2 = this.TouchToPoint(e.targetTouches[1]);

  let dst1 = this.GetPointDistance(this.touches[0], this.touches[1]);
  let dst2 = this.GetPointDistance(p1, p2);

  if (Math.abs(dst2 - dst1) > TOUCH_DELTA)
    this.SetScale(
      (this.imgScale * dst2) / dst1,
      (p1.x + p2.x) / 2,
      (p1.y + p2.y) / 2
    );

  let dx1 = p1.x - this.touches[0].x;
  let dx2 = p2.x - this.touches[1].x;

  if (Math.sign(dx1) == Math.sign(dx2)) this.imgX += this.MaxAbs(dx1, dx2);

  let dy1 = p1.y - this.touches[0].y;
  let dy2 = p2.y - this.touches[1].y;

  if (Math.sign(dy1) == Math.sign(dy2)) this.imgY += this.MaxAbs(dy1, dy2);

  this.touches = [p1, p2];

  this.NormalizePoint();
  this.DrawLoadedImage();
};

StringArtGenerator.prototype.TouchEnd = function (e) {
  e.preventDefault();
  this.isPressed = false;
};
//!======================================================

StringArtGenerator.prototype.InitCanvas = function (canvas) {
  this.canvas = canvas;
  this.ctx = this.canvas.getContext('2d');
  this.width = this.canvas.clientWidth;
  this.height = this.canvas.clientHeight;

  this.dpr = window.devicePixelRatio || 1;
  this.canvas.width = this.width * this.dpr;
  this.canvas.height = this.height * this.dpr;
  this.ctx.scale(this.dpr, this.dpr);
  this.canvas.style.width = this.width + 'px';
  this.canvas.style.height = this.height + 'px';

  this.fakeCanvas = document.createElement('canvas');
  this.fakeCanvas.width = this.width * this.dpr;
  this.fakeCanvas.height = this.height * this.dpr;
  this.fakeCtx = this.fakeCanvas.getContext('2d');
  this.fakeCtx.scale(this.dpr, this.dpr);

  this.pixelCanvas = document.createElement('canvas');
  this.pixelCanvas.width = this.width;
  this.pixelCanvas.height = this.height;
  this.pixelCtx = this.pixelCanvas.getContext('2d');

  this.x0 = this.width / 2;
  this.y0 = this.height / 2;
  this.radius = Math.min(this.width, this.height) / 2 - PADDING;
};

StringArtGenerator.prototype.InitSelectButton = function () {
  this.fileInput = document.createElement('input');
  this.fileInput.type = 'file';
  this.fileInput.accept = 'image/*';
  this.fileInput.addEventListener('change', e => this.SelectImage(e));

  this.selectBtn = document.getElementById('select-btn');
  this.selectBtn.addEventListener('click', () => this.fileInput.click());
};

StringArtGenerator.prototype.InitControls = function () {
  this.dragDropBox = document.getElementById('drag-drop-box');
  this.controlsBox = document.getElementById('controls-box');
  this.progressBar = document.querySelector('.js-art-progess');

  this.formTypeBox = document.getElementById('form-type-box');
  this.formTypeBox.addEventListener('change', () => this.UpdateForm());

  this.invertBox = document.getElementById('invert-box');

  this.invertBox.addEventListener('change', () => this.DrawLoadedImage());

  this.drawBox = document.getElementById('draw-box');
  this.drawBox.addEventListener('change', () => this.changeDrawble());
  this.isDraw = true;

  this.sizeBoxElem = document.getElementById('size-box');

  this.sizeBoxElem.addEventListener('input', e => {
    this.ChangeSize(e);
    this.UpdateSizePhoto();
  });

  this.contrastBox = document.getElementById('contrast-box');
  this.contrastValue = document.getElementById('contrast-value');
  this.contrastBox.addEventListener('input', () => this.UpdateContrast());
  this.contrastBox.addEventListener('change', () => {
    this.UpdateContrast();
    this.DrawLoadedImage();
  });

  this.brightnessBox = document.getElementById('brightness-box');
  this.brightnessValue = document.getElementById('brightness-value');
  this.brightnessBox.addEventListener('input', () => this.UpdateBrightness());
  this.brightnessBox.addEventListener('change', () => {
    this.UpdateBrightness();
    this.DrawLoadedImage();
  });

  this.nailsModeBox = document.getElementById('nails-mode-box');
  this.nailsModeBox.addEventListener('change', () => this.InitNails());

  this.nailsCountBox = document.getElementById('nails-count-box');
  this.nailsCountBox.addEventListener('change', () => this.InitNails());

  this.linesCountBox = document.getElementById('lines-count-box');

  this.linesWeightBox = document.getElementById('lines-weight-box');
  this.linesWeightValue = document.getElementById('lines-weight-value');

  this.linesColorBox = document.getElementById('lines-color-box');

  this.backgroundColorBox = document.getElementById('background-color-box');
  this.backgroundColorBox.addEventListener('change', () =>
    this.DrawLoadedImage()
  );
  this.backgroundColorBox.addEventListener('input', () =>
    this.DrawLoadedImage()
  );

  this.infoBox = document.getElementById('info-box');

  this.generateBtn = document.getElementById('generate-btn');
  this.generateBtn.addEventListener('click', () => this.Generate());

  this.resetBtn = document.getElementById('reset-btn');
  this.resetBtn.addEventListener('click', () =>
    this.Reset(!this.isLineDrawing)
  );

  this.statusBox = document.getElementById('status-box');

  this.controls = [
    this.selectBtn,
    this.invertBox,
    this.contrastBox,
    this.drawBox,
    this.brightnessBox,
    this.formTypeBox,
    this.nailsModeBox,
    this.nailsCountBox,
    this.linesCountBox,
    this.linesWeightBox,
    this.linesColorBox,
    this.backgroundColorBox,
    this.resetBtn,
    this.sizeBoxElem,
  ];

  this.UpdateContrast();
  this.UpdateBrightness();
};

StringArtGenerator.prototype.changeDrawble = function () {
  this.isDraw = this.drawBox.checked;
};

StringArtGenerator.prototype.InitSave = function () {
  this.saveBox = document.getElementById('save-box');

  this.saveTypeBox = document.getElementById('save-type-box');
  this.saveBtn = document.getElementById('save-btn');
  this.saveBtn.addEventListener('click', () => this.Save());
};

StringArtGenerator.prototype.InitEvents = function () {
  this.canvas.addEventListener('mousedown', e => this.MouseDown(e));
  this.canvas.addEventListener('mousemove', e => this.MouseMove(e));
  this.canvas.addEventListener('mouseup', e => this.MouseUp(e));
  this.canvas.addEventListener('mouseleave', e => this.MouseUp(e));
  this.canvas.addEventListener('mousewheel', e => this.MouseWheel(e));
  this.canvas.addEventListener('wheel', e => this.MouseWheel(e));

  this.touches = [];
  this.canvas.addEventListener('touchstart', e => {
    this.TouchStart(e);
  });
  this.canvas.addEventListener('touchmove', e => {
    this.TouchMove(e);
  });
  this.canvas.addEventListener('touchend', e => {
    this.TouchEnd(e);
  });

  let generator = document.getElementById('generator-box');
  generator.addEventListener('dragover', e => this.DragOver(e));
  generator.addEventListener('dragleave', e => this.DragLeave(e));
  generator.addEventListener('drop', e => this.Drop(e));
};

StringArtGenerator.prototype.Interpolate = function (a, b, t) {
  return a * t + b * (1 - t);
};

StringArtGenerator.prototype.GetCircleNail = function (t) {
  let x = this.x0 + this.radius * Math.cos(t);
  let y = this.y0 + this.radius * Math.sin(t);

  return { x: x, y: y };
};

StringArtGenerator.prototype.GetRectNail = function (
  angle,
  x0,
  y0,
  width,
  height
) {
  let t = angle / (2 * Math.PI);
  let aspectRatio = width / height;
  let t1 = 0.5 / (1 + aspectRatio);
  let ts = [0, t1, 0.5, 0.5 + t1, 1];
  let x, y;

  if (t < ts[1]) {
    x = x0 + width / 2;
    y = this.Interpolate(
      y0 - height / 2,
      y0 + height / 2,
      (t - ts[0]) / (ts[1] - ts[0])
    );
  } else if (t < ts[2]) {
    x = this.Interpolate(
      x0 - width / 2,
      x0 + width / 2,
      (t - ts[1]) / (ts[2] - ts[1])
    );
    y = y0 + height / 2;
  } else if (t < ts[3]) {
    x = x0 - width / 2;
    y = this.Interpolate(
      y0 + height / 2,
      y0 - height / 2,
      (t - ts[2]) / (ts[3] - ts[2])
    );
  } else {
    x = this.Interpolate(
      x0 + width / 2,
      x0 - width / 2,
      (t - ts[3]) / (ts[4] - ts[3])
    );
    y = y0 - height / 2;
  }

  return { x: x, y: y };
};

StringArtGenerator.prototype.InitBorderNails = function (nailsCount) {
  let angle = (2 * Math.PI) / nailsCount;
  let nails = [];

  for (let i = 0; i < nailsCount; i++) {
    let nail = { x: 0, y: 0 };
    let t = i * angle;

    if (this.formType == CIRCLE_FORM) {
      nail = this.GetCircleNail(t);
    } else if (this.formType == RECT_FORM) {
      nail = this.GetRectNail(
        t,
        this.x0,
        this.y0,
        this.width - 2 * PADDING,
        this.height - 2 * PADDING
      );
    } else if (this.formType == ALBUM_FORM) {
      let size = this.width - 2 * PADDING;
      nail = this.GetRectNail(t, this.x0, this.y0, size, size / Math.sqrt(2));
    } else if (this.formType == PORTRAIT_FORM) {
      let size = this.height - 2 * PADDING;
      nail = this.GetRectNail(t, this.x0, this.y0, size / Math.sqrt(2), size);
    } else if (this.formType == IMAGE_FORM) {
      let width = this.imgWidth - 2 * PADDING;
      let height = this.imgHeight - 2 * PADDING;
      nail = this.GetRectNail(
        t,
        this.imgWidth / 2,
        this.imgHeight / 2,
        width,
        height
      );
    }

    nail.x = Math.round(nail.x);
    nail.y = Math.round(nail.y);

    nails.push(nail);
  }

  return nails;
};

StringArtGenerator.prototype.InitGridNails = function (nailsCount) {
  let nails = [];
  let width = this.imgBbox.xmax - this.imgBbox.xmin;
  let height = this.imgBbox.ymax - this.imgBbox.ymin;
  let aspectRatio = width / height;

  let scale = this.formType == CIRCLE_FORM ? 2 / Math.sqrt(Math.PI) : 1;
  let wc = Math.round(Math.sqrt(nailsCount * aspectRatio * scale));
  let hc = Math.round(Math.sqrt((nailsCount / aspectRatio) * scale) * scale);

  let x0 = (this.imgBbox.xmin + this.imgBbox.xmax) / 2;
  let y0 = (this.imgBbox.ymin + this.imgBbox.ymax) / 2;

  for (let i = 0; i < hc; i++) {
    for (let j = 0; j < wc; j++) {
      let x = this.Interpolate(
        this.imgBbox.xmin + PADDING,
        this.imgBbox.xmax - PADDING,
        j / (wc - 1)
      );
      let y = this.Interpolate(
        this.imgBbox.ymin + PADDING,
        this.imgBbox.ymax - PADDING,
        i / (hc - 1)
      );

      if (this.formType == CIRCLE_FORM) {
        let dx = x - x0;
        let dy = y - y0;

        if (dx * dx + dy * dy > this.radius * this.radius) continue;
      }

      nails.push({
        x: Math.round(x),
        y: Math.round(y),
      });
    }
  }

  return nails;
};

StringArtGenerator.prototype.InitGridRandom = function (nailsCount) {
  let nails = [];

  for (let i = 0; i < nailsCount; i++) {
    let x, y;

    if (this.formType == CIRCLE_FORM) {
      let t = Math.random() * 2 * Math.PI;
      let radius = this.radius * Math.sqrt(Math.random());

      x = (this.imgBbox.xmin + this.imgBbox.xmax) / 2 + radius * Math.cos(t);
      y = (this.imgBbox.ymin + this.imgBbox.ymax) / 2 + radius * Math.sin(t);
    } else {
      x =
        this.imgBbox.xmin +
        Math.random() * (this.imgBbox.xmax - this.imgBbox.xmin);
      y =
        this.imgBbox.ymin +
        Math.random() * (this.imgBbox.ymax - this.imgBbox.ymin);
    }

    nails.push({
      x: Math.round(x),
      y: Math.round(y),
    });
  }

  return nails;
};

StringArtGenerator.prototype.InitNails = function () {
  let nailsMode = this.nailsModeBox.value;
  let nailsCount = +this.nailsCountBox.value;
  this.nails = [];

  if (nailsMode == BORDER_MODE) {
    this.nails = this.InitBorderNails(nailsCount);
  } else if (nailsMode == GRID_MODE) {
    this.nails = this.InitGridNails(nailsCount);
  } else if (nailsMode == RANDOM_MODE) {
    this.nails = this.InitGridRandom(nailsCount);
  }
};

StringArtGenerator.prototype.LineRasterization = function (x1, y1, x2, y2) {
  let line = new Set();

  let delta_x = Math.abs(x2 - x1);
  let delta_y = Math.abs(y2 - y1);

  let sign_x = Math.sign(x2 - x1);
  let sign_y = Math.sign(y2 - y1);

  let error = delta_x - delta_y;

  while (x1 != x2 || y1 != y2) {
    line.add(y1 * this.width + x1);
    error2 = error * 2;

    if (error2 > -delta_y) {
      error -= delta_y;
      x1 += sign_x;
    }

    if (error2 < delta_x) {
      error += delta_x;
      y1 += sign_y;
    }
  }

  line.add(y2 * this.width + x2);
  return line;
};

StringArtGenerator.prototype.InitBbox = function () {
  this.imgBbox = {
    xmin: 0,
    ymin: 0,
    xmax: this.width,
    ymax: this.height,
  };

  if (this.formType == ALBUM_FORM) {
    let height = Math.round(this.width / Math.sqrt(2));
    this.imgBbox.ymin = Math.round((this.height - height) / 2);
    this.imgBbox.ymax = this.imgBbox.ymin + height;
  } else if (this.formType == PORTRAIT_FORM) {
    let width = Math.round(this.height / Math.sqrt(2));
    this.imgBbox.xmin = Math.round((this.width - width) / 2);
    this.imgBbox.xmax = this.imgBbox.xmin + width;
  } else if (this.formType == IMAGE_FORM) {
    this.imgBbox.xmax = this.imgWidth;
    this.imgBbox.ymax = this.imgHeight;
  }

  this.NormalizePoint();
};
//!======================================================

function showNotification() {
  new Notify({
    status: 'success',
    title: 'Збережено!',
    text: 'Успішно Збережено. Перейдіть на вкладинку "Втілити арт" і натисніть кнпоку завантажити',
    effect: 'fade',
    speed: 500,
    customClass: '',
    customIcon: '',
    showIcon: false,
    showCloseButton: true,
    autoclose: true,
    autotimeout: 5000,
    notificationsGap: null,
    notificationsPadding: null,
    type: 'filled',
    position: 'x-center',
    customWrapper: '',
  });
}
