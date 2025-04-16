let canvas = document.getElementById('canvas');
let generator = new StringArtGenerator(canvas);

const controlGroup = document.querySelectorAll('.control-group h3');

for (const elem of controlGroup) {
  elem.addEventListener('click', e => {
    elem.parentElement.classList.toggle('opened');
  });
}
