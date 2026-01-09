// Pomodoro Timer JavaScript
(function () {
  'use strict';

  // Timer state
  let timerState = {
    isRunning: false,
    isPaused: false,
    currentTime: 25 * 60, // 25 minutes in seconds
    totalTime: 25 * 60,
    sessionType: 'work', // 'work', 'short-break', 'long-break'
    intervalId: null,
    completedPomodoros: 0,
    todayDate: new Date().toDateString(),
  };

  // Session durations (in seconds) - will be updated from inputs
  let SESSION_DURATIONS = {
    work: 25 * 60,
    'short-break': 5 * 60,
    'long-break': 15 * 60,
  };

  // DOM elements
  const elements = {
    timerDisplay: document.getElementById('timer-display'),
    timerStatus: document.getElementById('timer-status'),
    progressCircle: document.getElementById('progress-circle'),
    startPauseBtn: document.getElementById('start-pause-btn'),
    resetBtn: document.getElementById('reset-btn'),
    skipBtn: document.getElementById('skip-btn'),
    workBtn: document.getElementById('work-btn'),
    shortBreakBtn: document.getElementById('short-break-btn'),
    longBreakBtn: document.getElementById('long-break-btn'),
    workTimeInput: document.getElementById('work-time-input'),
    shortBreakTimeInput: document.getElementById('short-break-time-input'),
    longBreakTimeInput: document.getElementById('long-break-time-input'),
    todayCount: document.getElementById('today-count'),
    todayTime: document.getElementById('today-time'),
    streak: document.getElementById('streak'),
    tomatoesGrid: document.getElementById('tomatoes-grid'),
    weeklyChart: document.getElementById('weekly-chart'),
  };

  // Initialize
  function init() {
    loadData();
    // Initialize timer with current session type duration
    timerState.currentTime = SESSION_DURATIONS[timerState.sessionType];
    timerState.totalTime = SESSION_DURATIONS[timerState.sessionType];
    updateDisplay();
    updateProgress();
    updateStats();
    updateWeeklyChart();
    setupEventListeners();
    checkDateChange();
  }

  // Load data from localStorage
  function loadData() {
    const saved = localStorage.getItem('pomodoroData');
    if (saved) {
      const data = JSON.parse(saved);
      // Only load if it's the same day
      if (data.date === timerState.todayDate) {
        timerState.completedPomodoros = data.completedPomodoros || 0;
      } else {
        // New day, reset daily stats
        timerState.completedPomodoros = 0;
      }
    }

    // Load time settings
    const timeSettings = localStorage.getItem('pomodoroTimeSettings');
    if (timeSettings) {
      const settings = JSON.parse(timeSettings);
      if (settings.work) {
        SESSION_DURATIONS.work = settings.work * 60;
        elements.workTimeInput.value = settings.work;
      }
      if (settings['short-break']) {
        SESSION_DURATIONS['short-break'] = settings['short-break'] * 60;
        elements.shortBreakTimeInput.value = settings['short-break'];
      }
      if (settings['long-break']) {
        SESSION_DURATIONS['long-break'] = settings['long-break'] * 60;
        elements.longBreakTimeInput.value = settings['long-break'];
      }
    }
  }

  // Save data to localStorage
  function saveData() {
    const data = {
      date: timerState.todayDate,
      completedPomodoros: timerState.completedPomodoros,
      lastUpdate: new Date().toISOString(),
    };
    localStorage.setItem('pomodoroData', JSON.stringify(data));
    saveWeeklyData();
  }

  // Save weekly data
  function saveWeeklyData() {
    const weeklyData = getWeeklyData();
    const today = new Date().toDateString();
    weeklyData[today] = timerState.completedPomodoros;
    localStorage.setItem('pomodoroWeeklyData', JSON.stringify(weeklyData));
  }

  // Get weekly data
  function getWeeklyData() {
    const saved = localStorage.getItem('pomodoroWeeklyData');
    return saved ? JSON.parse(saved) : {};
  }

  // Check if date changed
  function checkDateChange() {
    const currentDate = new Date().toDateString();
    if (currentDate !== timerState.todayDate) {
      timerState.todayDate = currentDate;
      timerState.completedPomodoros = 0;
      saveData();
      updateStats();
    }
  }

  // Setup event listeners
  function setupEventListeners() {
    elements.startPauseBtn.addEventListener('click', toggleTimer);
    elements.resetBtn.addEventListener('click', resetTimer);
    elements.skipBtn.addEventListener('click', skipSession);
    elements.workBtn.addEventListener('click', () => setSessionType('work'));
    elements.shortBreakBtn.addEventListener('click', () =>
      setSessionType('short-break')
    );
    elements.longBreakBtn.addEventListener('click', () =>
      setSessionType('long-break')
    );

    // Time input listeners
    elements.workTimeInput.addEventListener('change', () =>
      updateTimeSetting('work')
    );
    elements.workTimeInput.addEventListener('input', () =>
      updateTimeSetting('work')
    );
    elements.shortBreakTimeInput.addEventListener('change', () =>
      updateTimeSetting('short-break')
    );
    elements.shortBreakTimeInput.addEventListener('input', () =>
      updateTimeSetting('short-break')
    );
    elements.longBreakTimeInput.addEventListener('change', () =>
      updateTimeSetting('long-break')
    );
    elements.longBreakTimeInput.addEventListener('input', () =>
      updateTimeSetting('long-break')
    );
  }

  // Update time setting
  function updateTimeSetting(type) {
    if (timerState.isRunning) return; // Don't allow changes while running

    let inputElement;
    if (type === 'work') {
      inputElement = elements.workTimeInput;
    } else if (type === 'short-break') {
      inputElement = elements.shortBreakTimeInput;
    } else if (type === 'long-break') {
      inputElement = elements.longBreakTimeInput;
    }

    if (!inputElement) return; // Safety check

    let minutes = parseInt(inputElement.value, 10);

    // Validate input
    if (isNaN(minutes) || minutes < 1) {
      minutes = type === 'work' ? 25 : type === 'short-break' ? 5 : 15;
      inputElement.value = minutes;
    }

    // Update max based on type
    if (type === 'work' && minutes > 120) {
      minutes = 120;
      inputElement.value = 120;
    } else if (
      (type === 'short-break' || type === 'long-break') &&
      minutes > 60
    ) {
      minutes = 60;
      inputElement.value = 60;
    }

    // Update duration
    SESSION_DURATIONS[type] = minutes * 60;

    // If this is the current session type, update the timer
    if (timerState.sessionType === type) {
      timerState.currentTime = SESSION_DURATIONS[type];
      timerState.totalTime = SESSION_DURATIONS[type];
      updateDisplay();
      updateProgress();
    }

    // Save settings
    saveTimeSettings();
  }

  // Save time settings
  function saveTimeSettings() {
    const settings = {
      work: parseInt(elements.workTimeInput.value, 10),
      'short-break': parseInt(elements.shortBreakTimeInput.value, 10),
      'long-break': parseInt(elements.longBreakTimeInput.value, 10),
    };
    localStorage.setItem('pomodoroTimeSettings', JSON.stringify(settings));
  }

  // Set session type
  function setSessionType(type) {
    if (timerState.isRunning) return;

    timerState.sessionType = type;
    timerState.currentTime = SESSION_DURATIONS[type];
    timerState.totalTime = SESSION_DURATIONS[type];

    // Update button states
    document.querySelectorAll('.session-btn').forEach((btn) => {
      btn.classList.remove('active');
    });

    if (type === 'work') {
      elements.workBtn.classList.add('active');
    } else if (type === 'short-break') {
      elements.shortBreakBtn.classList.add('active');
    } else if (type === 'long-break') {
      elements.longBreakBtn.classList.add('active');
    }

    updateDisplay();
    updateProgress();
  }

  // Toggle timer
  function toggleTimer() {
    if (!timerState.isRunning) {
      startTimer();
    } else {
      pauseTimer();
    }
  }

  // Start timer
  function startTimer() {
    timerState.isRunning = true;
    timerState.isPaused = false;

    elements.startPauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
    elements.startPauseBtn.classList.add('paused');

    timerState.intervalId = setInterval(() => {
      timerState.currentTime--;
      updateDisplay();
      updateProgress();

      if (timerState.currentTime <= 0) {
        completeSession();
      }
    }, 1000);
  }

  // Pause timer
  function pauseTimer() {
    timerState.isRunning = false;
    timerState.isPaused = true;

    clearInterval(timerState.intervalId);
    elements.startPauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
    elements.startPauseBtn.classList.remove('paused');
  }

  // Reset timer
  function resetTimer() {
    timerState.isRunning = false;
    timerState.isPaused = false;
    clearInterval(timerState.intervalId);

    timerState.currentTime = timerState.totalTime;
    elements.startPauseBtn.innerHTML = '<i class="fas fa-play"></i> Start';
    elements.startPauseBtn.classList.remove('paused');

    updateDisplay();
    updateProgress();
    updateStatus();
  }

  // Skip session
  function skipSession() {
    if (timerState.isRunning) {
      pauseTimer();
    }
    completeSession();
  }

  // Complete session
  function completeSession() {
    clearInterval(timerState.intervalId);
    timerState.isRunning = false;
    timerState.isPaused = false;

    // Play notification sound (if browser allows)
    playNotification();

    if (timerState.sessionType === 'work') {
      timerState.completedPomodoros++;
      saveData();
      updateStats();
      updateTomatoes();

      // Auto-start break after work session
      if (timerState.completedPomodoros % 4 === 0) {
        setSessionType('long-break');
      } else {
        setSessionType('short-break');
      }
    } else {
      // After break, go back to work
      setSessionType('work');
    }

    elements.startPauseBtn.innerHTML = '<i class="fas fa-play"></i> Start';
    elements.startPauseBtn.classList.remove('paused');
    updateStatus();
  }

  // Play notification
  function playNotification() {
    // Try to play a beep sound
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.5
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  }

  // Update display
  function updateDisplay() {
    const minutes = Math.floor(timerState.currentTime / 60);
    const seconds = timerState.currentTime % 60;
    elements.timerDisplay.textContent = `${String(minutes).padStart(
      2,
      '0'
    )}:${String(seconds).padStart(2, '0')}`;
  }

  // Update progress circle
  function updateProgress() {
    const progress = 1 - timerState.currentTime / timerState.totalTime;
    const circumference = 2 * Math.PI * 45;
    const offset = circumference * (1 - progress);

    elements.progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    elements.progressCircle.style.strokeDashoffset = offset;
  }

  // Update status text
  function updateStatus() {
    const statusTexts = {
      work: 'Focus Time',
      'short-break': 'Short Break',
      'long-break': 'Long Break',
    };

    if (timerState.isRunning) {
      elements.timerStatus.textContent = statusTexts[timerState.sessionType];
    } else if (timerState.isPaused) {
      elements.timerStatus.textContent = 'Paused';
    } else {
      elements.timerStatus.textContent = 'Ready to Start';
    }
  }

  // Update statistics
  function updateStats() {
    checkDateChange();

    elements.todayCount.textContent = timerState.completedPomodoros;

    const totalMinutes = timerState.completedPomodoros * 25;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    elements.todayTime.textContent = `${hours}h ${minutes}m`;

    // Calculate streak
    const streak = calculateStreak();
    elements.streak.textContent = `${streak} ${streak === 1 ? 'day' : 'days'}`;

    updateStatus();
  }

  // Calculate streak
  function calculateStreak() {
    const weeklyData = getWeeklyData();
    const dates = Object.keys(weeklyData).sort().reverse();

    if (dates.length === 0) return 0;

    let streak = 0;
    const today = new Date();

    for (let i = 0; i < dates.length; i++) {
      const date = new Date(dates[i]);
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);

      if (
        date.toDateString() === expectedDate.toDateString() &&
        weeklyData[dates[i]] > 0
      ) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  // Update tomatoes display
  function updateTomatoes() {
    elements.tomatoesGrid.innerHTML = '';

    if (timerState.completedPomodoros === 0) {
      elements.tomatoesGrid.innerHTML =
        '<div class="tomato-placeholder">Complete Pomodoros to see your tomatoes!</div>';
      return;
    }

    for (let i = 0; i < timerState.completedPomodoros; i++) {
      const tomato = document.createElement('div');
      tomato.className = 'tomato-item';
      tomato.innerHTML = '🍅';
      tomato.title = `Pomodoro ${i + 1}`;
      elements.tomatoesGrid.appendChild(tomato);
    }
  }

  // Update weekly chart
  function updateWeeklyChart() {
    const weeklyData = getWeeklyData();
    const today = new Date();
    const weekDays = [];

    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      weekDays.push({
        date: date.toDateString(),
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        count: weeklyData[date.toDateString()] || 0,
      });
    }

    elements.weeklyChart.innerHTML = '';

    const maxCount = Math.max(...weekDays.map((d) => d.count), 1);

    weekDays.forEach((day) => {
      const dayElement = document.createElement('div');
      dayElement.className = 'weekly-day';

      const bar = document.createElement('div');
      bar.className = 'weekly-bar';
      const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
      bar.style.height = `${height}%`;
      bar.title = `${day.count} Pomodoros`;

      const label = document.createElement('div');
      label.className = 'weekly-label';
      label.textContent = day.dayName;

      const count = document.createElement('div');
      count.className = 'weekly-count';
      count.textContent = day.count;

      dayElement.appendChild(bar);
      dayElement.appendChild(count);
      dayElement.appendChild(label);

      elements.weeklyChart.appendChild(dayElement);
    });
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Update stats every minute to check for date changes
  setInterval(() => {
    checkDateChange();
    updateStats();
  }, 60000);
})();
