const lang = "ru-RU"; // Задаём стандартный язык произношения

export function speak(text) {
  // Функция речи
  var speech = window.speechSynthesis, // Объявляем переменные
    voice = "",
    ourvoice = []; // Сюда будем складывать доступные звуки браузера
  if (0 === ourvoice.length) {
    // Если равно нулю, то...
    var voices = speech.getVoices(); // Получаем все языки
  }
  for (var i = 0; i < voices.length; i++) {
    // Находим указанный в списке
    if (lang == voices[i].lang) {
      voice = voices[i]; // Ставим язык как параметр
    }
  }
  var readme = new SpeechSynthesisUtterance(text); // вводим текст
  readme.voice = voice; // Задаём язык произношения
  speech.speak(readme); // Произносим
}
