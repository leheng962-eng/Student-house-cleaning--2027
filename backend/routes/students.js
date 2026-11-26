const router = require('express').Router();
const { Student } = require('../models');
const { protect, adminOnly } = require('../middleware/auth');
router.use(protect);

// GET /api/students?search=anna
router.get('/', async (req, res) => {
  const q = req.query.search ? { $or: [{ fullName: new RegExp(req.query.search, 'i') }, { major: new RegExp(req.query.search, 'i') }] } : {};
  res.json(await Student.find(q).sort('studentId'));
});
router.get('/:id', async (req, res) => res.json(await Student.findById(req.params.id)));

router.post('/', adminOnly, async (req, res) => {
  const count = await Student.countDocuments();
  const student = await Student.create({ ...req.body, studentId: 'STU' + String(count + 1).padStart(3, '0') });
  res.status(201).json(student);
});
router.put('/:id', adminOnly, async (req, res) =>
  res.json(await Student.findByIdAndUpdate(req.params.id, req.body, { new: true })));
router.delete('/:id', adminOnly, async (req, res) => {
  await Student.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});
module.exports = router;
