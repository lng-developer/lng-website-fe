import instance from '.';

// Get logs của extension cụ thể
export const getExtensionLogs = (machineId, params = {}) => {
  return instance.get(`/ext/logs/${machineId}`, { params });
};

// Get statistics của extension
export const getExtensionStats = (machineId, params = {}) => {
  return instance.get(`/ext/logs/stats/${machineId}`, { params });
};

// Get logs theo task ID
export const getLogsByTask = (taskId) => {
  return instance.get(`/ext/logs/task/${taskId}`);
};

// Get logs theo batch ID
export const getLogsByBatch = (batchId) => {
  return instance.get(`/ext/logs/batch/${batchId}`);
};

// Get all logs (admin)
export const getAllExtensionLogs = (params = {}) => {
  return instance.get('/ext/logs/all', { params });
};

// Submit log (extension gửi log)
export const submitLog = (logData) => {
  return instance.post('/ext/logs', logData);
};

// Cleanup logs cũ
export const cleanupLogs = (data) => {
  return instance.delete('/ext/logs/cleanup', { data });
};

// Export logs to CSV (nếu cần)
export const exportLogs = (machineId, params = {}) => {
  return instance.get(`/ext/logs/${machineId}/export`, { 
    params,
    responseType: 'blob'
  });
};