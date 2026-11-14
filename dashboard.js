/* ═══════════════════════════════════════════════════════════
   AGRI-APP — Tractor Bill Management Dashboard JS
   ═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;

  // ── Theme Management ──
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const savedTheme = localStorage.getItem('agri_theme');
  if (savedTheme === 'light') {
    body.classList.remove('dark');
    body.classList.add('light');
    if (themeIcon) themeIcon.textContent = 'dark_mode';
  } else {
    body.classList.add('dark');
    body.classList.remove('light');
    if (themeIcon) themeIcon.textContent = 'light_mode';
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = body.classList.contains('dark');
      if (isDark) {
        body.classList.remove('dark');
        body.classList.add('light');
        if (themeIcon) themeIcon.textContent = 'dark_mode';
        localStorage.setItem('agri_theme', 'light');
      } else {
        body.classList.remove('light');
        body.classList.add('dark');
        if (themeIcon) themeIcon.textContent = 'light_mode';
        localStorage.setItem('agri_theme', 'dark');
      }
    });
  }

  // ── Security Route Guard ──
  const sessionRaw = localStorage.getItem('agri_session');
  if (!sessionRaw) {
    // Not authenticated! Block access and redirect to login
    window.location.replace('index.html');
    return;
  }

  let currentUser;
  try {
    currentUser = JSON.parse(sessionRaw);
    if (!currentUser || !currentUser.email) {
      throw new Error('Invalid session payload');
    }
  } catch (e) {
    localStorage.removeItem('agri_session');
    window.location.replace('index.html');
    return;
  }

  // Verify active session with backend security API
  fetch('/api/auth/me', { method: 'GET', credentials: 'include' })
    .then(async (res) => {
      if (res.status === 401) {
        console.warn('Backend session invalidated, redirecting to login');
        localStorage.removeItem('agri_session');
        localStorage.removeItem('agri_user');
        window.location.replace('index.html');
      } else if (res.ok) {
        const data = await res.json();
        if (data.user) {
          currentUser = { ...currentUser, ...data.user };
        }
      }
    })
    .catch((err) => {
      console.warn('Backend server offline or running standalone, trusting verified local session', err);
    });

  // Update User Display (Defaults to Muthu / Driver as in user design if unset)
  const userNameEl = document.getElementById('userName');
  const userRoleEl = document.getElementById('userRole');
  const userAvatarEl = document.getElementById('userAvatar');
  const driverNameInput = document.getElementById('driverNameInput');

  const defaultDisplayName = currentUser.name || 'Muthu';
  const defaultDisplayRole = currentUser.role || 'Driver';

  if (userNameEl) userNameEl.textContent = defaultDisplayName;
  if (userRoleEl) userRoleEl.textContent = defaultDisplayRole;
  if (userAvatarEl) userAvatarEl.textContent = defaultDisplayName.charAt(0).toUpperCase();
  if (driverNameInput) driverNameInput.value = defaultDisplayName;

  // Profile view fields
  const profName = document.getElementById('profName');
  const profEmail = document.getElementById('profEmail');
  const profPhone = document.getElementById('profPhone');
  const profCardName = document.getElementById('profCardName');
  const profCardRole = document.getElementById('profCardRole');
  const profCardPhone = document.getElementById('profCardPhone');

  if (profName) profName.value = currentUser.name || '';
  if (profEmail) profEmail.value = currentUser.email || '';
  if (profPhone && currentUser.phone) profPhone.value = currentUser.phone;
  if (profCardName) profCardName.textContent = currentUser.name || defaultDisplayName;
  if (profCardRole) profCardRole.textContent = currentUser.role || defaultDisplayRole;
  if (profCardPhone && currentUser.phone) profCardPhone.textContent = currentUser.phone;

  // Logout Button (Terminates Session on Server & Client)
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      } catch (e) {}
      localStorage.removeItem('agri_session');
      localStorage.removeItem('agri_user');
      window.location.replace('index.html');
    });
  }

  // ── 2060 Sidebar Collapse Toggle ──
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar2060 = document.getElementById('sidebar2060');
  const sidebarToggleIcon = document.getElementById('sidebarToggleIcon');
  if (sidebarToggle && sidebar2060) {
    sidebarToggle.addEventListener('click', () => {
      const isCollapsed = sidebar2060.classList.toggle('collapsed');
      if (sidebarToggleIcon) {
        sidebarToggleIcon.textContent = isCollapsed ? 'menu' : 'menu_open';
      }
    });
  }

  // ── Live 2060 Quantum Clock ──
  const liveClock2060 = document.getElementById('liveClock2060');
  function update2060Clock() {
    if (!liveClock2060) return;
    const now = new Date();
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const dateStr = `${now.getDate()} ${months[now.getMonth()]} 2060`;
    const timeStr = now.toTimeString().split(' ')[0];
    liveClock2060.textContent = `${dateStr} • ${timeStr} IST`;
  }
  setInterval(update2060Clock, 1000);
  update2060Clock();

  // ── Navigation Tabs (3 Core Views) ──
  const navTabBtns = document.querySelectorAll('.nav-tab-btn');
  const activeViewTitle = document.getElementById('activeViewTitle');
  const viewSections = {
    billing: document.getElementById('viewBilling'),
    history: document.getElementById('viewHistory'),
    profile: document.getElementById('viewProfile')
  };

  const viewTitles = {
    billing: 'New Bill & Live Work Timer',
    history: 'Work History & Records',
    profile: 'Driver & Tractor Fleet Profile'
  };

  navTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetView = btn.dataset.view;
      navTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      Object.keys(viewSections).forEach(key => {
        if (viewSections[key]) {
          viewSections[key].classList.toggle('active', key === targetView);
        }
      });

      if (activeViewTitle && viewTitles[targetView]) {
        activeViewTitle.textContent = viewTitles[targetView];
      }

      if (targetView === 'history') {
        renderHistoryTable();
      }
    });
  });

  // ── Work Selection & Tine Variant ──
  const workChips = document.querySelectorAll('.work-chip');
  const variantWrapper = document.getElementById('variantWrapper');
  const variantChips = document.querySelectorAll('.v-chip');
  let selectedWorkType = 'Rotavator';
  let selectedVariant = '9';

  workChips.forEach(chip => {
    chip.addEventListener('click', () => {
      workChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      selectedWorkType = chip.dataset.type;

      if (selectedWorkType === 'Spring Cultivator') {
        if (variantWrapper) variantWrapper.style.display = 'block';
      } else {
        if (variantWrapper) variantWrapper.style.display = 'none';
      }
      updateLiveCalculation();
    });
  });

  variantChips.forEach(chip => {
    chip.addEventListener('click', () => {
      variantChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      selectedVariant = chip.dataset.variant;
      updateLiveCalculation();
    });
  });

  // ── Time Tracker Engine ──
  let timerInterval = null;
  let startTime = null;
  let accumulatedSeconds = 0;
  let isTimerRunning = false;

  const timerDisplay = document.getElementById('timerDisplay');
  const timerStatusPill = document.getElementById('timerStatusPill');
  const timerStatusText = document.getElementById('timerStatusText');
  const startTimerBtn = document.getElementById('startTimerBtn');
  const stopTimerBtn = document.getElementById('stopTimerBtn');
  const resetTimerBtn = document.getElementById('resetTimerBtn');
  const manualHours = document.getElementById('manualHours');
  const manualMins = document.getElementById('manualMins');
  const hourlyRateInput = document.getElementById('hourlyRate');

  function formatTime(totalSecs) {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function getEffectiveSeconds() {
    let secs = accumulatedSeconds;
    if (isTimerRunning && startTime) {
      secs += Math.floor((Date.now() - startTime) / 1000);
    }
    // Also include manual hours/mins if entered
    const mH = parseFloat(manualHours ? manualHours.value : 0) || 0;
    const mM = parseFloat(manualMins ? manualMins.value : 0) || 0;
    if (mH > 0 || mM > 0) {
      secs += Math.floor(mH * 3600 + mM * 60);
    }
    return secs;
  }

  function updateLiveCalculation() {
    const totalSecs = getEffectiveSeconds();
    const totalMins = totalSecs / 60;
    const hrs = Math.floor(totalMins / 60);
    const remMins = Math.floor(totalMins % 60);

    const rate = parseFloat(hourlyRateInput ? hourlyRateInput.value : 900) || 0;
    const totalAmount = (rate * totalMins) / 60;

    // Display summary
    const summaryWorkType = document.getElementById('summaryWorkType');
    const summaryDuration = document.getElementById('summaryDuration');
    const summaryRate = document.getElementById('summaryRate');
    const summaryTotal = document.getElementById('summaryTotal');

    let workLabel = selectedWorkType;
    if (selectedWorkType === 'Spring Cultivator') {
      workLabel += ` (${selectedVariant} Tines)`;
    }

    if (summaryWorkType) summaryWorkType.textContent = workLabel;
    if (summaryDuration) summaryDuration.textContent = `${hrs} hrs ${remMins} mins`;
    if (summaryRate) summaryRate.textContent = `₹${rate.toLocaleString()} / hr`;
    if (summaryTotal) summaryTotal.textContent = `₹${Math.round(totalAmount).toLocaleString()}`;
  }

  function tick() {
    const totalSecs = getEffectiveSeconds();
    if (timerDisplay) timerDisplay.textContent = formatTime(totalSecs);
    updateLiveCalculation();
  }

  if (startTimerBtn) {
    startTimerBtn.addEventListener('click', () => {
      if (!isTimerRunning) {
        isTimerRunning = true;
        startTime = Date.now();
        timerInterval = setInterval(tick, 1000);

        startTimerBtn.disabled = true;
        if (stopTimerBtn) stopTimerBtn.disabled = false;
        if (timerStatusPill) {
          timerStatusPill.classList.add('running');
          if (timerStatusText) timerStatusText.textContent = 'Tractor In Operation';
        }
      }
    });
  }

  if (stopTimerBtn) {
    stopTimerBtn.addEventListener('click', () => {
      if (isTimerRunning) {
        isTimerRunning = false;
        clearInterval(timerInterval);
        accumulatedSeconds += Math.floor((Date.now() - startTime) / 1000);
        startTime = null;

        if (startTimerBtn) startTimerBtn.disabled = false;
        stopTimerBtn.disabled = true;
        if (timerStatusPill) {
          timerStatusPill.classList.remove('running');
          if (timerStatusText) timerStatusText.textContent = 'Paused / Stopped';
        }
        updateLiveCalculation();
      }
    });
  }

  if (resetTimerBtn) {
    resetTimerBtn.addEventListener('click', () => {
      if (isTimerRunning) {
        clearInterval(timerInterval);
        isTimerRunning = false;
      }
      accumulatedSeconds = 0;
      startTime = null;
      if (timerDisplay) timerDisplay.textContent = '00:00:00';
      if (manualHours) manualHours.value = '';
      if (manualMins) manualMins.value = '';
      if (startTimerBtn) startTimerBtn.disabled = false;
      if (stopTimerBtn) stopTimerBtn.disabled = true;
      if (timerStatusPill) {
        timerStatusPill.classList.remove('running');
        if (timerStatusText) timerStatusText.textContent = 'Ready to start';
      }
      updateLiveCalculation();
    });
  }

  if (manualHours) manualHours.addEventListener('input', updateLiveCalculation);
  if (manualMins) manualMins.addEventListener('input', updateLiveCalculation);
  if (hourlyRateInput) hourlyRateInput.addEventListener('input', updateLiveCalculation);

  // ── Payment Status Radio Pills ──
  const pillPending = document.getElementById('pillPending');
  const pillPaid = document.getElementById('pillPaid');
  let selectedPaymentStatus = 'Pending';

  if (pillPending && pillPaid) {
    pillPending.addEventListener('click', () => {
      pillPending.classList.add('active');
      pillPaid.classList.remove('active');
      selectedPaymentStatus = 'Pending';
    });
    pillPaid.addEventListener('click', () => {
      pillPaid.classList.add('active');
      pillPending.classList.remove('active');
      selectedPaymentStatus = 'Paid';
    });
  }

  // ── Seed Starter Jobs ──
  let jobs = [];
  try {
    const stored = localStorage.getItem('agri_jobs');
    if (stored) {
      jobs = JSON.parse(stored);
    } else {
      jobs = [
        {
          id: '#INV-89101',
          date: '28 Oct',
          customerName: 'Ramesh Kumar',
          customerPhone: '+91 94433 11223',
          driverName: 'Logesh K',
          workType: 'Rotavator',
          durationSecs: 7800, // 2h 10m
          durationFormatted: '2h 10m',
          ratePerHour: 900,
          totalAmount: 1950,
          status: 'Paid',
          notes: 'South Acre Paddy field'
        },
        {
          id: '#INV-89102',
          date: '27 Oct',
          customerName: 'Murugan G',
          customerPhone: '+91 98421 55678',
          driverName: 'Logesh K',
          workType: 'Spring Cultivator (9 Tines)',
          durationSecs: 10800, // 3h 0m
          durationFormatted: '3h 0m',
          ratePerHour: 850,
          totalAmount: 2550,
          status: 'Pending',
          notes: 'Sugarcane preparatory land'
        },
        {
          id: '#INV-89103',
          date: '26 Oct',
          customerName: 'Senthil Farm',
          customerPhone: '+91 97500 88990',
          driverName: 'Logesh K',
          workType: 'Disc Cultivator',
          durationSecs: 5400, // 1h 30m
          durationFormatted: '1h 30m',
          ratePerHour: 950,
          totalAmount: 1425,
          status: 'Paid',
          notes: 'Red soil plot'
        }
      ];
      localStorage.setItem('agri_jobs', JSON.stringify(jobs));
    }
  } catch (e) {
    console.error('Error loading jobs', e);
  }

  function saveJobsToStorage() {
    localStorage.setItem('agri_jobs', JSON.stringify(jobs));
    updateKPIs();
    renderHistoryTable();
  }

  // ── Update Top KPIs ──
  function updateKPIs() {
    let totalRevenue = 0;
    let totalSecs = 0;
    let totalPending = 0;
    const completedCount = jobs.length;

    jobs.forEach(job => {
      totalSecs += job.durationSecs || 0;
      if (job.status === 'Paid') {
        totalRevenue += job.totalAmount || 0;
      } else {
        totalPending += job.totalAmount || 0;
      }
    });

    const kpiRevenue = document.getElementById('kpiRevenue');
    const kpiHours = document.getElementById('kpiHours');
    const kpiPending = document.getElementById('kpiPending');
    const kpiJobs = document.getElementById('kpiJobs');
    const historyCount = document.getElementById('historyCount');

    if (kpiRevenue) kpiRevenue.textContent = `₹${totalRevenue.toLocaleString()}`;
    if (kpiHours) kpiHours.textContent = `${(totalSecs / 3600).toFixed(1)} hrs`;
    if (kpiPending) kpiPending.textContent = `₹${totalPending.toLocaleString()}`;
    if (kpiJobs) kpiJobs.textContent = completedCount;
    if (historyCount) historyCount.textContent = completedCount;
  }

  updateKPIs();
  updateLiveCalculation();

  // ── Generate & Save Job / Invoice ──
  const saveJobBtn = document.getElementById('saveJobBtn');
  const custNameInput = document.getElementById('custName');
  const custPhoneInput = document.getElementById('custPhone');
  const jobNotesInput = document.getElementById('jobNotes');

  if (saveJobBtn) {
    saveJobBtn.addEventListener('click', () => {
      const custName = custNameInput ? custNameInput.value.trim() : '';
      const custPhone = custPhoneInput ? custPhoneInput.value.trim() : '';

      if (!custName) {
        showSnackbar('Please enter customer name');
        if (custNameInput) custNameInput.focus();
        return;
      }
      if (!custPhone) {
        showSnackbar('Please enter customer contact');
        if (custPhoneInput) custPhoneInput.focus();
        return;
      }

      const totalSecs = getEffectiveSeconds();
      if (totalSecs <= 0) {
        showSnackbar('Please track duration or enter manual hours');
        return;
      }

      const totalMins = totalSecs / 60;
      const hrs = Math.floor(totalMins / 60);
      const remMins = Math.floor(totalMins % 60);
      const rate = parseFloat(hourlyRateInput ? hourlyRateInput.value : 900) || 0;
      const totalAmount = Math.round((rate * totalMins) / 60);

      let workDesc = selectedWorkType;
      if (selectedWorkType === 'Spring Cultivator') {
        workDesc += ` (${selectedVariant} Tines)`;
      }

      const newId = `#INV-${Math.floor(10000 + Math.random() * 90000)}`;
      const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

      const newJob = {
        id: newId,
        date: today,
        customerName: custName,
        customerPhone: custPhone,
        driverName: driverNameInput ? driverNameInput.value : currentUser.name,
        workType: workDesc,
        durationSecs: totalSecs,
        durationFormatted: `${hrs}h ${remMins}m`,
        ratePerHour: rate,
        totalAmount: totalAmount,
        status: selectedPaymentStatus,
        notes: jobNotesInput ? jobNotesInput.value : ''
      };

      jobs.unshift(newJob);
      saveJobsToStorage();

      // Show Invoice Modal Immediately
      openInvoiceModal(newJob);

      // Reset form
      if (custNameInput) custNameInput.value = '';
      if (custPhoneInput) custPhoneInput.value = '';
      if (jobNotesInput) jobNotesInput.value = '';
      if (resetTimerBtn) resetTimerBtn.click();

      showSnackbar('✓ Invoice Generated & Saved!');
    });
  }

  // ── Invoice Modal Display ──
  const invoiceModal = document.getElementById('invoiceModal');
  const closeInvoiceModal = document.getElementById('closeInvoiceModal');
  const btnDismissInvoice = document.getElementById('btnDismissInvoice');
  const btnPrintInvoice = document.getElementById('btnPrintInvoice');

  function openInvoiceModal(job) {
    if (!invoiceModal) return;

    document.getElementById('invId').textContent = job.id;
    document.getElementById('invDate').textContent = job.date;
    document.getElementById('invCustomer').textContent = `${job.customerName} (${job.customerPhone})`;
    document.getElementById('invLocation').textContent = job.notes ? `Location / Notes: ${job.notes}` : 'Agricultural Field Work';
    document.getElementById('invDriver').textContent = `${job.driverName || 'Logesh K'} • Mahindra 575 DI`;

    document.getElementById('invWork').textContent = job.workType;
    document.getElementById('invDuration').textContent = job.durationFormatted;
    document.getElementById('invRate').textContent = `₹${job.ratePerHour}`;
    document.getElementById('invAmount').textContent = `₹${job.totalAmount.toLocaleString()}`;
    document.getElementById('invGrandTotal').textContent = `₹${job.totalAmount.toLocaleString()}`;

    const badge = document.getElementById('invStatusBadge');
    if (badge) {
      badge.textContent = job.status.toUpperCase();
      badge.className = `inv-status-pill ${job.status.toLowerCase()}`;
    }

    invoiceModal.classList.add('show');
  }

  if (closeInvoiceModal) closeInvoiceModal.addEventListener('click', () => invoiceModal.classList.remove('show'));
  if (btnDismissInvoice) btnDismissInvoice.addEventListener('click', () => invoiceModal.classList.remove('show'));
  if (invoiceModal) {
    invoiceModal.addEventListener('click', (e) => {
      if (e.target === invoiceModal) invoiceModal.classList.remove('show');
    });
  }

  if (btnPrintInvoice) {
    btnPrintInvoice.addEventListener('click', () => {
      window.print();
    });
  }

  // ── Work History Table Rendering & Filters ──
  const historyTableBody = document.getElementById('historyTableBody');
  const emptyState = document.getElementById('emptyState');
  const historySearch = document.getElementById('historySearch');
  const filterWorkType = document.getElementById('filterWorkType');
  const filterStatus = document.getElementById('filterStatus');

  function renderHistoryTable() {
    if (!historyTableBody) return;

    const query = historySearch ? historySearch.value.toLowerCase().trim() : '';
    const workFilter = filterWorkType ? filterWorkType.value : 'All';
    const statusFilter = filterStatus ? filterStatus.value : 'All';

    const filtered = jobs.filter(job => {
      const matchQuery = job.customerName.toLowerCase().includes(query) ||
                         job.customerPhone.includes(query) ||
                         job.id.toLowerCase().includes(query);
      const matchWork = workFilter === 'All' || job.workType.startsWith(workFilter);
      const matchStatus = statusFilter === 'All' || job.status === statusFilter;
      return matchQuery && matchWork && matchStatus;
    });

    historyTableBody.innerHTML = '';

    if (filtered.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    filtered.forEach((job, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="inv-code">${job.id}</td>
        <td>${job.date}</td>
        <td>
          <strong>${job.customerName}</strong>
          <br><small style="color:var(--text-sub); font-size:11px;">${job.customerPhone}</small>
        </td>
        <td>${job.workType}</td>
        <td>${job.durationFormatted}</td>
        <td>₹${job.ratePerHour}</td>
        <td><strong style="color:var(--green)">₹${job.totalAmount.toLocaleString()}</strong></td>
        <td>
          <span class="status-badge ${job.status.toLowerCase()}">${job.status}</span>
        </td>
        <td>
          <div class="action-btns">
            <button class="btn-action-icon btn-view" title="View / Print Invoice" data-index="${index}">
              <span class="material-icons-round">receipt</span>
            </button>
            <button class="btn-action-icon btn-toggle-status" title="Toggle Paid/Pending" data-index="${index}">
              <span class="material-icons-round">swap_horiz</span>
            </button>
            <button class="btn-action-icon btn-delete" title="Delete record" data-index="${index}">
              <span class="material-icons-round">delete_outline</span>
            </button>
          </div>
        </td>
      `;

      // Attach actions
      tr.querySelector('.btn-view').addEventListener('click', () => openInvoiceModal(job));

      tr.querySelector('.btn-toggle-status').addEventListener('click', () => {
        job.status = job.status === 'Paid' ? 'Pending' : 'Paid';
        saveJobsToStorage();
        showSnackbar(`Updated ${job.id} to ${job.status}`);
      });

      tr.querySelector('.btn-delete').addEventListener('click', () => {
        if (confirm(`Delete invoice ${job.id} for ${job.customerName}?`)) {
          jobs = jobs.filter(j => j.id !== job.id);
          saveJobsToStorage();
          showSnackbar('Invoice deleted');
        }
      });

      historyTableBody.appendChild(tr);
    });
  }

  if (historySearch) historySearch.addEventListener('input', renderHistoryTable);
  if (filterWorkType) filterWorkType.addEventListener('change', renderHistoryTable);
  if (filterStatus) filterStatus.addEventListener('change', renderHistoryTable);

  // ── Profile Form Update ──
  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const updatedName = document.getElementById('profName').value;
      const updatedPhone = document.getElementById('profPhone').value;
      const updatedEmail = document.getElementById('profEmail').value;

      currentUser.name = updatedName;
      currentUser.phone = updatedPhone;
      currentUser.email = updatedEmail;

      localStorage.setItem('agri_user', JSON.stringify(currentUser));

      if (userNameEl) userNameEl.textContent = updatedName;
      if (userAvatarEl) userAvatarEl.textContent = updatedName.charAt(0).toUpperCase();
      if (profCardName) profCardName.textContent = updatedName;
      if (document.getElementById('profCardPhone')) document.getElementById('profCardPhone').textContent = updatedPhone;

      showSnackbar('✓ Profile details saved!');
    });
  }

  // ── Toast Snackbar ──
  const snackbar = document.getElementById('snackbar');
  function showSnackbar(msg) {
    if (!snackbar) return;
    snackbar.textContent = msg;
    snackbar.classList.add('show');
    setTimeout(() => snackbar.classList.remove('show'), 3000);
  }
});
