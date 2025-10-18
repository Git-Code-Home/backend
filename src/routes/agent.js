const express = require('express');
const router = express.Router();

// Dummy in-memory agent list (replace with DB in production)
let agents = [
  { _id: '1', name: 'Agent One', email: 'agent1@email.com', phone: '1234567890', status: 'Active' },
  { _id: '2', name: 'Agent Two', email: 'agent2@email.com', phone: '9876543210', status: 'Inactive' }
];

// GET /api/agent/list - List all agents
router.get('/list', (req, res) => {
  res.json(agents);
});

// POST /api/agent/add - Add a new agent
router.post('/add', (req, res) => {
  const { name, email, phone, status } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }
  const newAgent = {
    _id: String(Date.now()),
    name,
    email,
    phone: phone || '',
    status: status || 'Active'
  };
  agents.push(newAgent);
  res.status(201).json(newAgent);
}); 

module.exports = router;