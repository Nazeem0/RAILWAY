document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CORE LOGIC ---
    const appContainer = document.getElementById('app-container');
    const navLinks = document.querySelector('.nav-links');
    const protectedLinks = document.querySelectorAll('.protected-link');
    const publicLinks = document.querySelectorAll('.public-link');
    const roleBadge = document.getElementById('role-badge');
    const logoutBtn = document.getElementById('logout-btn');
    const loginMessage = document.getElementById('login-message');
    const signupMessage = document.getElementById('signup-message');
    const dashboardContent = document.getElementById('dashboard-content');

    const GOVERNMENT_DOMAIN = '@gmail.com';
    const OFFICER_DOMAIN = '@gmail.com';

    // Simulated "Firebase" (localStorage for users, sessionStorage for active session)
    const USERS_KEY = 'railway_users';

    /**
     * Retrieves all registered users from localStorage.
     * @returns {Array} List of user objects.
     */
    const getUsers = () => {
        const users = localStorage.getItem(USERS_KEY);
        return users ? JSON.parse(users) : [];
    };

    /**
     * Saves the current list of users back to localStorage.
     * @param {Array} users - List of user objects.
     */
    const saveUsers = (users) => {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    };

    /**
     * Gets the active session from sessionStorage.
     * @returns {Object|null} The session object or null.
     */
    const getSession = () => {
        const session = sessionStorage.getItem('rsms_session');
        return session ? JSON.parse(session) : null;
    };

    /**
     * Sets the active session in sessionStorage.
     * @param {Object} user - The user object to store.
     */
    const setSession = (user) => {
        sessionStorage.setItem('rsms_session', JSON.stringify({
            email: user.email,
            name: user.name,
            role: user.role
        }));
    };

    /**
     * Clears the active session and redirects.
     */
    const logout = () => {
        sessionStorage.removeItem('rsms_session');
        updateNavAndRouting(); // Redirects to #/home which will check session and push to #/login
        alert('You have been successfully logged out.');
        window.location.hash = '#/home';
    };

    logoutBtn.addEventListener('click', logout);


    // --- 2. ROLE SELECTION HANDLERS ---
    
    /**
     * Initializes role selection buttons for signup and login pages
     */
    const initRoleSelection = () => {
        // Signup role buttons
        const signupRoleBtns = document.querySelectorAll('#signup-page .role-btn');
        signupRoleBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                signupRoleBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                document.getElementById('signup-role').value = btn.getAttribute('data-role');
            });
        });

        // Login role buttons
        const loginRoleBtns = document.querySelectorAll('#login-page .role-btn');
        loginRoleBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                loginRoleBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                document.getElementById('login-role').value = btn.getAttribute('data-role');
            });
        });
    };

    // Initialize on page load and after navigation
    const reinitializeRoleSelection = () => {
        setTimeout(initRoleSelection, 50);
    };


    // --- 3. AUTHENTICATION FLOW ---

    // a) Sign-Up Logic
    document.getElementById('signup-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim().toLowerCase();
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;
        const role = document.getElementById('signup-role').value;

        signupMessage.textContent = '';
        signupMessage.classList.remove('success-message', 'error-message');

        // Validate role selection
        if (!role) {
            signupMessage.textContent = 'Please select a role to proceed.';
            signupMessage.classList.add('error-message');
            return;
        }

        if (password !== confirmPassword) {
            signupMessage.textContent = 'Passwords do not match.';
            signupMessage.classList.add('error-message');
            return;
        }

        let users = getUsers();
        if (users.find(u => u.email === email)) {
            signupMessage.textContent = 'This email is already registered. Please login.';
            signupMessage.classList.add('error-message');
            return;
        }

        // Use selected role instead of auto-detecting from email domain
        const newUser = { name, email, password, role };
        users.push(newUser);
        saveUsers(users);

        signupMessage.textContent = 'Registration successful. Please login to continue.';
        signupMessage.classList.add('success-message');
        
        // Redirect to Home page after a short delay
        setTimeout(() => {
            window.location.hash = '#/home';
        }, 2000);
    });

    // b) Login Logic
    document.getElementById('login-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim().toLowerCase();
        const password = document.getElementById('login-password').value;
        const role = document.getElementById('login-role').value;

        loginMessage.textContent = '';
        loginMessage.classList.remove('success-message', 'error-message');

        // Validate role selection
        if (!role) {
            loginMessage.textContent = 'Please select a role to proceed.';
            loginMessage.classList.add('error-message');
            return;
        }

        const users = getUsers();
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            // Verify that selected role matches user's registered role
            if (user.role !== role) {
                loginMessage.textContent = `This email is registered as a ${user.role}. Please select the correct role.`;
                loginMessage.classList.add('error-message');
                return;
            }

            // Start Session
            setSession(user);
            loginMessage.textContent = 'Login successful! Redirecting...';
            loginMessage.classList.add('success-message');
            
            // Redirect to Dashboard with a slightly longer delay to ensure rendering
            setTimeout(() => {
                window.location.hash = '#/dashboard';
                // Give time for the hash change event to trigger and render
                setTimeout(() => {
                    updateNavAndRouting();
                }, 100);
            }, 1000);

            // Clear form fields
            document.getElementById('login-form').reset();
            // Reset role selection
            document.querySelectorAll('#login-page .role-btn').forEach(btn => btn.classList.remove('selected'));
            document.getElementById('login-role').value = '';
        } else {
            loginMessage.textContent = 'Invalid credentials. Please try again or Sign Up first.';
            loginMessage.classList.add('error-message');
        }
    });


    // --- 4. ROLE-BASED DASHBOARD CONTENT ---

    /**
     * Generates a random Employee ID based on role
     */
    const generateEmployeeID = (role) => {
        if (role === 'Government Officer' || role === 'Government') {
            return 'GOV-' + Math.random().toString(9).substr(2, 6).toUpperCase();
        } else {
            return 'RSM-' + new Date().getFullYear() + '-' + Math.random().toString(9).substr(2, 4).toUpperCase();
        }
    };

    /**
     * Generates and injects the dashboard content based on the user's role.
     * @param {string} role - The user's role ('Government Officer' or 'Railway Officer').
     */
    const renderDashboard = (role) => {
        const user = getSession(); // Get user details
        let html = '';
        let themeClass = '';
        const employeeID = generateEmployeeID(role);

        if (role === 'Government Officer' || role === 'Government') {
            themeClass = 'gov-theme';
            html = `
                <div class="dashboard-header">Government Official Portal</div>
                
                <div class="profile-banner card">
                    <div class="profile-banner-content">
                        <div class="profile-avatar gov-avatar">
                            <span>${user?.name?.charAt(0).toUpperCase() || 'G'}</span>
                        </div>
                        <div class="profile-info">
                            <h2>${user?.name || 'Government Official'}</h2>
                            <p class="profile-email">${user?.email || 'N/A'}</p>
                            <div class="profile-meta">
                                <span class="profile-badge gov-badge">${role === 'Government Officer' ? 'Government Official' : 'Government'}</span>
                                <span class="profile-id">ID: ${employeeID}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="stats-grid">
                    <div class="card stat-card">
                        <span class="stat-value">45</span>
                        <p>Total Active Crossings</p>
                    </div>
                    <div class="card stat-card">
                        <span class="stat-value">2</span>
                        <p>Monthly Incidents</p>
                    </div>
                    <div class="card stat-card">
                        <span class="stat-value">98.5%</span>
                        <p>Safety Compliance (%)</p>
                    </div>
                    <div class="card stat-card">
                        <span class="stat-value">120</span>
                        <p>Active Safety Officers</p>
                    </div>
                </div>

                <div class="compliance-section">
                    <h3 class="section-title">Regional Safety Overview</h3>
                    <div class="compliance-grid">
                        <div class="compliance-item">
                            <span class="compliance-check">✓</span>
                            <span class="compliance-text">Gate Mechanism Operational</span>
                            <span class="compliance-status compliant">Compliant</span>
                        </div>
                        <div class="compliance-item">
                            <span class="compliance-check">✓</span>
                            <span class="compliance-text">Sensor Calibration Current</span>
                            <span class="compliance-status compliant">Compliant</span>
                        </div>
                        <div class="compliance-item">
                            <span class="compliance-check">✓</span>
                            <span class="compliance-text">Warning Systems Functional</span>
                            <span class="compliance-status compliant">Compliant</span>
                        </div>
                        <div class="compliance-item">
                            <span class="compliance-check">!</span>
                            <span class="compliance-text">Track Maintenance Scheduled</span>
                            <span class="compliance-status attention">Attention</span>
                        </div>
                        <div class="compliance-item">
                            <span class="compliance-check">✓</span>
                            <span class="compliance-text">Emergency Protocols Updated</span>
                            <span class="compliance-status compliant">Compliant</span>
                        </div>
                        <div class="compliance-item">
                            <span class="compliance-check">✓</span>
                            <span class="compliance-text">Backup Power Systems</span>
                            <span class="compliance-status compliant">Compliant</span>
                        </div>
                        <div class="compliance-item">
                            <span class="compliance-check">✓</span>
                            <span class="compliance-text">Communication Links Active</span>
                            <span class="compliance-status compliant">Compliant</span>
                        </div>
                        <div class="compliance-item">
                            <span class="compliance-check">✓</span>
                            <span class="compliance-text">Data Logging Verified</span>
                            <span class="compliance-status compliant">Compliant</span>
                        </div>
                        <div class="compliance-item">
                            <span class="compliance-check">!</span>
                            <span class="compliance-text">Obstruction Detection Test</span>
                            <span class="compliance-status attention">Attention</span>
                        </div>
                        <div class="compliance-item">
                            <span class="compliance-check">!</span>
                            <span class="compliance-text">Staff Training Compliance</span>
                            <span class="compliance-status non-compliant">Non-Compliant</span>
                        </div>
                        <div class="compliance-item">
                            <span class="compliance-check">!</span>
                            <span class="compliance-text">Equipment Inspection Due</span>
                            <span class="compliance-status attention">Attention</span>
                        </div>
                        <div class="compliance-item">
                            <span class="compliance-check">✓</span>
                            <span class="compliance-text">Signal Light Brightness Check</span>
                            <span class="compliance-status compliant">Compliant</span>
                        </div>
                    </div>
                </div>
            `;
        } else if (role === 'Railway Officer') {
            themeClass = 'officer-theme';
            html = `
                <div class="dashboard-header">Railway Officer Portal</div>
                
                <div class="profile-banner card">
                    <div class="profile-banner-content">
                        <div class="profile-avatar railway-avatar">
                            <span>${user?.name?.charAt(0).toUpperCase() || 'R'}</span>
                        </div>
                        <div class="profile-info">
                            <h2>${user?.name || 'Railway Officer'}</h2>
                            <p class="profile-email">${user?.email || 'N/A'}</p>
                            <div class="profile-meta">
                                <span class="profile-badge railway-badge">Railway Officer</span>
                                <span class="profile-id">ID: ${employeeID}</span>
                            </div>
                        </div>
                    </div>

                    <div class="stats-grid">
                    <div class="card stat-card">
                        <span class="stat-value">3</span>
                        <p>Crossings Assigned</p>
                    </div>
                    <div class="card stat-card">
                        <span class="stat-value">0</span>
                        <p>Incidents This Month</p>
                    </div>
                    <div class="card stat-card">
                        <span class="stat-value">100%</span>
                        <p>Local Safety Compliance</p>
                    </div>
                </div>
                
                <div class="compliance-section">
                    <h3 class="section-title">Compliance Monitoring</h3>
                    <div class="compliance-grid">
                        <div class="compliance-item">
                            <span class="compliance-check">✓</span>
                            <span class="compliance-text">Gate Mechanism Operational</span>
                            <span class="compliance-status compliant">Compliant</span>
                        </div>
                        <div class="compliance-item">
                            <span class="compliance-check">✓</span>
                            <span class="compliance-text">Sensor Calibration Current</span>
                            <span class="compliance-status compliant">Compliant</span>
                        </div>
                        <div class="compliance-item">
                            <span class="compliance-check">✓</span>
                            <span class="compliance-text">Warning Systems Functional</span>
                            <span class="compliance-status compliant">Compliant</span>
                        </div>
                        <div class="compliance-item">
                            <span class="compliance-check">!</span>
                            <span class="compliance-text">Track Maintenance Scheduled</span>
                            <span class="compliance-status attention">Attention</span>
                        </div>
                        <div class="compliance-item">
                            <span class="compliance-check">✓</span>
                            <span class="compliance-text">Emergency Protocols Updated</span>
                            <span class="compliance-status compliant">Compliant</span>
                        </div>
                        <div class="compliance-item">
                            <span class="compliance-check">✓</span>
                            <span class="compliance-text">Backup Power Systems</span>
                            <span class="compliance-status compliant">Compliant</span>
                        </div>
                        <div class="compliance-item">
                            <span class="compliance-check">✓</span>
                            <span class="compliance-text">Communication Links Active</span>
                            <span class="compliance-status compliant">Compliant</span>
                        </div>
                        <div class="compliance-item">
                            <span class="compliance-check">✓</span>
                            <span class="compliance-text">Data Logging Verified</span>
                            <span class="compliance-status compliant">Compliant</span>
                        </div>
                        <div class="compliance-item">
                            <span class="compliance-check">!</span>
                            <span class="compliance-text">Obstruction Detection Test</span>
                            <span class="compliance-status attention">Attention</span>
                        </div>
                        <div class="compliance-item">
                            <span class="compliance-check">!</span>
                            <span class="compliance-text">Staff Training Compliance</span>
                            <span class="compliance-status non-compliant">Non-Compliant</span>
                        </div>
                        <div class="compliance-item">
                            <span class="compliance-check">!</span>
                            <span class="compliance-text">Equipment Inspection Due</span>
                            <span class="compliance-status attention">Attention</span>
                        </div>
                        <div class="compliance-item">
                            <span class="compliance-check">✓</span>
                            <span class="compliance-text">Signal Light Brightness Check</span>
                            <span class="compliance-status compliant">Compliant</span>
                        </div>
                    </div>
                </div>
            `;
        }

        dashboardContent.innerHTML = html;
        dashboardContent.className = themeClass; // Apply role-specific color theme
        
        // Simple Canvas Chart Simulation (Government Only)
        if (role === 'Government Officer' || role === 'Government') {
            // Note: Cannot actually import a library like Chart.js here, 
            // so this is a simplified canvas example for placeholder.
            const ctx1 = document.getElementById('incident-chart')?.getContext('2d');
            if (ctx1) {
                // A very basic drawing simulation on Canvas
                ctx1.fillStyle = 'rgba(59, 130, 246, 0.5)';
                ctx1.fillRect(0, 50, 50, 150);
                ctx1.fillRect(60, 100, 50, 100);
                ctx1.fillRect(120, 10, 50, 190);
                ctx1.font = '12px Poppins';
                ctx1.fillStyle = '#f1f5f9';
                ctx1.fillText('Jan', 15, 195);
                ctx1.fillText('Feb', 75, 195);
                ctx1.fillText('Mar', 135, 195);
            }
        }
    };


    // --- 5. SENSORS & HISTORY LOGIC ---

    // History Log Array (Global State)
    let historyLog = [];

    /**
     * Generates new random sensor data and updates the UI.
     * @param {boolean} logEvent - Whether to add a log entry for the refresh.
     */
    const refreshSensorData = (logEvent = false) => {
        const timestamp = new Date().toLocaleString();

        // 1. Sensor 1: Train Approach Detection
        const s1Distance = Math.floor(Math.random() * 500) + 10; // 10 to 510 cm
        const s1Status = s1Distance < 100 ? 'Active' : 'Inactive';
        
        document.getElementById('s1-distance').textContent = s1Distance;
        document.getElementById('s1-status').textContent = s1Status;
        document.getElementById('s1-updated').textContent = timestamp;
        document.getElementById('sensor1-badge').className = 'sensor-status-badge ' + (s1Status === 'Active' ? 'badge-active' : 'badge-inactive');

        // 2. Sensor 2: Track Obstruction Detection
        const isObstructed = Math.random() < 0.2; // 20% chance of obstruction
        const s2Obstruction = isObstructed ? 'Detected' : 'Clear';
        const s2Range = isObstructed ? (Math.floor(Math.random() * 50) + 10) : 0; // Obstruction 10-60cm range
        
        document.getElementById('s2-obstruction').textContent = s2Obstruction;
        document.getElementById('s2-range').textContent = s2Range;
        document.getElementById('s2-updated').textContent = timestamp;
        document.getElementById('sensor2-badge').className = 'sensor-status-badge ' + (s2Obstruction === 'Clear' ? 'badge-clear' : 'badge-obstructed');

        // 3. Sensor 3: Train Departure Detection
        const s3Distance = Math.floor(Math.random() * 100) + 700; // 700 to 800 cm (far away)
        const s3Status = s3Distance > 750 ? 'Clear' : 'Not Clear';
        
        document.getElementById('s3-distance').textContent = s3Distance;
        document.getElementById('s3-status').textContent = s3Status;
        document.getElementById('s3-updated').textContent = timestamp;
        document.getElementById('sensor3-badge').className = 'sensor-status-badge ' + (s3Status === 'Clear' ? 'badge-clear' : 'badge-not-clear');

        // Automatic Logging
        if (logEvent) {
            historyLog.unshift(
                { time: timestamp, sensor: 'System', event: 'Sensor data refreshed', status: 'Active', notes: 'Automated data cycle.' },
                { time: timestamp, sensor: 'Sensor 1', event: `Train Approach: ${s1Distance} cm`, status: s1Status, notes: s1Status === 'Active' ? 'Alert: Train approaching crossing!' : 'Nominal' },
                { time: timestamp, sensor: 'Sensor 2', event: `Track Obstruction: ${s2Obstruction}`, status: s2Obstruction, notes: s2Obstruction === 'Detected' ? 'CRITICAL: Obstruction detected!' : 'Track clear' },
                { time: timestamp, sensor: 'Sensor 3', event: `Train Departure: ${s3Status}`, status: s3Status, notes: s3Status === 'Clear' ? 'Train has cleared area' : 'Train is still near crossing' }
            );
            // Keep the log manageable (e.g., last 50 entries)
            historyLog = historyLog.slice(0, 50);
            renderHistoryTable();
        }
    };

    // Event listener for Refresh Button
    document.getElementById('refresh-data-btn')?.addEventListener('click', () => {
        refreshSensorData(true);
    });
    
    // Initial data load on page load
    refreshSensorData(false);


    /**
     * Renders the history log table.
     */
    const renderHistoryTable = () => {
        const tableBody = document.getElementById('history-table-body');
        if (!tableBody) return;

        let html = '';
        historyLog.forEach(log => {
            let statusClass = 'status-info';
            if (log.status === 'Active' || log.status === 'Clear') {
                statusClass = 'status-active';
            } else if (log.status === 'Inactive' || log.status === 'Detected' || log.status === 'Not Clear') {
                statusClass = 'status-obstructed';
            }

            html += `
                <tr>
                    <td>${log.time}</td>
                    <td>${log.sensor}</td>
                    <td>${log.event}</td>
                    <td><span class="status-badge-table ${statusClass}">${log.status}</span></td>
                    <td>${log.notes}</td>
                </tr>
            `;
        });
        tableBody.innerHTML = html;
    };


    // --- 6. ROUTING & NAVIGATION ---

    /**
     * Updates the visibility of navigation links based on the session state.
     * @param {Object|null} session - The current user session.
     */
    const updateNavVisibility = (session) => {
        protectedLinks.forEach(el => el.style.display = session ? 'inline-block' : 'none');
        publicLinks.forEach(el => el.style.display = session ? 'none' : 'inline-block');
        
        if (session) {
            roleBadge.textContent = session.role;
            // Apply role-specific color to the badge
            roleBadge.style.backgroundColor = (session.role === 'Government Officer' || session.role === 'Government') ? 'var(--gov-color)' : 'var(--officer-color)';
        }
    };

    /**
     * Handles hash-based routing and page rendering.
     */
    const handleRouting = () => {
        const hash = window.location.hash || '#/home';
        const path = hash.split('/')[1]; // e.g., 'home', 'login', 'dashboard'
        const session = getSession();
        
        // Global check for page visibility
        document.querySelectorAll('.page-section').forEach(section => {
            section.style.display = 'none';
            section.classList.remove('active-page');
        });

        // 4. Session Behavior (Security Fix)
        // If not logged in AND trying to access a protected page, redirect to Login
        const protectedRoutes = ['dashboard', 'sensors', 'history'];
        if (!session && protectedRoutes.includes(path)) {
             // Users must log in every time they reopen the website (no auto-login)
             window.location.hash = '#/login';
             return; // Stop further rendering for this attempt
        }
        
        // Page Selection and Rendering
        let pageId = `${path}-page`;
        const targetPage = document.getElementById(pageId);

        if (targetPage) {
            targetPage.style.display = 'block';
            // Use timeout for the fade-in transition
            setTimeout(() => targetPage.classList.add('active-page'), 10);
        } else {
            // Default to Home if hash is invalid (e.g. #/something)
             window.location.hash = '#/home';
             return;
        }

        // 5. Special Page Logic
        if (path === 'dashboard' && session) {
            renderDashboard(session.role);
            // Force reflow to ensure content is rendered
            dashboardContent.offsetHeight;
        } else if (path === 'history' && session) {
            renderHistoryTable();
        } else if (path === 'sensors' && session) {
            // Re-call data refresh to ensure UI is up to date when navigating
            refreshSensorData(false); 
        } else if (path === 'signup' || path === 'login') {
            // Reinitialize role selection buttons when navigating to auth pages
            reinitializeRoleSelection();
        }

        // 6. Navigation and Session State Update
        updateNavVisibility(session);
    };

    // Combined function for navigation and routing logic
    const updateNavAndRouting = () => {
        handleRouting();
    };


    // Initial setup and event listeners
    window.addEventListener('hashchange', updateNavAndRouting);
    window.addEventListener('load', () => {
        // If no hash, set to home for initial check
        if (!window.location.hash) {
            window.location.hash = '#/home';
        }
        // Run once on load
        updateNavAndRouting();

        // Scroll logic for Learn More button
        document.getElementById('learn-more-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = e.target.getAttribute('href').substring(1);
            document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
        });

        // Initialize role selection
        initRoleSelection();
    });
});