import instance from '.';

const login = (username, password) => {
  return instance.post('/auth/login', {
    username,
    password,
  });
};

export { login };
