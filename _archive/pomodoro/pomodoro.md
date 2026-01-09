---
layout: page
icon: fas fa-stopwatch
order: 4
---

## Pomodoro Timer 🍅

<div id="pomodoro-container">
  <!-- Timer Display -->
  <div class="pomodoro-timer-wrapper">
    <div class="pomodoro-timer-circle">
      <svg class="pomodoro-svg" viewBox="0 0 100 100">
        <circle class="pomodoro-circle-bg" cx="50" cy="50" r="45"></circle>
        <circle class="pomodoro-circle-progress" cx="50" cy="50" r="45" id="progress-circle"></circle>
      </svg>
      <div class="pomodoro-timer-display">
        <div class="pomodoro-time" id="timer-display">25:00</div>
        <div class="pomodoro-status" id="timer-status">Ready to Start</div>
      </div>
    </div>
  </div>

  <!-- Control Buttons -->
  <div class="pomodoro-controls">
    <button class="pomodoro-btn pomodoro-btn-primary" id="start-pause-btn">
      <i class="fas fa-play"></i> Start
    </button>
    <button class="pomodoro-btn pomodoro-btn-secondary" id="reset-btn">
      <i class="fas fa-redo"></i> Reset
    </button>
    <button class="pomodoro-btn pomodoro-btn-secondary" id="skip-btn">
      <i class="fas fa-forward"></i> Skip
    </button>
  </div>

  <!-- Session Type Selector -->
  <div class="pomodoro-session-selector">
    <div class="session-item">
      <button class="session-btn active" data-type="work" id="work-btn">
        <i class="fas fa-briefcase"></i> Work
      </button>
      <div class="time-input-wrapper">
        <input type="number" class="time-input" id="work-time-input" min="1" max="120" value="25" data-type="work">
        <span class="time-unit">min</span>
      </div>
    </div>
    <div class="session-item">
      <button class="session-btn" data-type="short-break" id="short-break-btn">
        <i class="fas fa-coffee"></i> Short Break
      </button>
      <div class="time-input-wrapper">
        <input type="number" class="time-input" id="short-break-time-input" min="1" max="60" value="5" data-type="short-break">
        <span class="time-unit">min</span>
      </div>
    </div>
    <div class="session-item">
      <button class="session-btn" data-type="long-break" id="long-break-btn">
        <i class="fas fa-moon"></i> Long Break
      </button>
      <div class="time-input-wrapper">
        <input type="number" class="time-input" id="long-break-time-input" min="1" max="60" value="15" data-type="long-break">
        <span class="time-unit">min</span>
      </div>
    </div>
  </div>

  <!-- Today's Progress -->
  <div class="pomodoro-stats">
    <div class="stats-card">
      <div class="stats-icon">🍅</div>
      <div class="stats-content">
        <div class="stats-label">Today's Pomodoros</div>
        <div class="stats-value" id="today-count">0</div>
      </div>
    </div>
    <div class="stats-card">
      <div class="stats-icon">⏱️</div>
      <div class="stats-content">
        <div class="stats-label">Total Time</div>
        <div class="stats-value" id="today-time">0h 0m</div>
      </div>
    </div>
    <div class="stats-card">
      <div class="stats-icon">🔥</div>
      <div class="stats-content">
        <div class="stats-label">Current Streak</div>
        <div class="stats-value" id="streak">0 days</div>
      </div>
    </div>
  </div>

  <!-- Today's Tomatoes -->
  <div class="pomodoro-tomatoes">
    <h3>Today's Tomatoes 🍅</h3>
    <div class="tomatoes-grid" id="tomatoes-grid">
      <div class="tomato-placeholder">Complete Pomodoros to see your tomatoes!</div>
    </div>
  </div>

  <!-- Weekly Statistics -->
  <div class="pomodoro-weekly">
    <h3>This Week</h3>
    <div class="weekly-chart" id="weekly-chart">
      <!-- Will be populated by JavaScript -->
    </div>
  </div>
</div>

<link rel="stylesheet" href="{{ '/assets/css/pomodoro.css' | relative_url }}">
<script src="{{ '/assets/js/pomodoro.js' | relative_url }}" defer></script>

