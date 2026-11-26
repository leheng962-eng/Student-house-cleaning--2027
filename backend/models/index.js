// All 7 MongoDB collections. "ref" links documents using ObjectId.
const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const id = (ref) => ({ type: Schema.Types.ObjectId, ref });

const Student = model('Student', new Schema({
  studentId: { type: String, unique: true },
  fullName: { type: String, required: true },
  gender: { type: String, enum: ['Female', 'Male'] },
  age: Number, major: String, phone: String, email: String,
  profilePicture: String,
  registrationDate: { type: Date, default: Date.now },
}));

const User = model('User', new Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },          // stored hashed
  role: { type: String, enum: ['admin', 'student'], default: 'student' },
  student: id('Student'),                              // link student login -> student
}));

const Activity = model('Activity', new Schema({
  name: { type: String, required: true },
  location: String, description: String,
  assignedStudent: id('Student'),
  cleaningDate: Date,                                  // set automatically when photo uploaded
  startTime: String, endTime: String, dueDate: Date,
  status: { type: String, enum: ['Pending', 'Completed', 'Overdue', 'Rejected'], default: 'Pending' },
  photo: id('CleaningPhoto'),
  completionDate: Date,
  history: [{ status: String, by: id('User'), at: { type: Date, default: Date.now } }], // activity history
}));

const Schedule = model('Schedule', new Schema({
  type: { type: String, enum: ['daily', 'weekly'], default: 'daily' },
  date: { type: Date, required: true },
  activity: id('Activity'), student: id('Student'),
}));

const Registration = model('Registration', new Schema({
  activity: id('Activity'), student: id('Student'),
  registeredAt: { type: Date, default: Date.now },
}));

const CleaningPhoto = model('CleaningPhoto', new Schema({
  activity: id('Activity'), student: id('Student'),
  url: String, publicId: String, takenAt: Date,
  uploadedAt: { type: Date, default: Date.now },
  isNew: Boolean,                                      // new photo or old photo
  review: { type: String, enum: ['Waiting', 'Approved', 'Rejected'], default: 'Waiting' },
}));

const Attendance = model('Attendance', new Schema({
  student: id('Student'), activity: id('Activity'), date: { type: Date, default: Date.now },
  present: { type: Boolean, default: true },
}));

module.exports = { Student, User, Activity, Schedule, Registration, CleaningPhoto, Attendance };
