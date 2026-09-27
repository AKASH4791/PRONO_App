const defaultTransactions = [
  { id: 1, name: 'Groceries', category: 'food', amount: 42.80, date: '2026-09-18', icon: '▥' },
  { id: 2, name: 'Metro pass', category: 'transport', amount: 25.00, date: '2026-09-17', icon: '⇄' },
  { id: 3, name: 'Textbook rental', category: 'study', amount: 68.50, date: '2026-09-16', icon: '▤' },
  { id: 4, name: 'Matcha latte', category: 'food', amount: 6.75, date: '2026-09-15', icon: '◒' },
  { id: 5, name: 'Movie night', category: 'fun', amount: 15.00, date: '2026-09-13', icon: '✦' }
];
const defaultBudgets = [
  { key: 'food', label: 'Food & coffee', limit: 300, color: 'orange' },
  { key: 'transport', label: 'Transport', limit: 150, color: 'safe' },
  { key: 'study', label: 'Study stuff', limit: 250, color: 'warning' },
  { key: 'fun', label: 'Fun money', limit: 180, color: 'safe' }
];
const categoryStyles = { food: ['Food & coffee', 'orange'], transport: ['Transport', 'yellow'], study: ['Study stuff', 'blue'], fun: ['Fun', 'green'], bills: ['Bills', 'pink'] };
const storedProfile = JSON.parse(localStorage.getItem('prono-profile') || 'null');
let profile = storedProfile;
let auth = JSON.parse(localStorage.getItem('prono-auth') || 'null');
let goal = Number(localStorage.getItem('prono-goal') || 600);
let marks = JSON.parse(localStorage.getItem('prono-marks') || '[]');
let currency = localStorage.getItem('prono-currency') || 'USD';
let transactions = JSON.parse(localStorage.getItem('prono-transactions') || 'null') || defaultTransactions;
let budgets = JSON.parse(localStorage.getItem('prono-budgets') || 'null') || defaultBudgets;
let activeFilter = 'all';
const currencyConfig = { USD: { symbol: '$', locale: 'en-US' }, INR: { symbol: '₹', locale: 'en-IN' } };
const money = value => `${currencyConfig[currency].symbol}${Number(value).toLocaleString(currencyConfig[currency].locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const shortMoney = value => `${currencyConfig[currency].symbol}${Math.round(value).toLocaleString(currencyConfig[currency].locale)}`;
const save = () => { localStorage.setItem('prono-profile', JSON.stringify(profile)); localStorage.setItem('prono-transactions', JSON.stringify(transactions)); localStorage.setItem('prono-budgets', JSON.stringify(budgets)); };
const categoryTotal = key => transactions.filter(item => item.category === key).reduce((sum, item) => sum + item.amount, 0);
function renderTransactions() {
  const list = document.querySelector('#transactions-list');
  const filtered = transactions.filter(item => activeFilter === 'all' || item.category === activeFilter).slice(0, 5);
  if (!filtered.length) { list.innerHTML = '<div class="empty-state">No expenses in this category yet.</div>'; return; }
  list.innerHTML = filtered.map(item => {
    const style = categoryStyles[item.category] || ['Other', 'pink'];
    const date = new Date(`${item.date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `<div class="transaction"><div class="transaction-icon ${style[1]}" style="background: color-mix(in srgb, var(--${style[1] === 'orange' ? 'orange' : style[1] === 'yellow' ? 'yellow' : style[1] === 'blue' ? 'blue' : style[1] === 'green' ? 'mint' : 'pink'}) 20%, transparent)">${item.icon || '•'}</div><div class="transaction-info"><span class="transaction-name">${item.name}</span><span class="transaction-meta">${style[0]} · ${date}</span></div><span class="transaction-amount">-${money(item.amount)}</span></div>`;
  }).join('');
}
function renderSummary() {
  const spent = transactions.reduce((sum, item) => sum + item.amount, 0);
  const budget = budgets.reduce((sum, item) => sum + item.limit, 0);
  const startingBalance = profile ? profile.balance : 2029.5;
  const monthlyBudget = profile ? profile.budget : budget;
  document.querySelector('#spent-total').textContent = money(spent);
  document.querySelector('#available-balance').textContent = money(Math.max(0, startingBalance - spent));
  document.querySelector('#savings-total').textContent = money(Math.max(0, monthlyBudget - spent));
  document.querySelector('#summary-goal').textContent = money(goal);
  document.querySelector('#donut-total').textContent = shortMoney(spent);
  document.querySelector('#budget-total-label').textContent = shortMoney(profile ? profile.budget : budget);
  document.querySelector('#spent-progress').style.width = `${Math.min(100, (spent / monthlyBudget) * 100)}%`;
  document.querySelector('#savings-progress').style.width = `${Math.min(100, ((monthlyBudget - spent) / monthlyBudget) * 100)}%`;
}
function renderLegend() {
  const totals = Object.entries(categoryStyles).map(([key, [label, color]]) => ({ key, label, color, total: categoryTotal(key) })).filter(item => item.total > 0);
  const max = totals.reduce((sum, item) => sum + item.total, 0) || 1;
  document.querySelector('#category-legend').innerHTML = totals.map(item => `<div class="legend-item"><span><i class="legend-dot ${item.color}"></i>${item.label}</span><strong>${Math.round(item.total / max * 100)}%</strong></div>`).join('');
  const first = totals[0] ? totals[0].total / max * 100 : 42;
  document.querySelector('#donut-chart').style.setProperty('--first', `${first}%`);
}
function renderBudgets() {
  document.querySelector('#budget-list').innerHTML = budgets.map(item => { const spent = categoryTotal(item.key); const percent = Math.min(100, spent / item.limit * 100); return `<div class="budget-item"><div class="budget-label"><span>${item.label}</span><span>${money(spent)} / ${money(item.limit)}</span></div><div class="budget-track"><span class="${item.color}" style="width:${percent}%"></span></div></div>`; }).join('');
}
function renderGoal() {
  const spent = transactions.reduce((sum, item) => sum + item.amount, 0);
  const saved = Math.max(0, (profile ? profile.budget : goal) - spent);
  const highest = Object.entries(categoryStyles).map(([key, [label]]) => ({ label, total: categoryTotal(key) })).sort((a, b) => b.total - a.total)[0];
  document.querySelector('#goal-saved').textContent = shortMoney(saved);
  document.querySelector('#goal-target').textContent = money(goal);
  document.querySelector('#goal-progress').style.width = `${Math.min(100, saved / goal * 100)}%`;
  document.querySelector('#goal-suggestion').textContent = highest && highest.total ? `Try setting aside $${Math.max(1, Math.round(highest.total * 0.1))} next week by trimming ${highest.label.toLowerCase()}.` : 'Add your first expense to get a personal suggestion.';
}
function gradeFor(percent) { return percent >= 90 ? 'A+' : percent >= 80 ? 'A' : percent >= 70 ? 'B' : percent >= 60 ? 'C' : percent >= 50 ? 'D' : 'F'; }
function renderMarks() {
  const percentages = marks.map(item => item.mark / item.total * 100);
  const average = percentages.length ? percentages.reduce((sum, value) => sum + value, 0) / percentages.length : 0;
  document.querySelector('#marks-empty').style.display = marks.length ? 'none' : 'block';
  document.querySelector('#average-score').textContent = `${Math.round(average)}%`;
  document.querySelector('#average-grade').textContent = marks.length ? gradeFor(average) : '-';
  document.querySelector('#performance-note').textContent = marks.length ? (average >= 70 ? 'You are building strong academic momentum.' : 'Keep going. A little consistency can move this average.') : 'Add your marks to see how you are doing.';
  document.querySelector('#marks-list').innerHTML = marks.map((item, index) => { const percent = item.mark / item.total * 100; return `<tr><td><strong>${item.subject}</strong></td><td>${item.mark} / ${item.total}</td><td>${Math.round(percent)}%</td><td>${gradeFor(percent)}</td><td><button type="button" data-remove-mark="${index}" aria-label="Remove ${item.subject}">×</button></td></tr>`; }).join('');
  const max = Math.max(...percentages, 1);
  document.querySelector('#marks-chart').innerHTML = marks.map(item => { const percent = item.mark / item.total * 100; return `<div class="mark-bar-wrap"><div class="mark-bar" style="--height:${percent / max * 90}%" title="${Math.round(percent)}%"></div><span class="mark-bar-label">${item.subject}</span></div>`; }).join('');
  document.querySelectorAll('[data-remove-mark]').forEach(button => button.addEventListener('click', () => { marks.splice(Number(button.dataset.removeMark), 1); localStorage.setItem('prono-marks', JSON.stringify(marks)); renderMarks(); }));
}
function renderBars() {
  const endDate = new Date();
  const dates = Array.from({ length: 7 }, (_, index) => { const date = new Date(endDate); date.setDate(endDate.getDate() - (6 - index)); return date; });
  const days = dates.map(date => date.toLocaleDateString('en-US', { weekday: 'narrow' }));
  const amounts = dates.map(date => transactions.filter(item => item.date === date.toISOString().slice(0, 10)).reduce((sum, item) => sum + item.amount, 0));
  const max = Math.max(...amounts, 1);
  document.querySelector('#bar-chart').innerHTML = days.map((day, index) => `<div class="bar-wrap"><div class="bar ${index === 6 ? 'today' : ''}" style="--height:${amounts[index] / max * 75}%" data-amount="$${amounts[index]}"></div><span class="bar-label">${day}</span></div>`).join('');
  document.querySelector('#week-total').firstChild.textContent = money(amounts.reduce((a, b) => a + b, 0)) + ' ';
}
function render() { renderSummary(); renderTransactions(); renderLegend(); renderBudgets(); renderGoal(); renderMarks(); renderBars(); }
function renderProfile() {
  const name = profile ? profile.name : 'Create account';
  const firstName = profile ? profile.name.trim().split(/\s+/)[0] : 'there';
  const initials = profile ? profile.name.trim().split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase() : 'P';
  document.querySelector('#profile-name').textContent = name;
  document.querySelector('#profile-label').textContent = profile ? profile.email : 'Set up your student account';
  document.querySelector('#profile-avatar').textContent = initials;
  if (profile && profile.photo) document.querySelector('#profile-avatar').innerHTML = `<img src="${profile.photo}" alt="${name} profile photo">`;
  const greetingName = document.querySelector('#greeting-name');
  if (greetingName) greetingName.textContent = firstName;
}
function setView(view) {
  const main = document.querySelector('.main-content');
  main.dataset.view = view;
  const titles = { overview: `Good morning, <span id="greeting-name">${profile ? profile.name.trim().split(/\s+/)[0] : 'there'}</span> <span class="wave">✳</span>`, transactions: 'Your transactions', budgets: 'Your budgets', performance: 'Your education performance' };
  document.querySelector('#page-title').innerHTML = titles[view];
  document.querySelectorAll('.nav-link').forEach(link => link.classList.toggle('active', link.dataset.view === view));
  if (view === 'transactions') document.querySelector('#activity').scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (view === 'budgets') document.querySelector('#budgets').scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (view === 'performance') document.querySelector('#performance').scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (view === 'overview') window.scrollTo({ top: 0, behavior: 'smooth' });
}
const modal = document.querySelector('#modal-backdrop');
const accountModal = document.querySelector('#account-backdrop');
const goalModal = document.querySelector('#goal-backdrop');
const markModal = document.querySelector('#mark-backdrop');
function openModal() { modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); modal.querySelector('input').focus(); }
function closeModal() { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); }
function openAccount() {
  const form = document.querySelector('#account-form');
  form.closest('.modal').classList.toggle('existing', Boolean(profile));
  if (profile) {
    form.elements.name.value = profile.name;
    form.elements.email.value = profile.email;
    form.elements.balance.value = profile.balance;
    form.elements.budget.value = profile.budget;
    document.querySelector('#account-title').textContent = 'Edit your profile';
    document.querySelector('#account-form button[type="submit"]').firstChild.textContent = 'Save profile ';
  }
  accountModal.classList.add('open'); accountModal.setAttribute('aria-hidden', 'false'); form.querySelector('input').focus();
}
function closeAccount() { accountModal.classList.remove('open'); accountModal.setAttribute('aria-hidden', 'true'); }
function openGoal() { document.querySelector('#goal-form input').value = goal; goalModal.classList.add('open'); goalModal.setAttribute('aria-hidden', 'false'); document.querySelector('#goal-form input').focus(); }
function closeGoal() { goalModal.classList.remove('open'); goalModal.setAttribute('aria-hidden', 'true'); }
function openMark() { markModal.classList.add('open'); markModal.setAttribute('aria-hidden', 'false'); document.querySelector('#mark-form input').focus(); }
function closeMark() { markModal.classList.remove('open'); markModal.setAttribute('aria-hidden', 'true'); }
document.querySelector('#open-modal').addEventListener('click', openModal);
document.querySelector('#currency-select').value = currency;
document.querySelector('#currency-select').addEventListener('change', event => { currency = event.target.value; localStorage.setItem('prono-currency', currency); render(); });
document.querySelector('#close-modal').addEventListener('click', closeModal);
document.querySelector('#profile-button').addEventListener('click', openAccount);
document.querySelector('#close-account').addEventListener('click', closeAccount);
document.querySelectorAll('.nav-link').forEach(link => link.addEventListener('click', event => { event.preventDefault(); setView(link.dataset.view); }));
modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
accountModal.addEventListener('click', event => { if (event.target === accountModal) closeAccount(); });
goalModal.addEventListener('click', event => { if (event.target === goalModal) closeGoal(); });
markModal.addEventListener('click', event => { if (event.target === markModal) closeMark(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') { closeModal(); closeAccount(); closeGoal(); closeMark(); } });
document.querySelector('#expense-form').addEventListener('submit', event => { event.preventDefault(); const data = new FormData(event.target); const category = data.get('category'); transactions.unshift({ id: Date.now(), name: data.get('name'), amount: Number(data.get('amount')), category, date: data.get('date'), icon: category === 'food' ? '▥' : category === 'transport' ? '⇄' : category === 'study' ? '▤' : '✦' }); save(); render(); event.target.reset(); closeModal(); });
document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => { document.querySelector('.filter.active').classList.remove('active'); button.classList.add('active'); activeFilter = button.dataset.filter; renderTransactions(); }));
document.querySelector('#view-all').addEventListener('click', () => { activeFilter = 'all'; document.querySelectorAll('.filter').forEach(button => button.classList.toggle('active', button.dataset.filter === 'all')); document.querySelector('#transactions-list').scrollIntoView({ behavior: 'smooth', block: 'center' }); });
document.querySelector('#new-budget').addEventListener('click', () => { const label = prompt('Name your new budget category'); if (!label) return; const limit = Number(prompt(`Monthly limit for ${label}`, '100')); if (!limit) return; budgets.push({ key: label.toLowerCase().replace(/\s+/g, '-'), label, limit, color: 'safe' }); save(); render(); });
document.querySelector('#edit-budget').addEventListener('click', () => { const limit = Number(prompt('Set your total monthly budget', budgets.reduce((sum, item) => sum + item.limit, 0))); if (!limit) return; const current = budgets.reduce((sum, item) => sum + item.limit, 0); if (current) budgets = budgets.map(item => ({ ...item, limit: Math.round(item.limit * limit / current) })); save(); render(); });
document.querySelector('#set-goal').addEventListener('click', openGoal);
document.querySelector('#edit-goal').addEventListener('click', openGoal);
document.querySelector('#close-goal').addEventListener('click', closeGoal);
document.querySelector('#goal-form').addEventListener('submit', event => { event.preventDefault(); goal = Number(new FormData(event.target).get('target')); localStorage.setItem('prono-goal', String(goal)); renderGoal(); closeGoal(); });
document.querySelector('#add-mark').addEventListener('click', openMark);
document.querySelector('#close-mark').addEventListener('click', closeMark);
document.querySelector('#mark-form').addEventListener('submit', event => { event.preventDefault(); const data = new FormData(event.target); marks.unshift({ subject: data.get('subject'), mark: Number(data.get('mark')), total: Number(data.get('total')) }); localStorage.setItem('prono-marks', JSON.stringify(marks)); renderMarks(); event.target.reset(); closeMark(); });
document.querySelector('#account-form').addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.target);
  const photoFile = data.get('photo');
  profile = { name: data.get('name'), email: data.get('email'), balance: Number(data.get('balance')), budget: Number(data.get('budget')), photo: profile ? profile.photo : '' };
  auth = { email: profile.email, password: data.get('password') };
  transactions = [];
  budgets = [
    { key: 'food', label: 'Food & coffee', limit: Math.round(profile.budget * 0.34), color: 'orange' },
    { key: 'transport', label: 'Transport', limit: Math.round(profile.budget * 0.17), color: 'safe' },
    { key: 'study', label: 'Study stuff', limit: Math.round(profile.budget * 0.28), color: 'warning' },
    { key: 'fun', label: 'Fun money', limit: Math.round(profile.budget * 0.21), color: 'safe' }
  ];
  const finishAccount = () => { save(); localStorage.setItem('prono-auth', JSON.stringify(auth)); sessionStorage.setItem('prono-logged-in', 'true'); renderProfile(); render(); closeAccount(); closeLogin(); };
  if (photoFile && photoFile.size) { const reader = new FileReader(); reader.onload = () => { profile.photo = reader.result; finishAccount(); }; reader.readAsDataURL(photoFile); } else finishAccount();
});
const today = new Date().toISOString().slice(0, 10); document.querySelector('input[name="date"]').value = today;
renderProfile(); render();
const loginScreen = document.querySelector('#login-screen');
function openLogin() { loginScreen.classList.add('open'); loginScreen.setAttribute('aria-hidden', 'false'); document.querySelector('#login-form input').focus(); }
function closeLogin() { loginScreen.classList.remove('open'); loginScreen.setAttribute('aria-hidden', 'true'); }
document.querySelector('#login-create').addEventListener('click', () => { closeLogin(); openAccount(); });
document.querySelector('#login-form').addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.target);
  const email = data.get('email').trim().toLowerCase();
  const password = data.get('password');
  const valid = auth ? auth.email.toLowerCase() === email && auth.password === password : profile && profile.email.toLowerCase() === email && password.length >= 4;
  if (!valid) { document.querySelector('#login-error').textContent = 'Email or password is incorrect.'; return; }
  if (!auth && profile) { auth = { email, password }; localStorage.setItem('prono-auth', JSON.stringify(auth)); }
  sessionStorage.setItem('prono-logged-in', 'true'); document.querySelector('#login-error').textContent = ''; closeLogin();
});
document.querySelector('#logout-button').addEventListener('click', () => { sessionStorage.removeItem('prono-logged-in'); closeAccount(); openLogin(); });
if (sessionStorage.getItem('prono-logged-in') !== 'true') openLogin();
