const router = require('express').Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CleaningPhoto, Activity } = require('../models');
const { protect, adminOnly } = require('../middleware/auth');

cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // max 5 MB
router.use(protect);

// Send a file buffer to Cloudinary
const toCloud = (buffer) => new Promise((ok, fail) =>
  cloudinary.uploader.upload_stream({ folder: 'house-cleaning' }, (e, r) => (e ? fail(e) : ok(r))).end(buffer));

// POST /api/photos  (form-data: photo, activityId, takenAt = file.lastModified in ms)
router.post('/', upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Photo is required' });
  const activity = await Activity.findById(req.body.activityId);
  if (!activity) return res.status(404).json({ message: 'Activity not found' });

  // New photo = taken within the last 24 hours
  const takenAt = new Date(Number(req.body.takenAt) || 0);
  const isNew = Date.now() - takenAt.getTime() < 24 * 3600 * 1000;
  if (!isNew) return res.status(400).json({ message: 'Old photo. Please take a new photo.' });

  const r = await toCloud(req.file.buffer);
  const photo = await CleaningPhoto.create({ activity: activity._id, student: activity.assignedStudent, url: r.secure_url, publicId: r.public_id, takenAt, isNew });
  activity.photo = photo._id; activity.status = 'Completed';
  activity.cleaningDate = activity.completionDate = new Date();   // date is set automatically
  activity.history.push({ status: 'Completed', by: req.user.id });
  await activity.save();
  res.status(201).json(photo);
});

// GET /api/photos?student=ID&date=2026-11-26
router.get('/', async (req, res) => {
  const q = {};
  if (req.query.student) q.student = req.query.student;
  if (req.query.date) { const d = new Date(req.query.date); q.uploadedAt = { $gte: d, $lt: new Date(+d + 86400000) }; }
  res.json(await CleaningPhoto.find(q).populate('student', 'fullName').populate('activity', 'name').sort('-uploadedAt'));
});

// Admin reviews a photo: { review: "Approved" | "Rejected" }
router.put('/:id/review', adminOnly, async (req, res) => {
  const photo = await CleaningPhoto.findByIdAndUpdate(req.params.id, { review: req.body.review }, { new: true });
  if (req.body.review === 'Rejected')
    await Activity.findByIdAndUpdate(photo.activity, { status: 'Rejected', $push: { history: { status: 'Rejected', by: req.user.id } } });
  res.json(photo);
});
module.exports = router;
