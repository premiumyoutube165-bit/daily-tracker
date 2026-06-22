// Reports Module: MT5 CSV Parser and Dynamic SVG Equity Curve Visualizer

import { ParserService } from '../services/parser.js';
import { StorageService } from '../services/storage.js';

export const ReportsModule = {
  container: null,
  currentReport: null,

  async init(container) {
    this.container = container;
    this.renderLayout();
    await this.loadSavedReport();
    this.setupListeners();
  },

  renderLayout() {
    this.container.innerHTML = `
      <div class="card" id="upload-card">
        <div class="card-title">Upload Data Log</div>
        <div class="card-subtitle">Select or drag a tab-separated CSV/TXT export file</div>
        
        <div class="dropzone mt-8" id="csv-dropzone">
          <svg class="dropzone-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
          </svg>
          <div class="dropzone-text">Tap to upload or drag CSV here</div>
          <div class="dropzone-subtext">Supports standard CSV/TSV log format</div>
          <input type="file" id="csv-file-input" accept=".csv,.txt" style="display: none;">
        </div>
      </div>

      <div id="report-dashboard" style="display: none;">
        <!-- KPI Cards Grid -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <span class="kpi-label">Success Rate</span>
            <span class="kpi-value" id="kpi-winrate">0.0%</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-label">Net Delta</span>
            <span class="kpi-value" id="kpi-profit">$0.00</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-label">Efficiency Index</span>
            <span class="kpi-value" id="kpi-factor">0.00</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-label">Max Retracement</span>
            <span class="kpi-value negative" id="kpi-drawdown">0.0%</span>
          </div>
        </div>

        <!-- SVG Equity Curve Chart -->
        <div class="card mt-16" style="padding-bottom: 8px;">
          <div class="card-title">
            <span>Performance Growth Curve</span>
            <span class="badge badge-muted" id="total-trades-badge">0 Entries</span>
          </div>
          <div class="card-subtitle">Cumulative metrics progress over time</div>
          
          <div class="chart-container" id="equity-chart-container">
            <svg class="chart-svg" id="equity-svg" viewBox="0 0 500 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.3"/>
                  <stop offset="100%" stop-color="var(--primary)" stop-opacity="0.0"/>
                </linearGradient>
              </defs>
              <g id="chart-grid-group"></g>
              <path class="chart-area" id="chart-area-path" d="" />
              <path class="chart-line" id="chart-line-path" d="" />
              <g id="chart-axes-group"></g>
              <g id="chart-labels-group"></g>
            </svg>
            <div class="chart-tooltip" id="chart-tooltip-bubble">
              <span id="tooltip-trade" style="font-weight: 600; color: var(--text-primary);">Entry #--</span>
              <span id="tooltip-balance" style="color: var(--secondary); font-weight: 700; margin-top: 2px;">$--</span>
              <span id="tooltip-date" style="font-size: 0.65rem; color: var(--text-secondary); margin-top: 1px;">--</span>
            </div>
          </div>
        </div>

        <!-- Advanced Metrics Panel -->
        <div class="card mt-16" id="reports-advanced-panel">
          <div class="card-title">Performance Analytics</div>
          <div class="card-subtitle">Advanced algorithmic metrics from log dataset</div>
          
          <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 8px;">
            <div class="flex-row" style="padding: 6px 0; border-bottom: 1px solid var(--border-color);">
              <span class="kpi-label">Average Hold Time:</span>
              <span id="adv-holdtime" style="font-weight: 600; color: var(--text-primary);">-- min</span>
            </div>
            
            <div class="kpi-grid">
              <div class="kpi-card" style="padding: 8px 10px;">
                <span class="kpi-label">Avg Gain (Positive)</span>
                <span class="kpi-value positive" id="adv-avgwin" style="font-size: 1.1rem;">+$0.00</span>
              </div>
              <div class="kpi-card" style="padding: 8px 10px;">
                <span class="kpi-label">Avg Loss (Negative)</span>
                <span class="kpi-value negative" id="adv-avgloss" style="font-size: 1.1rem;">-$0.00</span>
              </div>
            </div>

            <div class="kpi-grid">
              <div class="kpi-card" style="padding: 8px 10px;">
                <span class="kpi-label">Achieved Return Ratio</span>
                <span class="kpi-value" id="adv-rr" style="font-size: 1.1rem; color: var(--primary);">1 : 0.00</span>
              </div>
              <div class="kpi-card" style="padding: 8px 10px;">
                <span class="kpi-label">Expectation Coefficient</span>
                <span class="kpi-value" id="adv-expectancy" style="font-size: 1.1rem; color: var(--secondary);">$0.00</span>
              </div>
            </div>

            <div class="kpi-grid">
              <div class="kpi-card" style="padding: 8px 10px;">
                <span class="kpi-label">Max Entry Gain</span>
                <span class="kpi-value positive" id="adv-best" style="font-size: 1.1rem;">+$0.00</span>
              </div>
              <div class="kpi-card" style="padding: 8px 10px;">
                <span class="kpi-label">Max Entry Loss</span>
                <span class="kpi-value negative" id="adv-worst" style="font-size: 1.1rem;">-$0.00</span>
              </div>
            </div>

            <div class="kpi-card" style="padding: 10px; border: 1px solid var(--border-color); background: rgba(0,0,0,0.15);">
              <span class="kpi-label">Entry Type Distribution</span>
              <div class="flex-row mt-8" style="font-size: 0.82rem; gap: 16px;">
                <div style="flex: 1; text-align: center; border-right: 1px solid var(--border-color); padding-right: 8px;">
                  <div style="color: var(--primary); font-weight: 600;" id="adv-buy-count">Type A: 0 Entries</div>
                  <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;" id="adv-buy-winrate">Success Rate: 0%</div>
                </div>
                <div style="flex: 1; text-align: center;">
                  <div style="color: var(--secondary); font-weight: 600;" id="adv-sell-count">Type B: 0 Entries</div>
                  <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;" id="adv-sell-winrate">Success Rate: 0%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Summary & Actions -->
        <div class="card mt-16">
          <div class="card-title">Report Actions</div>
          <div class="flex-row">
            <div>
              <span class="kpi-label">Starting Capital:</span>
              <span id="txt-start-equity" style="font-weight: 600; color: var(--text-primary); margin-left: 6px;">$0.00</span>
            </div>
            <button class="btn btn-danger btn-small" id="btn-delete-report">Clear Log Data</button>
          </div>
        </div>
      </div>
    `;
  },

  setupListeners() {
    const dropzone = document.getElementById('csv-dropzone');
    const fileInput = document.getElementById('csv-file-input');

    if (dropzone && fileInput) {
      // Trigger file explorer
      dropzone.addEventListener('click', () => fileInput.click());

      // Drag events
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });

      ['dragleave', 'dragend'].forEach(type => {
        dropzone.addEventListener(type, () => dropzone.classList.remove('dragover'));
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          this.handleFile(files[0]);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          this.handleFile(e.target.files[0]);
        }
      });
    }

    // Delete button
    const deleteBtn = document.getElementById('btn-delete-report');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete the current forensic report?')) {
          this.clearReport();
        }
      });
    }
  },

  async loadSavedReport() {
    const report = await StorageService.getLatestReport();
    if (report) {
      this.currentReport = report;
      this.displayReport();
    }
  },

  handleFile(file) {
    const reader = new FileReader();

    // Check file encoding: MT5 reports are frequently exported in UTF-16 LE (wide characters)
    // We can read it as Text. If it looks like garbage, we can read it specifically as UTF-16LE.
    reader.onload = async (e) => {
      let rawText = e.target.result;
      
      // Basic heuristic to detect UTF-16: search for null bytes or missing linebreaks
      if (rawText.includes('\u0000')) {
        // Null bytes indicate UTF-16 read as UTF-8
        // Let's re-read the file using correct UTF-16 encoding
        const arrayBufferReader = new FileReader();
        arrayBufferReader.onload = async (ev) => {
          const arr = new Uint8Array(ev.target.result);
          // Convert Uint8Array to string via TextDecoder
          const decoder = new TextDecoder('utf-16le');
          const utf16Text = decoder.decode(arr);
          this.processTextReport(utf16Text);
        };
        arrayBufferReader.readAsArrayBuffer(file);
      } else {
        this.processTextReport(rawText);
      }
    };
    reader.readAsText(file);
  },

  async processTextReport(text) {
    try {
      const parsed = ParserService.parseMT5CSV(text);
      await StorageService.saveReport(parsed);
      this.currentReport = parsed;
      this.displayReport();
    } catch (err) {
      alert('Error parsing CSV: ' + err.message);
      console.error(err);
    }
  },

  async clearReport() {
    if (this.currentReport) {
      await StorageService.deleteReport(this.currentReport.id);
      this.currentReport = null;
      
      // Toggle visibility
      document.getElementById('report-dashboard').style.display = 'none';
      document.getElementById('upload-card').style.display = 'block';

      // Reset file input
      const fileInput = document.getElementById('csv-file-input');
      if (fileInput) fileInput.value = '';
    }
  },

  displayReport() {
    if (!this.currentReport) return;

    // Show dashboard, hide upload card
    document.getElementById('upload-card').style.display = 'none';
    const dashboard = document.getElementById('report-dashboard');
    dashboard.style.display = 'block';

    const kpis = this.currentReport.kpis;

    // Setup KPIs values
    const winrateEl = document.getElementById('kpi-winrate');
    const profitEl = document.getElementById('kpi-profit');
    const factorEl = document.getElementById('kpi-factor');
    const drawdownEl = document.getElementById('kpi-drawdown');
    const badgeEl = document.getElementById('total-trades-badge');
    const startEquityEl = document.getElementById('txt-start-equity');

    if (winrateEl) winrateEl.textContent = `${kpis.winRate.toFixed(1)}%`;
    if (profitEl) {
      const isPositive = kpis.netProfit >= 0;
      profitEl.textContent = `${isPositive ? '+' : ''}$${kpis.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      profitEl.className = `kpi-value ${isPositive ? 'positive' : 'negative'}`;
    }
    if (factorEl) {
      factorEl.textContent = kpis.profitFactor === Infinity ? 'N/A' : kpis.profitFactor.toFixed(2);
      factorEl.style.color = kpis.profitFactor >= 1.5 ? 'var(--success)' : (kpis.profitFactor >= 1.0 ? 'var(--primary)' : 'var(--text-secondary)');
    }
    if (drawdownEl) drawdownEl.textContent = `-${kpis.maxDrawdown.toFixed(2)}%`;
    if (badgeEl) badgeEl.textContent = `${kpis.totalTrades} Entries`;
    if (startEquityEl) startEquityEl.textContent = `$${kpis.initialBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Setup Advanced KPIs values
    const advHoldTime = document.getElementById('adv-holdtime');
    const advAvgWin = document.getElementById('adv-avgwin');
    const advAvgLoss = document.getElementById('adv-avgloss');
    const advRR = document.getElementById('adv-rr');
    const advExpectancy = document.getElementById('adv-expectancy');
    const advBest = document.getElementById('adv-best');
    const advWorst = document.getElementById('adv-worst');
    const advBuyCount = document.getElementById('adv-buy-count');
    const advBuyWinRate = document.getElementById('adv-buy-winrate');
    const advSellCount = document.getElementById('adv-sell-count');
    const advSellWinRate = document.getElementById('adv-sell-winrate');

    if (advHoldTime) {
      if (kpis.avgHoldingTimeMin > 0) {
        const h = Math.floor(kpis.avgHoldingTimeMin / 60);
        const m = Math.round(kpis.avgHoldingTimeMin % 60);
        advHoldTime.textContent = h > 0 ? `${h}h ${m}m` : `${m} minutes`;
      } else {
        advHoldTime.textContent = 'N/A (No open/close timestamp pairs)';
      }
    }

    if (advAvgWin) advAvgWin.textContent = `+$${kpis.avgWin.toFixed(2)}`;
    if (advAvgLoss) advAvgLoss.textContent = `-$${kpis.avgLoss.toFixed(2)}`;
    if (advRR) {
      advRR.textContent = `1 : ${kpis.riskRewardAchieved.toFixed(2)}`;
      advRR.style.color = kpis.riskRewardAchieved >= 1.5 ? 'var(--success)' : (kpis.riskRewardAchieved >= 1.0 ? 'var(--primary)' : 'var(--text-secondary)');
    }
    if (advExpectancy) {
      const isPositive = kpis.expectancy >= 0;
      advExpectancy.textContent = `${isPositive ? '+' : ''}$${kpis.expectancy.toFixed(2)}`;
      advExpectancy.style.color = isPositive ? 'var(--success)' : 'var(--danger)';
    }
    if (advBest) advBest.textContent = `+$${kpis.bestTrade.toFixed(2)}`;
    if (advWorst) advWorst.textContent = `-$${Math.abs(kpis.worstTrade).toFixed(2)}`;
    
    if (advBuyCount) advBuyCount.textContent = `Type A: ${kpis.buyCount} Entries`;
    if (advBuyWinRate) advBuyWinRate.textContent = `Success Rate: ${kpis.buyWinRate.toFixed(1)}%`;
    if (advSellCount) advSellCount.textContent = `Type B: ${kpis.sellCount} Entries`;
    if (advSellWinRate) advSellWinRate.textContent = `Success Rate: ${kpis.sellWinRate.toFixed(1)}%`;

    // Draw SVG Chart
    this.renderSVGChart();
  },

  renderSVGChart() {
    const svg = document.getElementById('equity-svg');
    const gridGroup = document.getElementById('chart-grid-group');
    const axesGroup = document.getElementById('chart-axes-group');
    const labelsGroup = document.getElementById('chart-labels-group');
    const linePath = document.getElementById('chart-line-path');
    const areaPath = document.getElementById('chart-area-path');

    if (!svg || !linePath || !areaPath) return;

    // Reset SVGs children
    gridGroup.innerHTML = '';
    axesGroup.innerHTML = '';
    labelsGroup.innerHTML = '';

    const curve = this.currentReport.equityCurve;
    if (!curve || curve.length === 0) return;

    // Dimensions (defined in viewBox="0 0 500 200")
    const W = 500;
    const H = 200;
    const padTop = 15;
    const padBottom = 20;
    const padLeft = 50;
    const padRight = 15;

    const renderW = W - padLeft - padRight;
    const renderH = H - padTop - padBottom;

    // Get min and max balances
    const balances = curve.map(c => c.balance);
    let maxVal = Math.max(...balances);
    let minVal = Math.min(...balances);

    // Padding for margins
    const valDiff = maxVal - minVal;
    if (valDiff === 0) {
      maxVal += 1000;
      minVal -= 1000;
    } else {
      maxVal += valDiff * 0.08;
      minVal -= valDiff * 0.08;
    }

    const valueRange = maxVal - minVal;

    // Coordinates converter
    const getCoords = (index, val) => {
      const x = padLeft + (index / (curve.length - 1)) * renderW;
      const y = (padTop + renderH) - ((val - minVal) / valueRange) * renderH;
      return { x, y };
    };

    // Build the SVG path points
    let pathString = '';
    const points = [];

    curve.forEach((pt, index) => {
      const { x, y } = getCoords(index, pt.balance);
      points.push({ x, y, data: pt, index: index });
      if (index === 0) {
        pathString += `M ${x} ${y}`;
      } else {
        pathString += ` L ${x} ${y}`;
      }
    });

    linePath.setAttribute('d', pathString);

    // Build filled area path
    const { x: startX } = getCoords(0, curve[0].balance);
    const { x: endX } = getCoords(curve.length - 1, curve[curve.length - 1].balance);
    const areaString = `${pathString} L ${endX} ${padTop + renderH} L ${startX} ${padTop + renderH} Z`;
    areaPath.setAttribute('d', areaString);

    // Draw Y-Axis Grid Lines & Labels (3 sections)
    const yLinesCount = 3;
    for (let i = 0; i <= yLinesCount; i++) {
      const val = minVal + (i / yLinesCount) * valueRange;
      const { y } = getCoords(0, val);
      
      // Grid line
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', padLeft);
      line.setAttribute('y1', y);
      line.setAttribute('x2', W - padRight);
      line.setAttribute('y2', y);
      line.setAttribute('class', 'chart-grid');
      gridGroup.appendChild(line);

      // Y-Label
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', padLeft - 6);
      text.setAttribute('y', y + 3);
      text.setAttribute('text-anchor', 'end');
      text.setAttribute('class', 'chart-label');
      text.textContent = `$${Math.round(val)}`;
      labelsGroup.appendChild(text);
    }

    // Draw X-Axis Labels (2 points: start date, end date)
    if (curve.length > 1) {
      // Start label
      const sText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      sText.setAttribute('x', padLeft);
      sText.setAttribute('y', H - 6);
      sText.setAttribute('text-anchor', 'start');
      sText.setAttribute('class', 'chart-label');
      
      // Parse first trade date nicely (excluding "Start")
      const firstRealDate = curve[1] ? curve[1].time.split(' ')[0] : 'Start';
      sText.textContent = firstRealDate;
      labelsGroup.appendChild(sText);

      // End label
      const eText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      eText.setAttribute('x', W - padRight);
      eText.setAttribute('y', H - 6);
      eText.setAttribute('text-anchor', 'end');
      eText.setAttribute('class', 'chart-label');
      const lastRealDate = curve[curve.length - 1].time.split(' ')[0];
      eText.textContent = lastRealDate;
      labelsGroup.appendChild(eText);
    }

    // Set up hover pointer vertical line
    const hoverLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    hoverLine.setAttribute('x1', 0);
    hoverLine.setAttribute('y1', padTop);
    hoverLine.setAttribute('x2', 0);
    hoverLine.setAttribute('y2', padTop + renderH);
    hoverLine.setAttribute('stroke', 'rgba(99, 102, 241, 0.4)');
    hoverLine.setAttribute('stroke-width', '1');
    hoverLine.setAttribute('stroke-dasharray', '3,3');
    hoverLine.style.display = 'none';
    axesGroup.appendChild(hoverLine);

    // Set up hover bubble pointer dot
    const hoverDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    hoverDot.setAttribute('r', '4');
    hoverDot.setAttribute('fill', 'var(--secondary)');
    hoverDot.setAttribute('stroke', 'var(--bg-color)');
    hoverDot.setAttribute('stroke-width', '1.5');
    hoverDot.style.display = 'none';
    hoverDot.style.filter = 'drop-shadow(0 0 3px var(--secondary))';
    axesGroup.appendChild(hoverDot);

    // Setup interactive tooltip bubble
    const container = document.getElementById('equity-chart-container');
    const tooltip = document.getElementById('chart-tooltip-bubble');
    const tTrade = document.getElementById('tooltip-trade');
    const tBalance = document.getElementById('tooltip-balance');
    const tDate = document.getElementById('tooltip-date');

    if (container && tooltip) {
      const onMouseMove = (e) => {
        const rect = container.getBoundingClientRect();
        // Calculate standard canvas-relative coordinates
        const touchX = e.clientX || (e.touches && e.touches[0].clientX);
        if (!touchX) return;

        const xPos = touchX - rect.left;
        
        // Convert screen-x to viewBox coordinate (500 width)
        const svgX = (xPos / rect.width) * W;

        // Find closest point in points array
        let closest = points[0];
        let minDist = Math.abs(points[0].x - svgX);

        points.forEach(pt => {
          const d = Math.abs(pt.x - svgX);
          if (d < minDist) {
            minDist = d;
            closest = pt;
          }
        });

        if (closest && closest.x >= padLeft && closest.x <= W - padRight) {
          // Show tooltip
          hoverLine.setAttribute('x1', closest.x);
          hoverLine.setAttribute('x2', closest.x);
          hoverLine.style.display = 'block';

          hoverDot.setAttribute('cx', closest.x);
          hoverDot.setAttribute('cy', closest.y);
          hoverDot.style.display = 'block';

          // Position tooltip
          // Convert viewBox coordinate to pixel position
          const pixelX = (closest.x / W) * rect.width;
          const pixelY = (closest.y / H) * rect.height;

          tooltip.style.opacity = '1';
          // Place tooltip above the dot, horizontally centered
          tooltip.style.left = `${pixelX}px`;
          tooltip.style.top = `${pixelY - 60}px`;
          tooltip.style.transform = 'translateX(-50%)';

          // Update texts
          if (closest.index === 0) {
            tTrade.textContent = 'Account Start';
            tBalance.textContent = `$${closest.data.balance.toFixed(2)}`;
            tDate.textContent = 'Initial Balance';
          } else {
            tTrade.textContent = `Trade #${closest.index}`;
            tBalance.textContent = `$${closest.data.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            tDate.textContent = closest.data.time;
          }
        }
      };

      const onMouseLeave = () => {
        hoverLine.style.display = 'none';
        hoverDot.style.display = 'none';
        tooltip.style.opacity = '0';
      };

      // Handle both mouse and touch events for mobile
      container.addEventListener('mousemove', onMouseMove);
      container.addEventListener('mouseleave', onMouseLeave);
      container.addEventListener('touchstart', onMouseMove, { passive: true });
      container.addEventListener('touchmove', onMouseMove, { passive: true });
      container.addEventListener('touchend', onMouseLeave);
    }
  }
};
