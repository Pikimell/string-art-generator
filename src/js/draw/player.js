const refs = {
  audioInput: document.querySelector('.js-audio'),
  playerElem: document.querySelector('.js-player'),
  downloadLink: document.getElementById('download-link'),
  prevTrackBtn: document.querySelector('.js-prev-track'),
  nextTrackBtn: document.querySelector('.js-next-track'),
};

let playlist = [];
let currentIndex = 0;

refs.audioInput.addEventListener('change', e => {
  const files = Array.from(e.target.files);
  if (files.length > 0) {
    playlist = files.map(file => URL.createObjectURL(file));
    currentIndex = 0;
    playTrack(currentIndex);
  }
});

function playTrack(index) {
  if (playlist.length === 0) return;
  refs.playerElem.src = playlist[index];
  refs.playerElem
    .play()
    .catch(err => console.log('Автовідтворення заблоковано:', err));

  // Оновлення посилання для завантаження
  // refs.downloadLink.href = playlist[index];
  // refs.downloadLink.download = `track_${index + 1}.mp3`;
}

refs.playerElem.addEventListener('ended', () => {
  currentIndex = (currentIndex + 1) % playlist.length;
  playTrack(currentIndex);
});

refs.nextTrackBtn.addEventListener('click', () => {
  currentIndex = (currentIndex + 1) % playlist.length;
  playTrack(currentIndex);
});

refs.prevTrackBtn.addEventListener('click', () => {
  currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
  playTrack(currentIndex);
});
