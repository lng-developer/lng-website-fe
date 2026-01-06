import instance from '.';

export const getListProjects = () => instance.get('/to-do/projects');
export const getProjectDetail = (id) => instance.get(`/to-do/projects/${id}`);

export const getListCategories = (projectId) => instance.get(`/to-do/projects/${projectId}/categories`);
export const createCategory = (projectId, data) => instance.post(`/to-do/projects/${projectId}/categories`, data);
