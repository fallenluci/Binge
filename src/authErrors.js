const ERRORS = {
  'auth/invalid-email': 'Неверный формат email',
  'auth/missing-email': 'Введи email',
  'auth/missing-password': 'Введи пароль',
  'auth/weak-password': 'Пароль должен быть не короче 6 символов',
  'auth/email-already-in-use': 'Этот email уже зарегистрирован — попробуй войти',
  'auth/invalid-credential': 'Неверный email или пароль',
  'auth/user-not-found': 'Аккаунт с таким email не найден',
  'auth/wrong-password': 'Неверный email или пароль',
  'auth/too-many-requests': 'Слишком много попыток, попробуй позже',
  'auth/network-request-failed': 'Нет соединения с сервером',
  'auth/requires-recent-login': 'Войди заново и повтори',
  'auth/credential-already-in-use': 'Этот email уже используется',
};

export const authErrorMessage = (e) => ERRORS[e?.code] || 'Что-то пошло не так, попробуй ещё раз';
