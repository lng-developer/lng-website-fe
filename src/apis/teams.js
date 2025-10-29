import instance from '.';
const getAllTeam = (params) => {
  return instance.get('/teams', {params})
}
const createTeam = (payload) => {
  return instance.post('/teams', payload);
};

const updateTeam = (teamId, payload) => {
  return instance.put(`/teams/${teamId}`, payload);
};

const deleteTeam = (teamId) => {
  return instance.delete(`/teams/${teamId}`);
};

const addTeamMembers = (teamId, payload) => {
  return instance.post(`/teams/${teamId}/members`, payload);
};

const removeTeamMembers = (teamId, payload) => {
  return instance.post(`/teams/${teamId}/members/remove`, payload);
};

export{
    getAllTeam,
    createTeam,
    updateTeam,
    deleteTeam,
    addTeamMembers,
    removeTeamMembers
}