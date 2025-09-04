import instance from '.';

const getAllReport = (params) => {
  return instance.get('/report', { params });
};

const importReport = (payload) => {
  return instance.post('/report/import-file', payload, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export { getAllReport, importReport };
