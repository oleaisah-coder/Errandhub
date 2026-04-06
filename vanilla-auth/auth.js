// ==========================================
// User Data Management (LocalStorage)
// ==========================================

// Initialize the users array and seed demo accounts if empty
function initStorage() {
  let users = [];
  try {
    const rawData = localStorage.getItem('users');
    if (rawData) users = JSON.parse(rawData);
  } catch (e) {
    // ignore parse error and start fresh
  }

  // If local storage is empty, inject demo credentials
  if (users.length === 0) {
    users.push(
      { name: 'Demo User', email: 'user@errandhub.com', password: 'user123' },
      { name: 'Demo Admin', email: 'admin@errandhub.com', password: 'admin123' },
      { name: 'Demo Runner', email: 'runner@errandhub.com', password: 'runner123' }
    );
    localStorage.setItem('users', JSON.stringify(users));
  }
}

// Get all users from local storage
function getUsers() {
  initStorage();
  return JSON.parse(localStorage.getItem('users'));
}

// Get the currently logged-in user session
function getCurrentUser() {
  const session = localStorage.getItem('currentUser');
  return session ? JSON.parse(session) : null;
}

// ==========================================
// Route Protection & Middleware
// ==========================================

// Protect restricted pages (like Dashboard)
// Redirects to index.html if no session is found.
function enforceAuth() {
  if (!getCurrentUser()) {
    window.location.replace('index.html');
  }
}

// Protect guest pages (like Login and Signup)
// Redirects to dashboard if a session already exists.
function enforceGuest() {
  if (getCurrentUser()) {
    window.location.replace('dashboard.html');
  }
}

// ==========================================
// Authentication Handlers
// ==========================================

// Handle Signup Form Submission
function handleSignupSubmit(event) {
  event.preventDefault(); // Prevent page reload

  const nameInput = document.getElementById('name').value.trim();
  const emailInput = document.getElementById('email').value.trim().toLowerCase();
  const passwordInput = document.getElementById('password').value;

  const errorDiv = document.getElementById('signup-error');
  const successDiv = document.getElementById('signup-success');
  const submitBtn = event.target.querySelector('button[type="submit"]');

  // Reset messages
  errorDiv.style.display = 'none';
  successDiv.style.display = 'none';

  // Basic Validation
  if (!nameInput || !emailInput || !passwordInput) {
    showError(errorDiv, 'All fields are required.');
    return;
  }

  if (passwordInput.length < 6) {
    showError(errorDiv, 'Password must be at least 6 characters.');
    return;
  }

  const users = getUsers();

  // Check if email already exists
  const userExists = users.some(user => user.email === emailInput);
  if (userExists) {
    showError(errorDiv, 'An account with this email already exists.');
    return;
  }

  // Create physical user object
  const newUser = {
    name: nameInput,
    email: emailInput,
    password: passwordInput // NOTE: In a real backend this MUST be hashed. Kept plain for LocalStorage demo.
  };

  // Save to LocalStorage array
  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));

  // Visual success feedback
  submitBtn.disabled = true;
  successDiv.style.display = 'block';

  // Redirect to login after 1.5 seconds so user can read the success message
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 1500);
}


// Handle Login Form Submission
function handleLoginSubmit(event) {
  event.preventDefault(); // Prevent page reload

  const emailInput = document.getElementById('email').value.trim().toLowerCase();
  const passwordInput = document.getElementById('password').value;
  const errorDiv = document.getElementById('login-error');
  const submitBtn = event.target.querySelector('button[type="submit"]');

  // Reset messages
  errorDiv.style.display = 'none';

  // Basic validation
  if (!emailInput || !passwordInput) {
    showError(errorDiv, 'Please enter both email and password.');
    return;
  }

  const users = getUsers();

  // Check if user exists by email first
  const existingUser = users.find(user => user.email === emailInput);

  if (!existingUser) {
    showError(errorDiv, 'Email not found. Please sign up first.');
    return;
  }

  // Then verify password matches
  if (existingUser.password !== passwordInput) {
    showError(errorDiv, 'Incorrect password. Please try again.');
    return;
  }

  const authenticatedUser = existingUser;

  // Set session (Store email and name, but NEVER store password in session state)
  const sessionData = {
    name: authenticatedUser.name,
    email: authenticatedUser.email
  };
  
  localStorage.setItem('currentUser', JSON.stringify(sessionData));

  // Button feedback & Redirect to dashboard
  submitBtn.textContent = 'Logging in...';
  submitBtn.disabled = true;
  
  // A small delay makes the transition feel slightly more robust and natural
  setTimeout(() => {
    window.location.href = 'dashboard.html';
  }, 300);
}

// Handle Logout
function handleLogout() {
  localStorage.removeItem('currentUser');
  window.location.replace('index.html');
}

// Helper utility to flash errors cleanly
function showError(element, message) {
  element.textContent = message;
  element.style.display = 'block';
}
