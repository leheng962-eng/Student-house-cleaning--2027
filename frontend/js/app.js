/* ==========================================================
   Student House Cleaning System - Phase 1 & 2 (Frontend JS)
   Data is saved in localStorage for now.
   In Phase 3/4 we replace it with Express + MongoDB.
   ========================================================== */

// ---------- 1. DATA (load from browser storage) ----------
const load = (key) => JSON.parse(localStorage.getItem(key) || '[]');
const save = (key, data) => localStorage.setItem(key, JSON.stringify(data));
let students = load('students'); // {id,name,gender,age,major,phone,email,pic,date}
let tasks = load('tasks');       // {id,name,studentId,due,status,photo,doneDate}

const $ = (id) => document.getElementById(id); // short helper
const today = () => new Date().toISOString().slice(0, 10);

// Status is "Overdue" automatically when due date passed and not done
function statusOf(t) {
  if (t.status === 'Completed') return 'Completed';
  return t.due < today() ? 'Overdue' : 'Pending';
}
const studentName = (id) => (students.find((s) => s.id === id) || {}).name || 'Unknown';

// ---------- 2. NAVIGATION (click events) ----------
$('nav').addEventListener('click', (e) => {
  const btn = e.target.closest('.nav-btn');
  if (!btn) return;
  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
  document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
  btn.classList.add('active');
  $(btn.dataset.page).classList.add('active');
  renderAll();
});

// ---------- 3. FORM VALIDATION helper ----------
function showError(input, message) {
  // textContent is safe: it shows plain text only
  input.parentElement.querySelector('.err').textContent = message;
  return message === '';
}

// ---------- 4. REGISTER STUDENT ----------
let picData = ''; // profile picture as base64 text
$('sPic').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    picData = reader.result;
    $('sPicPreview').src = picData;          // photo preview
    $('sPicPreview').classList.remove('hidden');
  };
  reader.readAsDataURL(file);
});

$('studentForm').addEventListener('submit', (e) => {
  e.preventDefault(); // stop page reload
  const name = $('sName'), age = $('sAge'), major = $('sMajor'), phone = $('sPhone'), email = $('sEmail');
  const ok = [
    showError(name, name.value.trim().length < 3 ? 'Name needs at least 3 letters' : ''),
    showError(age, age.value < 15 || age.value > 60 ? 'Age must be 15-60' : ''),
    showError(major, major.value.trim() === '' ? 'Major is required' : ''),
    showError(phone, !/^[0-9+ ]{8,15}$/.test(phone.value) ? 'Phone must be 8-15 digits' : ''),
    showError(email, !/^\S+@\S+\.\S+$/.test(email.value) ? 'Enter a valid email' : ''),
  ].every(Boolean);
  if (!ok) return;

  students.push({
    id: 'STU' + String(students.length + 1).padStart(3, '0'),
    name: name.value.trim(), gender: $('sGender').value, age: Number(age.value),
    major: major.value.trim(), phone: phone.value, email: email.value,
    pic: picData, date: today(),
  });
  save('students', students);
  e.target.reset(); picData = ''; $('sPicPreview').classList.add('hidden');
  alert('Student saved!');
  renderAll();
});

// ---------- 5. STUDENT LIST (createElement, appendChild, remove) ----------
function renderStudents() {
  const box = $('studentCards');
  box.innerHTML = ''; // clear old cards
  const q = $('search').value.toLowerCase();
  students
    .filter((s) => (s.name + s.major).toLowerCase().includes(q))
    .forEach((s) => {
      const card = document.createElement('div');
      card.className = 'bg-white rounded-lg p-4 flex gap-3 items-center';

      const img = document.createElement('img');
      img.className = 'w-16 h-16 rounded-full object-cover bg-blue-200';
      img.src = s.pic || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
      img.alt = s.name;

      const info = document.createElement('div');
      info.className = 'flex-1';
      info.innerHTML = `<b></b><p class="text-sm text-slate-500"></p>`;
      info.querySelector('b').textContent = s.name;
      info.querySelector('p').textContent = `${s.id} · ${s.major} · ${s.phone}`;

      const del = document.createElement('button');
      del.className = 'text-red-600 text-sm';
      del.textContent = 'Delete';
      del.addEventListener('click', () => {
        if (!confirm('Delete ' + s.name + '?')) return;
        students = students.filter((x) => x.id !== s.id);
        save('students', students);
        card.remove(); // remove from the page
        renderAll();
      });

      card.appendChild(img); card.appendChild(info); card.appendChild(del);
      box.appendChild(card);
    });
  if (!box.children.length) box.textContent = 'No students found. Register one first.';
}
$('search').addEventListener('input', renderStudents); // input event

// ---------- 6. SCHEDULE ----------
$('taskForm').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!showError($('tDate'), $('tDate').value ? '' : 'Choose a due date')) return;
  if (!$('tStudent').value) return alert('Register a student first.');
  tasks.push({
    id: 'ACT' + String(tasks.length + 1).padStart(3, '0'),
    name: $('tName').value, studentId: $('tStudent').value,
    due: $('tDate').value, status: 'Pending', photo: '', doneDate: '',
  });
  save('tasks', tasks);
  e.target.reset();
  renderAll();
});

