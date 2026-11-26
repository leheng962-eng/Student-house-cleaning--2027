const router = require('express').Router();
const { Activity, Schedule, Registration, Attendance } = require('../models');
const { protect, adminOnly } = require('../middleware/auth');
router.use(protect);

// GET /api/activities  (students see only their own)
router.get('/', async (req, res) => {
  const q = req.user.role === 'admin' ? {} : { assignedStudent: req.user.student };
  if (req.query.student) q.assignedStudent = req.query.student;
  const list = await Activity.find(q).populate('assignedStudent', 'fullName studentId').populate('photo').sort('-dueDate');
  const now = new Date();
  // mark overdue automatically
  list.forEach((a) => { if (a.status === 'Pending' && a.dueDate < now) a.status = 'Overdue'; });
  res.json(list);
});

// Admin creates an activity and (optionally) a schedule entry
router.post('/', adminOnly, async (req, res) => {
  const a = await Activity.create({ ...req.body, history: [{ status: 'Pending', by: req.user.id }] });
  if (a.assignedStudent && a.dueDate)
    await Schedule.create({ type: req.body.scheduleType || 'daily', date: a.dueDate, activity: a._id, student: a.assignedStudent });
  res.status(201).json(a);
});
router.put('/:id', adminOnly, async (req, res) => res.json(await Activity.findByIdAndUpdate(req.params.id, req.body, { new: true })));
router.delete('/:id', adminOnly, async (req, res) => {
  await Activity.findByIdAndDelete(req.params.id);
  await Schedule.deleteMany({ activity: req.params.id });
  res.json({ message: 'Deleted' });
});

// Student registers for an activity
router.post('/:id/register', async (req, res) => {
  const student = req.user.student || req.body.student;
  res.status(201).json(await Registration.create({ activity: req.params.id, student }));
});

// Schedules (calendar data): GET /api/activities/schedules/list?from=2026-11-01&to=2026-11-30
router.get('/schedules/list', async (req, res) => {
  const { from, to } = req.query;
  const q = from && to ? { date: { $gte: new Date(from), $lte: new Date(to) } } : {};
  res.json(await Schedule.find(q).populate('activity').populate('student', 'fullName'));
});

// Attendance
router.post('/:id/attendance', adminOnly, async (req, res) =>
  res.status(201).json(await Attendance.create({ activity: req.params.id, student: req.body.student, present: req.body.present })));

// Activity history for one activity
router.get('/:id/history', async (req, res) => res.json((await Activity.findById(req.params.id).populate('history.by', 'username')).history));

// Offer another activity if someone did not clean (admin)
router.post('/:id/reassign', adminOnly, async (req, res) => {
  const old = await Activity.findById(req.params.id);
  const extra = await Activity.create({ name: req.body.name || 'Take Out Trash', location: old.location, assignedStudent: old.assignedStudent,
    dueDate: new Date(Date.now() + 86400000), history: [{ status: 'Pending', by: req.user.id }] });
  res.status(201).json(extra);
});
module.exports = router;
