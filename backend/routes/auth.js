const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// POST /api/auth/register  (first user becomes admin)
router.post('/register', async (req, res) => {
  const { username, password, studentId } = req.body;
  if (!username || !password || password.length < 6)
    return res.status(400).json({ message: 'Username and password (6+ chars) required' });
  if (await User.findOne({ username })) return res.status(400).json({ message: 'Username taken' });
  const role = (await User.countDocuments()) === 0 ? 'admin' : 'student';
  const user = await User.create({ username, password: await bcrypt.hash(password, 10), role, student: studentId });
  res.status(201).json({ id: user._id, role });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  if (!user || !(await bcrypt.compare(req.body.password || '', user.password)))
    return res.status(401).json({ message: 'Wrong username or password' });
  const token = jwt.sign({ id: user._id, role: user.role, student: user.student }, process.env.JWT_SECRET, { expiresIn: '1d' });
  res.json({ token, role: user.role });
});
module.exports = router;
