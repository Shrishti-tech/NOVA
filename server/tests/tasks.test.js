const request = require('supertest');
const app = require('../app');

const registerAndLogin = async () => {
  const user = {
    name: 'User',
    email: `user${Date.now()}${Math.random()}@example.com`,
    password: 'password123',
  };
  const res = await request(app).post('/api/auth/register').send(user);
  return { token: res.body.token, id: res.body._id };
};

const createProject = async (token) => {
  const res = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Project for tasks' });
  return res.body;
};

describe('Tasks', () => {
  it('creates a task under a project and lists it', async () => {
    const { token } = await registerAndLogin();
    const project = await createProject(token);

    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Do the thing', project: project._id, priority: 'high' });
    expect(createRes.status).toBe(201);
    expect(createRes.body.status).toBe('todo');
    expect(createRes.body.priority).toBe('high');

    const listRes = await request(app)
      .get(`/api/tasks/project/${project._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveLength(1);
  });

  it('rejects task creation without a project', async () => {
    const { token } = await registerAndLogin();
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Orphan task' });
    expect(res.status).toBe(400);
  });

  it('updates a task status', async () => {
    const { token } = await registerAndLogin();
    const project = await createProject(token);
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Task', project: project._id });

    const updateRes = await request(app)
      .put(`/api/tasks/${createRes.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'done' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.status).toBe('done');
  });

  it('deletes a task', async () => {
    const { token } = await registerAndLogin();
    const project = await createProject(token);
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Task to delete', project: project._id });

    const deleteRes = await request(app)
      .delete(`/api/tasks/${createRes.body._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteRes.status).toBe(200);
  });

  it('updates a task checklist', async () => {
    const { token } = await registerAndLogin();
    const project = await createProject(token);
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Task with checklist', project: project._id });

    const updateRes = await request(app)
      .put(`/api/tasks/${createRes.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ checklist: [{ text: 'Step one', done: false }, { text: 'Step two', done: true }] });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.checklist).toHaveLength(2);
    expect(updateRes.body.checklist[1].done).toBe(true);
  });

  it('returns only tasks assigned to the current user across projects', async () => {
    const { token, id: userId } = await registerAndLogin();
    const other = await registerAndLogin();
    const project = await createProject(token);

    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Assigned to me', project: project._id, assignedTo: userId });

    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Assigned to someone else', project: project._id, assignedTo: other.id });

    const mineRes = await request(app).get('/api/tasks/mine').set('Authorization', `Bearer ${token}`);
    expect(mineRes.status).toBe(200);
    expect(mineRes.body).toHaveLength(1);
    expect(mineRes.body[0].title).toBe('Assigned to me');
    expect(mineRes.body[0].project.name).toBe('Project for tasks');
  });

  it('prevents a plain member from creating a task', async () => {
    const owner = await registerAndLogin();
    const member = await registerAndLogin();
    const project = await createProject(owner.token);

    await request(app)
      .post(`/api/projects/${project._id}/members`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ userId: member.id });

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${member.token}`)
      .send({ title: 'Not allowed', project: project._id });
    expect(res.status).toBe(403);
  });

  it('lets a plain member update the status of a task assigned to them, but not reassign it', async () => {
    const owner = await registerAndLogin();
    const member = await registerAndLogin();
    const project = await createProject(owner.token);

    await request(app)
      .post(`/api/projects/${project._id}/members`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ userId: member.id });

    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ title: 'Assigned task', project: project._id, assignedTo: member.id });

    const statusRes = await request(app)
      .put(`/api/tasks/${createRes.body._id}`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({ status: 'in-progress' });
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.status).toBe('in-progress');

    const reassignRes = await request(app)
      .put(`/api/tasks/${createRes.body._id}`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({ title: 'Hacked title' });
    expect(reassignRes.status).toBe(200);
    expect(reassignRes.body.title).toBe('Assigned task');
  });

  it('adds a comment to a task and notifies the assignee', async () => {
    const owner = await registerAndLogin();
    const member = await registerAndLogin();
    const project = await createProject(owner.token);

    await request(app)
      .post(`/api/projects/${project._id}/members`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ userId: member.id });

    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ title: 'Task with comments', project: project._id, assignedTo: member.id });

    const commentRes = await request(app)
      .post(`/api/tasks/${createRes.body._id}/comments`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ text: 'Please check this out' });
    expect(commentRes.status).toBe(200);
    expect(commentRes.body.comments).toHaveLength(1);
    expect(commentRes.body.comments[0].text).toBe('Please check this out');

    const notifRes = await request(app).get('/api/notifications').set('Authorization', `Bearer ${member.token}`);
    expect(notifRes.status).toBe(200);
    expect(notifRes.body.some((n) => n.type === 'comment_added')).toBe(true);
  });
});
