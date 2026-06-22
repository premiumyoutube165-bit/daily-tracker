// Sessions Module: Market Session Tracker (Tokyo, London, New York) adjusted for UTC+6 with dynamic DST

function isLondonDST(d) {
  const year = d.getFullYear();
  // Last Sunday of March
  const mar31 = new Date(Date.UTC(year, 2, 31));
  const marLastSun = new Date(Date.UTC(year, 2, 31 - mar31.getUTCDay(), 1));
  // Last Sunday of October
  const oct31 = new Date(Date.UTC(year, 9, 31));
  const octLastSun = new Date(Date.UTC(year, 9, 31 - oct31.getUTCDay(), 1));
  return d >= marLastSun && d < octLastSun;
}

function isNewYorkDST(d) {
  const year = d.getFullYear();
  // Second Sunday of March
  let marSecondSun = new Date(Date.UTC(year, 2, 8));
  while (marSecondSun.getUTCDay() !== 0) {
    marSecondSun.setUTCDate(marSecondSun.getUTCDate() + 1);
  }
  marSecondSun.setUTCHours(7); // 02:00 EST is 07:00 UTC

  // First Sunday of November
  let novFirstSun = new Date(Date.UTC(year, 10, 1));
  while (novFirstSun.getUTCDay() !== 0) {
    novFirstSun.setUTCDate(novFirstSun.getUTCDate() + 1);
  }
  novFirstSun.setUTCHours(6); // 02:00 EDT is 06:00 UTC

  return d >= marSecondSun && d < novFirstSun;
}

