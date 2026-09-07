const request = require('supertest');
const app = require('../app');

const registerAndLogin = async () => {
  const user = {
    name: 'Owner',
    email: `owner${Date.now()}${Math.random()}@example.com`,
    password: 'password123',
  };
  const res = await request(app).post('/api/auth/register').send(user);
  return { token: res.body.token, id: res.body._id };
};

describe('Projects', () => {
  it('requires auth to list projects', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(401);
  });

  it('creates and lists a project for the owner', async () => {
    const { token } = await registerAndLogin();
    const createRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Project', description: 'desc' });
    expect(createRes.status).toBe(201);
    expect(createRes.body.name).toBe('Test Project');
    expect(createRes.body.members).toHaveLength(1);

    const listRes = await request(app).get('/api/projects').set('Authorization', `Bearer ${token}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveLength(1);
  });

  it('prevents a non-owner from updating a project', async () => {
    const owner = await registerAndLogin();
    const other = await registerAndLogin();

    const createRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Owner Project' });

    const updateRes = await request(app)
      .put(`/api/projects/${createRes.body._id}`)
      .set('Authorization', `Bearer ${other.token}`)
      .send({ name: 'Hacked' });

    expect(updateRes.status).toBe(403);
  });

  it('allows the owner to add and remove a member', async () => {
    const owner = await registerAndLogin();
    const member = await registerAndLogin();

    const createRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Team Project' });

    const addRes = await request(app)
      .post(`/api/projects/${createRes.body._id}/members`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ userId: member.id });
    expect(addRes.status).toBe(200);
    expect(addRes.body.members).toHaveLength(2);

    const removeRes = await request(app)
      .delete(`/api/projects/${createRes.body._id}/members/${member.id}`)
      .set('Authorization', `Bearer ${owner.token}`);
    expect(removeRes.status).toBe(200);
    expect(removeRes.body.members).toHaveLength(1);
  });

  it('lets the owner promote a member to admin, and only the owner can change roles', async () => {
    const owner = await registerAndLogin();
    const member = await registerAndLogin();
    const outsider = await registerAndLogin();

    const createRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Role Project' });

    await request(app)
      .post(`/api/projects/${createRes.body._id}/members`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ userId: member.id });

    const forbiddenRes = await request(app)
      .put(`/api/projects/${createRes.body._id}/members/${member.id}/role`)
      .set('Authorization', `Bearer ${outsider.token}`)
      .send({ role: 'admin' });
    expect(forbiddenRes.status).toBe(403);

    const roleRes = await request(app)
      .put(`/api/projects/${createRes.body._id}/members/${member.id}/role`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ role: 'admin' });
    expect(roleRes.status).toBe(200);
    const updatedMember = roleRes.body.members.find((m) => m._id === member.id);
    expect(updatedMember.role).toBe('admin');
  });

  it('prevents a plain member from adding other members', async () => {
    const owner = await registerAndLogin();
    const member = await registerAndLogin();
    const another = await registerAndLogin();

    const createRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Restricted Project' });

    await request(app)
      .post(`/api/projects/${createRes.body._id}/members`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ userId: member.id });

    const res = await request(app)
      .post(`/api/projects/${createRes.body._id}/members`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({ userId: another.id });
    expect(res.status).toBe(403);
  });

  it('records activity and returns it via the activity endpoint', async () => {
    const owner = await registerAndLogin();
    const createRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Activity Project' });

    const activityRes = await request(app)
      .get(`/api/projects/${createRes.body._id}/activity`)
      .set('Authorization', `Bearer ${owner.token}`);
    expect(activityRes.status).toBe(200);
    expect(activityRes.body.length).toBeGreaterThan(0);
    expect(activityRes.body[0].action).toBe('project_created');
  });

  it('deletes a project as the owner', async () => {
    const owner = await registerAndLogin();
    const createRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'To Delete' });

    const deleteRes = await request(app)
      .delete(`/api/projects/${createRes.body._id}`)
      .set('Authorization', `Bearer ${owner.token}`);
    expect(deleteRes.status).toBe(200);

    const getRes = await request(app)
      .get(`/api/projects/${createRes.body._id}`)
      .set('Authorization', `Bearer ${owner.token}`);
    expect(getRes.status).toBe(404);
  });
});
