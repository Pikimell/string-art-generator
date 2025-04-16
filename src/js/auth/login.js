import { login } from './auth.js';
const formElem = document.querySelector('#login-form');

formElem.addEventListener('submit', e => {
  e.preventDefault();
  const email = e.target.elements['login-email'].value;
  const password = e.target.elements['login-password'].value;

  login(email, password);
});