function renderTasks() {
  $('tStudent').innerHTML = students.map((s) => `<option value="${s.id}">${s.name}</option>`).join('');
  const body = $('taskRows');
  body.innerHTML = '';
  tasks.forEach((t) => {
    const st = statusOf(t);
    const color = { Completed: 'text-green-600', Pending: 'text-blue-600', Overdue: 'text-red-600' }[st];
    const tr = document.createElement('tr');
    tr.className = 'border-t';
    tr.innerHTML = `<td class="p-3"></td><td class="p-3"></td><td class="p-3"></td>
      <td class="p-3 font-medium ${color}">${st}</td><td class="p-3"><button class="text-red-600 text-sm">Delete</button></td>`;
    const cells = tr.querySelectorAll('td');
    cells[0].textContent = t.name;
    cells[1].textContent = studentName(t.studentId);
    cells[2].textContent = t.due;
    tr.querySelector('button').addEventListener('click', () => {
      tasks = tasks.filter((x) => x.id !== t.id);
      save('tasks', tasks); renderAll();
    });
    body.appendChild(tr);
  });
}

// ---------- 7. PHOTO UPLOAD (new photo or old photo?) ----------
let currentPhoto = '', photoIsNew = false;
$('pFile').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  // file.lastModified = when the photo was taken/saved. Same day = NEW photo.
  const takenDay = new Date(file.lastModified).toISOString().slice(0, 10);
  photoIsNew = takenDay === today();
  const msg = $('pMsg');
  msg.textContent = photoIsNew
    ? 'New photo detected. You can submit it.'
    : 'Old photo detected (taken on ' + takenDay + '). Please take a new photo.';
  msg.className = 'mt-3 font-medium ' + (photoIsNew ? 'text-green-600' : 'text-red-600');

  const reader = new FileReader();
  reader.onload = () => {
    currentPhoto = reader.result;
    $('pPreview').src = currentPhoto;
    $('pPreview').classList.remove('hidden');
  };
  reader.readAsDataURL(file);
});

$('pSubmit').addEventListener('click', () => {
  const task = tasks.find((t) => t.id === $('pTask').value);
  if (!task) return alert('No task selected.');
  if (!currentPhoto) return alert('Choose a photo first.');
  if (!photoIsNew) return alert('Old photos are not accepted. Take a new photo.');
  task.photo = currentPhoto; task.status = 'Completed'; task.doneDate = today(); // date set automatically
  save('tasks', tasks);
  currentPhoto = ''; $('pFile').value = ''; $('pPreview').classList.add('hidden'); $('pMsg').textContent = '';
  renderAll();
});

function renderPhotos() {
  // Only unfinished tasks can receive a photo
  $('pTask').innerHTML = tasks.filter((t) => t.status !== 'Completed')
    .map((t) => `<option value="${t.id}">${t.name} - ${studentName(t.studentId)}</option>`).join('');
  const g = $('gallery');
  g.innerHTML = '';
  tasks.filter((t) => t.photo).forEach((t) => {
    const fig = document.createElement('figure');
    fig.className = 'bg-white rounded p-2';
    fig.innerHTML = `<img class="rounded h-32 w-full object-cover"><figcaption class="text-xs mt-1"></figcaption>`;
    fig.querySelector('img').src = t.photo;
    fig.querySelector('figcaption').textContent = `${studentName(t.studentId)} · ${t.doneDate}`;
    g.appendChild(fig);
  });
}

// ---------- 8. MONTHLY REPORT & DASHBOARD ----------
$('month').value = today().slice(0, 7);
$('month').addEventListener('input', renderReport);

function renderReport() {
  const m = $('month').value; // e.g. "2026-11"
  const body = $('reportRows');
  body.innerHTML = '';
  students.forEach((s) => {
    const mine = tasks.filter((t) => t.studentId === s.id && t.due.startsWith(m));
    const count = (st) => mine.filter((t) => statusOf(t) === st).length;
    const tr = document.createElement('tr');
    tr.className = 'border-t';
    tr.innerHTML = `<td class="p-3"></td><td class="p-3">${count('Completed')}</td><td class="p-3">${count('Pending')}</td><td class="p-3">${count('Overdue')}</td>`;
    tr.firstChild.textContent = s.name;
    body.appendChild(tr);
  });
}

function renderDashboard() {
  const n = (st) => tasks.filter((t) => statusOf(t) === st).length;
  const items = [['Students', students.length], ['Total activities', tasks.length],
                 ['Completed', n('Completed')], ['Overdue', n('Overdue')]];
  $('stats').innerHTML = '';
  items.forEach(([label, value]) => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg p-4 border-l-4 border-blue-600';
    card.innerHTML = `<p class="text-3xl font-bold text-blue-700">${value}</p><p class="text-slate-500"></p>`;
    card.querySelector('p:last-child').textContent = label;
    $('stats').appendChild(card);
  });
}

function renderAll() { renderDashboard(); renderStudents(); renderTasks(); renderPhotos(); renderReport(); }
renderAll();
