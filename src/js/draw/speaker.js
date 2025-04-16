const refs = {
  volumeElem: document.querySelector('.js-volume'),
};

const defaultLang = 'uk-UK'; // Мова за замовчуванням

const options = {
  volume: 0.1, // Гучність (від 0.0 до 1.0)
};

let voices = []; // Масив голосів

// Завантажуємо доступні голоси
function loadVoices() {
  voices = window.speechSynthesis.getVoices();
}

// Слухаємо подію зміни голосів
if (window.speechSynthesis.onvoiceschanged !== undefined) {
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

export function speak(text, lang = defaultLang) {
  if (!voices.length) {
    loadVoices(); // Завантажуємо голоси, якщо їх ще немає
  }

  // Знаходимо голос із потрібною мовою
  let voice = voices.find(v => v.lang === lang);

  // Якщо голос із вказаною мовою не знайдено, беремо перший доступний голос
  if (!voice) {
    console.warn(
      `Voice for language "${lang}" not found. Using default voice.`
    );
    voice = voices[0]; // Перший доступний голос
  }

  if (!voice) {
    console.error('No voices available in the browser.');
    return;
  }

  const readme = new SpeechSynthesisUtterance(text);
  readme.voice = voice; // Встановлюємо голос
  readme.volume = Math.max(0, Math.min(1, options.volume)); // Встановлюємо гучність
  window.speechSynthesis.speak(readme); // Промовляємо текст
}

refs.volumeElem.addEventListener('change', e => {
  options.volume = +e.target.value;
});
