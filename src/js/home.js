const jsonData = localStorage.getItem('jobs') || '{}';
const data = JSON.parse(jsonData);
const dataArray = Object.values(data);

const container = document.querySelector('.js-container');

function renderCards(dataArray) {
  const markup = cardsTemplate(dataArray);
  container.innerHTML = markup; // Очищуємо контейнер перед рендерингом
}

function cardTemplate(item) {
  return `
  <div class="card" data-id="${item.ID}">
    <img height="200" src="https://png.pngtree.com/png-vector/20240527/ourmid/pngtree-an-artistic-logo-with-a-modern-vector-png-image_6946515.png"/>
    <h3>${item.TITLE || 'Simple Art'}</h3>
    <div class="progress-bar">
        <span style="width: ${item.PROGRESS}%"></span>
    </div>
    <div class="fb">
    <p>Точки: ${item.COUNT_POINTS}</p>
    <p>Лінії: ${item.POINTS.length}</p>
    <p>Останній пін: ${item.CURRENT_INDEX}</p>
    </div>
</div>`;
}

function cardsTemplate(arr) {
  if (arr.length) {
    return arr.map(cardTemplate).join('');
  } else {
    return `
    <div class="empty-placeholder">
      <img src="https://cdn-icons-png.flaticon.com/512/4076/4076549.png" alt="No projects" width="120" height="120" />
      <h2>Ще немає створених робіт</h2>
      <p>Створіть свій перший String Art у вкладці "Create Art"</p>
    </div>
  `;
  }
}
renderCards(dataArray);

container.addEventListener('click', e => {
  if (e.target === e.currentTarget) return;
  const card = e.target.closest('.card');
  const id = card.dataset.id;
  const obj = data[id];
  localStorage.setItem('stringArt', JSON.stringify(obj));

  const link = document.createElement('a');
  link.href = '/draw-art.html';
  link.click();
});
