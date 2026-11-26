const router = require('express').Router();
const { Activity } = require('../models');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/reports/monthly?year=2026&month=11
router.get('/monthly', protect, adminOnly, async (req, res) => {
  const year = Number(req.query.year), month = Number(req.query.month);
  const from = new Date(year, month - 1, 1), to = new Date(year, month, 1);
  const acts = await Activity.find({ dueDate: { $gte: from, $lt: to } }).populate('assignedStudent', 'fullName');
  const now = new Date(), perStudent = {};
  acts.forEach((a) => {
    const name = a.assignedStudent ? a.assignedStudent.fullName : 'Unassigned';
    const row = (perStudent[name] ||= { student: name, completed: 0, pending: 0, overdue: 0 });
    if (a.status === 'Completed') row.completed++;
    else if (a.dueDate < now) row.overdue++;
    else row.pending++;
  });
  res.json({ year, month, total: acts.length, students: Object.values(perStudent) });
});
module.exports = router;
