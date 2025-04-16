const formElem = document.querySelector('.js-auth-form');

formElem.addEventListener('submit', e => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  console.log(data);
});
