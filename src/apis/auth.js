import instance from '.';

const login = (username, password) => {
  return instance.post('/auth/login', {
    username,
    password,
  });
};

const changePassword = (payload) => {
  return instance.post('/auth/change-password', payload);
};

export { login, changePassword };