export const SessionsModule = {
  container: null,
  timerId: null,

  init(container) {
    this.container = container;
    this.renderLayout();
    this.startTicker();
  },

  renderLayout() {
    this.container.innerHTML = `
      <div class="card">
        <div class="card-title">
          <span>Session Timelines</span>
          <span class="badge badge-success" id="sessions-utc6-badge">UTC+6</span>
        </div>
        <div class="card-subtitle">Real-time status adjusted for your timezone</div>
        
        <div class="text-center mt-8" style="padding: 12px 0;">
          <div id="sessions-clock" style="font-family: 'Outfit', sans-serif; font-size: 2.2rem; font-weight: 800; letter-spacing: 0.05em; color: var(--text-primary);">00:00:00</div>
          <div id="sessions-date" style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">Monday, June 15, 2026</div>
        </div>

        <div class="flex-row mt-8" style="padding: 8px 12px; background: rgba(0,0,0,0.15); border-radius: 8px; font-size: 0.8rem;">
          <div>London DST: <span id="dst-london-status" class="text-success">-</span></div>
          <div>New York DST: <span id="dst-ny-status" class="text-success">-</span></div>
        </div>
        <div id="sessions-overlap-card" style="margin-top: 10px; padding: 10px 12px; background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); border-radius: 8px; font-size: 0.82rem; line-height: 1.4;">
          <div style="display: flex; align-items: center; justify-content: space-between; font-weight: 600; margin-bottom: 2px;">
            <span>Active Overlap Info</span>
            <span class="badge badge-danger" id="overlap-indicator" style="display: none;">High Volatility</span>
          </div>
          <div id="sessions-overlap-text" style="color: var(--text-secondary); font-size: 0.78rem;">Detecting active market overlaps...</div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Timeline & Countdowns</div>
        <div class="card-subtitle">Active sessions are highlighted below</div>
        
        <div class="checklist-list mt-8" style="gap: 12px;">
          <!-- Tokyo Session -->
          <div class="session-bar" id="session-tokyo">
            <div class="session-info">
              <div>
                <span class="session-name">Tokyo (Asia)</span>
                <span class="badge badge-muted" id="status-badge-tokyo">Closed</span>
              </div>
              <span class="session-hours" id="hours-tokyo">06:00 - 15:00</span>
            </div>
            <div class="session-timeline-bg">
              <div class="session-progress-fill" id="fill-tokyo"></div>
              <div class="session-current-indicator" id="indicator-tokyo"></div>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); display: flex; justify-content: space-between;">
              <span id="countdown-label-tokyo">Opens in:</span>
              <span id="countdown-val-tokyo" style="font-weight: 600; font-family: 'Outfit';">--h --m --s</span>
            </div>
          </div>

          <!-- London Session -->
          <div class="session-bar" id="session-london">
            <div class="session-info">
              <div>
                <span class="session-name">London (Europe)</span>
                <span class="badge badge-muted" id="status-badge-london">Closed</span>
              </div>
              <span class="session-hours" id="hours-london">14:00 - 22:00</span>
            </div>
            <div class="session-timeline-bg">
              <div class="session-progress-fill" id="fill-london"></div>
              <div class="session-current-indicator" id="indicator-london"></div>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); display: flex; justify-content: space-between;">
              <span id="countdown-label-london">Opens in:</span>
              <span id="countdown-val-london" style="font-weight: 600; font-family: 'Outfit';">--h --m --s</span>
            </div>
          </div>

          <!-- New York Session -->
          <div class="session-bar" id="session-ny">
            <div class="session-info">
              <div>
                <span class="session-name">New York (US)</span>
                <span class="badge badge-muted" id="status-badge-ny">Closed</span>
              </div>
              <span class="session-hours" id="hours-ny">19:00 - 03:00</span>
            </div>
            <div class="session-timeline-bg">
              <div class="session-progress-fill" id="fill-ny"></div>
              <div class="session-current-indicator" id="indicator-ny"></div>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); display: flex; justify-content: space-between;">
              <span id="countdown-label-ny">Opens in:</span>
              <span id="countdown-val-ny" style="font-weight: 600; font-family: 'Outfit';">--h --m --s</span>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  startTicker() {
    this.updateClockAndTimelines();
    this.timerId = setInterval(() => this.updateClockAndTimelines(), 1000);
  },

  destroy() {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  },

  updateClockAndTimelines() {
    // Current local system time
    const now = new Date();
    
    // Format UTC+6 Local Time Display
    // Note: To display a true UTC+6 clock (independent of client OS offset if it is different, but user's local time is UTC+6 according to metadata)
    // We will calculate current time in UTC+6
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const localUTC6Time = new Date(utcTime + (3600000 * 6));

    const hours = String(localUTC6Time.getHours()).padStart(2, '0');
    const mins = String(localUTC6Time.getMinutes()).padStart(2, '0');
    const secs = String(localUTC6Time.getSeconds()).padStart(2, '0');
    
    const clockEl = document.getElementById('sessions-clock');
    if (clockEl) clockEl.textContent = `${hours}:${mins}:${secs}`;

    const dateEl = document.getElementById('sessions-date');
    if (dateEl) {
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      dateEl.textContent = localUTC6Time.toLocaleDateString('en-US', options);
    }

    // DST Checks
    const londonDST = isLondonDST(now);
    const nyDST = isNewYorkDST(now);

    const dstLondonEl = document.getElementById('dst-london-status');
    const dstNyEl = document.getElementById('dst-ny-status');
    if (dstLondonEl) dstLondonEl.textContent = londonDST ? 'ACTIVE (BST)' : 'INACTIVE (GMT)';
    if (dstNyEl) dstNyEl.textContent = nyDST ? 'ACTIVE (EDT)' : 'INACTIVE (EST)';

    // Define Session Times in UTC Hours
    // Tokyo: 00:00 - 09:00 UTC
    // London: 08:00 - 16:00 London local
    // New York: 08:00 - 17:00 NY local

    const tokyoStartUTC = 0;
    const tokyoEndUTC = 9;

    const londonStartUTC = londonDST ? 7 : 8; // 08:00 BST = 07:00 UTC, 08:00 GMT = 08:00 UTC
    const londonEndUTC = londonDST ? 15 : 16;  // 16:00 BST = 15:00 UTC, 16:00 GMT = 16:00 UTC

    const nyStartUTC = nyDST ? 12 : 13;       // 08:00 EDT = 12:00 UTC, 08:00 EST = 13:00 UTC
    const nyEndUTC = nyDST ? 21 : 22;         // 17:00 EDT = 21:00 UTC, 17:00 EST = 22:00 UTC

    // Calculate dynamic overlaps
    const currentUTCHour = now.getUTCHours();
    const isTokyoActive = currentUTCHour >= tokyoStartUTC && currentUTCHour < tokyoEndUTC;
    const isLondonActive = currentUTCHour >= londonStartUTC && currentUTCHour < londonEndUTC;
    const isNyActive = currentUTCHour >= nyStartUTC && currentUTCHour < nyEndUTC;

    let overlapText = '';
    let hasOverlap = false;

    if (isLondonActive && isNyActive) {
      overlapText = "⚡ **London & New York Overlap**: The most active period of the day. Volatility is at peak. Focus on breakouts and momentum moves on EUR, GBP, USD.";
      hasOverlap = true;
    } else if (isTokyoActive && isLondonActive) {
      overlapText = "📈 **Tokyo & London Overlap**: Shift in activity from Asian desks to European desks. Good for trading GBP & EUR cross trends.";
      hasOverlap = true;
    } else if (isTokyoActive && isNyActive) {
      overlapText = "🌐 **New York & Tokyo Overlap**: Late US session crossing into Tokyo open. Low-medium volume. Spreads may widen.";
      hasOverlap = true;
    } else {
      if (isLondonActive) {
        overlapText = "🇪🇺 **London Session Active**: High activity. Trend continuations are common. Focus on GBP, EUR, CHF.";
      } else if (isNyActive) {
        overlapText = "🇺🇸 **New York Session Active**: High volume, especially during early hours. Focus on USD, CAD, Indices.";
      } else if (isTokyoActive) {
        overlapText = "🇯🇵 **Tokyo Session Active**: Primary Asian activity period. Focus on JPY, AUD, NZD crosses.";
      } else {
        overlapText = "💤 **Transition Window**: Between major sessions. Spreads may widen. Recommend caution or waiting for session opens.";
      }
    }

    const overlapTextEl = document.getElementById('sessions-overlap-text');
    const overlapIndicator = document.getElementById('overlap-indicator');
    const overlapCard = document.getElementById('sessions-overlap-card');

    if (overlapTextEl) {
      overlapTextEl.innerHTML = overlapText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    }
    if (overlapIndicator && overlapCard) {
      if (hasOverlap) {
        overlapIndicator.style.display = 'inline-flex';
        overlapCard.style.borderColor = 'rgba(244, 63, 94, 0.4)';
        overlapCard.style.background = 'rgba(244, 63, 94, 0.03)';
      } else {
        overlapIndicator.style.display = 'none';
        overlapCard.style.borderColor = 'var(--border-color)';
        overlapCard.style.background = 'rgba(255, 255, 255, 0.02)';
      }
    }

    // Update individual sessions
    this.updateSessionUI('tokyo', tokyoStartUTC, tokyoEndUTC, localUTC6Time, now);
    this.updateSessionUI('london', londonStartUTC, londonEndUTC, localUTC6Time, now);
    this.updateSessionUI('ny', nyStartUTC, nyEndUTC, localUTC6Time, now);
  },

  updateSessionUI(id, startUTC, endUTC, localTime, rawNow) {
    const startHourLocal = (startUTC + 6) % 24;
    const endHourLocal = (endUTC + 6) % 24;
    
    // Display bounds
    const hoursEl = document.getElementById(`hours-${id}`);
    if (hoursEl) {
      hoursEl.textContent = `${String(startHourLocal).padStart(2, '0')}:00 - ${String(endHourLocal).padStart(2, '0')}:00`;
    }

    // Determine current UTC fraction of day
    const utcHoursDecimal = rawNow.getUTCHours() + rawNow.getUTCMinutes() / 60 + rawNow.getUTCSeconds() / 3600;
    const localHoursDecimal = (utcHoursDecimal + 6) % 24;

    // Check if session is active
    let isActive = false;
    let progressPct = 0;
    let secondsToNextEvent = 0;
    let eventIsClose = false; // true if session is active and counting to close, false if inactive counting to open

    if (startUTC < endUTC) {
      // Session does not cross UTC midnight
      if (rawNow.getUTCHours() >= startUTC && rawNow.getUTCHours() < endUTC) {
        isActive = true;
      }
    } else {
      // Session crosses UTC midnight (e.g. NY session crosses midnight in UTC+6, NY standard is 13:00 - 22:00 UTC, NY summer is 12:00 - 21:00 UTC. Wait, in standard time: 13:00 to 22:00 UTC, so it does not cross midnight UTC. In summer time, 12:00 to 21:00 UTC. It also doesn't cross midnight UTC.
      // But let's write cross midnight logic just in case:
      if (rawNow.getUTCHours() >= startUTC || rawNow.getUTCHours() < endUTC) {
        isActive = true;
      }
    }

    // Adjust for sessions crossing midnight local (like NY session in UTC+6: 18:00 to 03:00 / 19:00 to 04:00)
    // Let's compute countdowns and timeline fills in UTC to avoid complex local date boundaries
    const nowMs = rawNow.getUTCHours() * 3600000 + rawNow.getUTCMinutes() * 60000 + rawNow.getUTCSeconds() * 1000;
    const startMs = startUTC * 3600000;
    const endMs = endUTC * 3600000;

    if (isActive) {
      eventIsClose = true;
      // Calculate countdown to close
      let closeMs = endMs;
      if (closeMs < startMs) closeMs += 24 * 3600000; // Crosses midnight
      let diffMs = closeMs - nowMs;
      if (diffMs < 0) diffMs += 24 * 3600000; // safety check
      secondsToNextEvent = Math.floor(diffMs / 1000);

      // Session progress timeline fill
      let totalDuration = closeMs - startMs;
      let elapsed = nowMs - startMs;
      if (elapsed < 0) elapsed += 24 * 3600000;
      progressPct = (elapsed / totalDuration) * 100;
    } else {
      eventIsClose = false;
      // Calculate countdown to open
      let diffMs = startMs - nowMs;
      if (diffMs < 0) diffMs += 24 * 3600000;
      secondsToNextEvent = Math.floor(diffMs / 1000);
      progressPct = 0;
    }

    // Update DOM elements
    const barEl = document.getElementById(`session-${id}`);
    const badgeEl = document.getElementById(`status-badge-${id}`);
    const fillEl = document.getElementById(`fill-${id}`);
    const indicatorEl = document.getElementById(`indicator-${id}`);
    const cdtLabelEl = document.getElementById(`countdown-label-${id}`);
    const cdtValEl = document.getElementById(`countdown-val-${id}`);

    if (barEl) {
      if (isActive) {
        barEl.classList.add('active');
      } else {
        barEl.classList.remove('active');
      }
    }

    if (badgeEl) {
      if (isActive) {
        badgeEl.textContent = 'Active';
        badgeEl.className = 'badge badge-success';
      } else {
        badgeEl.textContent = 'Closed';
        badgeEl.className = 'badge badge-muted';
      }
    }

    // Custom linear timeline visualization (relative to full local day 00:00 to 24:00)
    // Instead of simple loading bar of the active session, let's map the full day (00:00 to 24:00 local time)
    // Tokyo session ranges from 06:00 to 15:00 local (9 hours).
    // London ranges from 14:00 to 22:00 local (8 hours).
    // NY ranges from 19:00 to 03:00 local (9 hours).
    // We can show the actual session block on the 24h progress bar, and show current time as a sliding dot!
    // Let's set the timeline background's active section using a linear gradient!
    // This is EXTREMELY professional and visually impressive.
    // e.g. London starts at 14:00 (58.3% of the day) and ends at 22:00 (91.6% of the day)
    const startDayPct = (startHourLocal / 24) * 100;
    let endDayPct = (endHourLocal / 24) * 100;

    let gradientStr = '';
    if (startHourLocal < endHourLocal) {
      gradientStr = `linear-gradient(90deg, 
        rgba(255,255,255,0.05) 0%, 
        rgba(255,255,255,0.05) ${startDayPct}%, 
        var(--card-bg-elevated) ${startDayPct}%, 
        var(--card-bg-elevated) ${endDayPct}%, 
        rgba(255,255,255,0.05) ${endDayPct}%, 
        rgba(255,255,255,0.05) 100%)`;
    } else {
      // Crosses local midnight (e.g. 19:00 to 03:00)
      gradientStr = `linear-gradient(90deg, 
        var(--card-bg-elevated) 0%, 
        var(--card-bg-elevated) ${endDayPct}%, 
        rgba(255,255,255,0.05) ${endDayPct}%, 
        rgba(255,255,255,0.05) ${startDayPct}%, 
        var(--card-bg-elevated) ${startDayPct}%, 
        var(--card-bg-elevated) 100%)`;
    }

    const timelineBgEl = barEl ? barEl.querySelector('.session-timeline-bg') : null;
    if (timelineBgEl) {
      timelineBgEl.style.background = gradientStr;
    }

    // Set filling progress: if active, highlight current elapsed time inside the session block
    // Or simpler and visually cleaner:
    // Display the current time's sliding dot at localHoursDecimal/24
    if (fillEl) {
      if (isActive) {
        if (startHourLocal < endHourLocal) {
          fillEl.style.left = `${startDayPct}%`;
          fillEl.style.width = `${((localHoursDecimal - startHourLocal) / 24) * 100}%`;
        } else {
          // Crosses local midnight (like NY)
          if (localHoursDecimal >= startHourLocal) {
            fillEl.style.left = `${startDayPct}%`;
            fillEl.style.width = `${((localHoursDecimal - startHourLocal) / 24) * 100}%`;
          } else {
            fillEl.style.left = `0%`;
            fillEl.style.width = `${(localHoursDecimal / 24) * 100}%`;
          }
        }
      } else {
        fillEl.style.width = '0%';
      }
    }

    if (indicatorEl) {
      indicatorEl.style.left = `${(localHoursDecimal / 24) * 100}%`;
    }

    // Format countdown timer
    const h = Math.floor(secondsToNextEvent / 3600);
    const m = Math.floor((secondsToNextEvent % 3600) / 60);
    const s = secondsToNextEvent % 60;
    const cdtStr = `${h}h ${m}m ${s}s`;

    if (cdtLabelEl) {
      cdtLabelEl.textContent = eventIsClose ? 'Closes in:' : 'Opens in:';
    }
    if (cdtValEl) {
      cdtValEl.textContent = cdtStr;
      if (isActive) {
        cdtValEl.style.color = 'var(--secondary)';
      } else {
        cdtValEl.style.color = 'var(--text-secondary)';
      }
    }
  }
};
