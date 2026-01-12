import instance from './index';

// --- PROJECTS ---
export const getListProjects = (params) => instance.get('/to-do/projects', { params });
export const getProjectDetail = (projectId) => instance.get(`/to-do/projects/${projectId}`);
export const createProject = (data) => instance.post('/to-do/projects', data);
export const updateProject = (projectId, data) => instance.patch(`/to-do/projects/${projectId}`, data);
export const archiveProject = (projectId) => instance.post(`/to-do/projects/${projectId}/archive`);
// --- USERS ---
export const getAllUsers = () => instance.get('/user');

// --- CATEGORIES (COLUMNS) ---
export const getListCategories = (projectId) => instance.get(`/to-do/projects/${projectId}/categories`);
export const createCategory = (projectId, data) => instance.post(`/to-do/projects/${projectId}/categories`, data);

export const updateCategory = (projectId, categoryId, data) =>
  instance.patch(`/to-do/projects/${projectId}/categories/${categoryId}`, data);

export const reorderCategories = (projectId, orderedCategoryIds) =>
  instance.post(`/to-do/projects/${projectId}/categories/reorder`, { orderedCategoryIds });
export const archiveCategory = (projectId, categoryId) => instance.post(`/to-do/projects/${projectId}/categories/${categoryId}/archive`);

// --- ISSUES (TASKS) ---
export const getBoardData = (projectId) => instance.get(`/to-do/projects/${projectId}/board?includeArchived=false`);
export const createIssue = (projectId, data) => instance.post(`/to-do/projects/${projectId}/issues`, data);
export const updateIssue = (projectId, issueId, data) => instance.patch(`/to-do/projects/${projectId}/issues/${issueId}`, data);
export const moveIssue = (projectId, issueId, data) => instance.post(`/to-do/projects/${projectId}/issues/${issueId}/move`, data);
export const archiveIssue = (projectId, issueId) => instance.post(`/to-do/projects/${projectId}/issues/${issueId}/archive`);

export const uploadIssueAttachment = (projectId, issueId, formData) =>
  instance.post(`/to-do/projects/${projectId}/issues/${issueId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
