// Calculators Module: Position Size, Risk/Reward, and Pip Value Calculators

export const CalculatorsModule = {
  container: null,
  activeTab: 'position', // 'position' | 'riskreward' | 'pipvalue'

  init(container) {
    this.container = container;
    this.render();
  },

  render() {
    this.container.innerHTML = `
      <div class="card">
        <div class="card-title">Value & Ratio Calculators</div>
        <div class="card-subtitle">Calculate variables and ratio parameters instantly</div>
        
        <div class="tab-switcher mt-8">
          <button class="tab-btn ${this.activeTab === 'position' ? 'active' : ''}" id="tab-btn-position">Scale Size</button>
          <button class="tab-btn ${this.activeTab === 'riskreward' ? 'active' : ''}" id="tab-btn-riskreward">Risk/Reward</button>
          <button class="tab-btn ${this.activeTab === 'pipvalue' ? 'active' : ''}" id="tab-btn-pipvalue">Point Value</button>
        </div>
      </div>

      <div id="calculator-form-container">
        <!-- Form injected dynamically based on active tab -->
      </div>
    `;

    this.renderActiveTabForm();
    this.setupListeners();
  },

  renderActiveTabForm() {
    const formContainer = document.getElementById('calculator-form-container');
    if (!formContainer) return;

    if (this.activeTab === 'position') {
      formContainer.innerHTML = `
        <div class="card">
          <div class="card-title">Scale Size Calculator</div>
          
          <div class="form-group mt-8">
            <label class="form-label">Baseline Balance ($)</label>
            <input type="number" class="form-control" id="pos-balance" value="10000" step="100">
          </div>

          <div class="kpi-grid">
            <div class="form-group">
              <label class="form-label">Risk Margin (%)</label>
              <input type="number" class="form-control" id="pos-risk-pct" value="1" step="0.1" min="0.1" max="10">
            </div>
            <div class="form-group">
              <label class="form-label">Target Offset (Units)</label>
              <input type="number" class="form-control" id="pos-sl-pips" value="15" step="1">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Asset Category</label>
            <select class="form-control" id="pos-pair">
              <option value="USD_QUOTE">EUR/USD, GBP/USD, AUD/USD, NZD/USD</option>
              <option value="JPY_QUOTE">USD/JPY, EUR/JPY, GBP/JPY</option>
              <option value="CAD_QUOTE">USD/CAD, EUR/CAD</option>
              <option value="CHF_QUOTE">USD/CHF, EUR/CHF</option>
            </select>
          </div>

          <div class="form-group" id="pos-rate-group" style="display: none;">
            <label class="form-label" id="pos-rate-label">Exchange Coefficient (e.g. USD/JPY)</label>
            <input type="number" class="form-control" id="pos-rate" value="150.00" step="0.01">
          </div>

          <div class="kpi-grid mt-16" style="background: rgba(255,255,255,0.01); border: 1px solid var(--border-color); border-radius: 12px; padding: 12px;">
            <div class="kpi-card" style="border: none; background: transparent;">
              <span class="kpi-label">Risk Amount</span>
              <span class="kpi-value negative" id="pos-result-risk-cash">-$100.00</span>
            </div>
            <div class="kpi-card" style="border: none; background: transparent;">
              <span class="kpi-label">Required Volume</span>
              <span class="kpi-value positive" id="pos-result-lots" style="color: var(--primary); text-shadow: 0 0 8px rgba(99, 102, 241, 0.2);">0.67 Lots</span>
            </div>
          </div>
        </div>
      `;
      this.calculatePositionSize();
      this.setupPositionSizeListeners();

    } else if (this.activeTab === 'riskreward') {
      formContainer.innerHTML = `
        <div class="card">
          <div class="card-title">Ratio & Risk Calculator</div>
          
          <div class="form-group mt-8">
            <label class="form-label">Projection Angle</label>
            <div class="tab-switcher" style="padding: 2px;">
              <button class="tab-btn active" id="rr-type-long" style="background: rgba(16, 185, 129, 0.1); color: var(--success);">Upside (Long)</button>
              <button class="tab-btn" id="rr-type-short">Downside (Short)</button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Entry Level</label>
            <input type="number" class="form-control" id="rr-entry" value="1.1000" step="0.0001">
          </div>

          <div class="kpi-grid">
            <div class="form-group">
              <label class="form-label">Offset Level</label>
              <input type="number" class="form-control" id="rr-sl" value="1.0980" step="0.0001">
            </div>
            <div class="form-group">
              <label class="form-label">Limit Level</label>
              <input type="number" class="form-control" id="rr-tp" value="1.1050" step="0.0001">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Target Volume (Standard Units)</label>
            <input type="number" class="form-control" id="rr-lots" value="1.0" step="0.1">
          </div>

          <div class="form-group">
            <label class="form-label">Increment Multiplier ($ per Lot)</label>
            <input type="number" class="form-control" id="rr-pipval" value="10.0" step="0.1">
          </div>

          <div class="kpi-grid mt-16" style="background: rgba(255,255,255,0.01); border: 1px solid var(--border-color); border-radius: 12px; padding: 12px; grid-template-columns: repeat(3, 1fr);">
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
              <span class="kpi-label">Offset (Points)</span>
              <span class="kpi-value negative" id="rr-result-risk-pips" style="font-size: 1.2rem;">20.0</span>
              <span class="kpi-label" id="rr-result-risk-cash" style="font-size: 0.7rem; margin-top: 2px;">-$200.00</span>
            </div>
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; border-left: 1px solid var(--border-color); border-right: 1px solid var(--border-color);">
              <span class="kpi-label">Ratio (R:R)</span>
              <span class="kpi-value" id="rr-result-ratio" style="font-size: 1.2rem; color: var(--success); text-shadow: 0 0 8px rgba(16, 185, 129, 0.2);">1 : 2.50</span>
            </div>
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
              <span class="kpi-label">Limit (Points)</span>
              <span class="kpi-value positive" id="rr-result-reward-pips" style="font-size: 1.2rem;">50.0</span>
              <span class="kpi-label" id="rr-result-reward-cash" style="font-size: 0.7rem; margin-top: 2px;">+$500.00</span>
            </div>
          </div>
        </div>
      `;
      this.calculateRiskReward();
      this.setupRiskRewardListeners();

    } else if (this.activeTab === 'pipvalue') {
      formContainer.innerHTML = `
        <div class="card">
          <div class="card-title">Point Value Calculator</div>
          
          <div class="form-group mt-8">
            <label class="form-label">Asset Category</label>
            <select class="form-control" id="pv-pair">
              <option value="EUR_USD">EUR/USD (Quote: USD)</option>
              <option value="GBP_USD">GBP/USD (Quote: USD)</option>
              <option value="USD_JPY">USD/JPY (Quote: JPY)</option>
              <option value="USD_CAD">USD/CAD (Quote: CAD)</option>
              <option value="USD_CHF">USD/CHF (Quote: CHF)</option>
              <option value="EUR_GBP">EUR/GBP (Cross: GBP)</option>
            </select>
          </div>

          <div class="form-group" id="pv-rate-group" style="display: none;">
            <label class="form-label" id="pv-rate-label">Coefficient Rate (USD/JPY)</label>
            <input type="number" class="form-control" id="pv-rate" value="150.00" step="0.01">
          </div>

          <div class="kpi-grid">
            <div class="form-group">
              <label class="form-label">Volume (Lots)</label>
              <input type="number" class="form-control" id="pv-lots" value="1.0" step="0.1">
            </div>
            <div class="form-group">
              <label class="form-label">Increment Size</label>
              <select class="form-control" id="pv-pipsize">
                <option value="0.0001">0.0001 (Standard)</option>
                <option value="0.01">0.01 (JPY / Gold)</option>
              </select>
            </div>
          </div>

          <div class="kpi-grid mt-16" style="background: rgba(255,255,255,0.01); border: 1px solid var(--border-color); border-radius: 12px; padding: 12px;">
            <div class="kpi-card" style="border: none; background: transparent; grid-column: span 2; align-items: center; text-align: center;">
              <span class="kpi-label">Value per Point (in Base Currency)</span>
              <span class="kpi-value" id="pv-result-val" style="color: var(--secondary); font-size: 1.8rem; text-shadow: 0 0 10px rgba(6, 182, 212, 0.2);">$10.00</span>
            </div>
          </div>
        </div>
      `;
      this.calculatePipValue();
      this.setupPipValueListeners();
    }
  },

  setupListeners() {
    // Tab switching
    const tabPos = document.getElementById('tab-btn-position');
    const tabRR = document.getElementById('tab-btn-riskreward');
    const tabPV = document.getElementById('tab-btn-pipvalue');

    if (tabPos) tabPos.addEventListener('click', () => this.switchTab('position'));
    if (tabRR) tabRR.addEventListener('click', () => this.switchTab('riskreward'));
    if (tabPV) tabPV.addEventListener('click', () => this.switchTab('pipvalue'));
  },

  switchTab(tabName) {
    this.activeTab = tabName;
    this.render();
  },

  // POSITION SIZE LOGIC
  setupPositionSizeListeners() {
    const elements = ['pos-balance', 'pos-risk-pct', 'pos-sl-pips', 'pos-pair', 'pos-rate'];
    elements.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => this.calculatePositionSize());
      }
    });

    const pairSelect = document.getElementById('pos-pair');
    if (pairSelect) {
      pairSelect.addEventListener('change', (e) => {
        const rateGroup = document.getElementById('pos-rate-group');
        const rateLabel = document.getElementById('pos-rate-label');
        const rateVal = document.getElementById('pos-rate');
        
        if (e.target.value === 'USD_QUOTE') {
          if (rateGroup) rateGroup.style.display = 'none';
        } else {
          if (rateGroup) rateGroup.style.display = 'block';
          if (rateLabel) {
            if (e.target.value === 'JPY_QUOTE') {
              rateLabel.textContent = 'USD/JPY Exchange Rate';
              if (rateVal) rateVal.value = '150.00';
            } else if (e.target.value === 'CAD_QUOTE') {
              rateLabel.textContent = 'USD/CAD Exchange Rate';
              if (rateVal) rateVal.value = '1.3700';
            } else if (e.target.value === 'CHF_QUOTE') {
              rateLabel.textContent = 'USD/CHF Exchange Rate';
              if (rateVal) rateVal.value = '0.8900';
            }
          }
        }
        this.calculatePositionSize();
      });
    }
  },

  calculatePositionSize() {
    const balance = parseFloat(document.getElementById('pos-balance')?.value) || 0;
    const riskPct = parseFloat(document.getElementById('pos-risk-pct')?.value) || 0;
    const slPips = parseFloat(document.getElementById('pos-sl-pips')?.value) || 0;
    const pair = document.getElementById('pos-pair')?.value || 'USD_QUOTE';
    const rate = parseFloat(document.getElementById('pos-rate')?.value) || 1.0;

    const riskCash = balance * (riskPct / 100);
    let pipValuePerLot = 10.0; // Standard lot pip value for quote USD is $10

    if (pair === 'JPY_QUOTE') {
      // 1 pip = 0.01. Lot size = 100,000 units. Pip val = 100,000 * 0.01 / rate
      pipValuePerLot = 1000.0 / rate;
    } else if (pair === 'CAD_QUOTE') {
      // 1 pip = 0.0001. Lot size = 100,000. Pip val = 10 / rate
      pipValuePerLot = 10.0 / rate;
    } else if (pair === 'CHF_QUOTE') {
      // 1 pip = 0.0001. Lot size = 100,000. Pip val = 10 / rate
      pipValuePerLot = 10.0 / rate;
    }

    let lots = 0;
    if (slPips > 0 && pipValuePerLot > 0) {
      lots = riskCash / (slPips * pipValuePerLot);
    }

    const resultRiskCash = document.getElementById('pos-result-risk-cash');
    const resultLots = document.getElementById('pos-result-lots');

    if (resultRiskCash) resultRiskCash.textContent = `-$${riskCash.toFixed(2)}`;
    if (resultLots) resultLots.textContent = `${lots.toFixed(2)} Lots`;
  },

  // RISK REWARD LOGIC
  isLong: true,
  setupRiskRewardListeners() {
    const longBtn = document.getElementById('rr-type-long');
    const shortBtn = document.getElementById('rr-type-short');

    if (longBtn && shortBtn) {
      longBtn.addEventListener('click', () => {
        this.isLong = true;
        longBtn.classList.add('active');
        longBtn.style.background = 'rgba(16, 185, 129, 0.1)';
        longBtn.style.color = 'var(--success)';
        shortBtn.classList.remove('active');
        shortBtn.style.background = 'none';
        shortBtn.style.color = 'var(--text-secondary)';
        this.calculateRiskReward();
      });

      shortBtn.addEventListener('click', () => {
        this.isLong = false;
        shortBtn.classList.add('active');
        shortBtn.style.background = 'rgba(244, 63, 94, 0.1)';
        shortBtn.style.color = 'var(--danger)';
        longBtn.classList.remove('active');
        longBtn.style.background = 'none';
        longBtn.style.color = 'var(--text-secondary)';
        this.calculateRiskReward();
      });
    }

    const inputs = ['rr-entry', 'rr-sl', 'rr-tp', 'rr-lots', 'rr-pipval'];
    inputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', () => this.calculateRiskReward());
    });
  },

  calculateRiskReward() {
    const entry = parseFloat(document.getElementById('rr-entry')?.value) || 0;
    const sl = parseFloat(document.getElementById('rr-sl')?.value) || 0;
    const tp = parseFloat(document.getElementById('rr-tp')?.value) || 0;
    const lots = parseFloat(document.getElementById('rr-lots')?.value) || 0;
    const pipVal = parseFloat(document.getElementById('rr-pipval')?.value) || 0;

    let riskDistance = 0;
    let rewardDistance = 0;

    if (this.isLong) {
      riskDistance = entry - sl;
      rewardDistance = tp - entry;
    } else {
      riskDistance = sl - entry;
      rewardDistance = entry - tp;
    }

    // Determine pip scaling (4 decimals standard, 2 decimals for JPY quotes)
    // Simple heuristic: if entry < 50, standard (4 decimals/5 decimals), if entry > 50 JPY (2/3 decimals)
    const isJpyPair = entry > 50;
    const pipScale = isJpyPair ? 100 : 10000;

    const riskPips = riskDistance * pipScale;
    const rewardPips = rewardDistance * pipScale;

    let ratio = 0;
    if (riskDistance > 0) {
      ratio = rewardDistance / riskDistance;
    }

    const riskCash = riskPips * lots * pipVal;
    const rewardCash = rewardPips * lots * pipVal;

    // Update DOM
    const resRiskPips = document.getElementById('rr-result-risk-pips');
    const resRiskCash = document.getElementById('rr-result-risk-cash');
    const resRewardPips = document.getElementById('rr-result-reward-pips');
    const resRewardCash = document.getElementById('rr-result-reward-cash');
    const resRatio = document.getElementById('rr-result-ratio');

    if (resRiskPips) resRiskPips.textContent = riskPips >= 0 ? riskPips.toFixed(1) : '0.0';
    if (resRiskCash) resRiskCash.textContent = riskCash >= 0 ? `-$${riskCash.toFixed(2)}` : '$0.00';
    if (resRewardPips) resRewardPips.textContent = rewardPips >= 0 ? rewardPips.toFixed(1) : '0.0';
    if (resRewardCash) resRewardCash.textContent = rewardCash >= 0 ? `+$${rewardCash.toFixed(2)}` : '$0.00';
    
    if (resRatio) {
      resRatio.textContent = `1 : ${ratio >= 0 ? ratio.toFixed(2) : '0.00'}`;
      if (ratio >= 2) {
        resRatio.style.color = 'var(--success)';
        resRatio.style.textShadow = '0 0 8px rgba(16, 185, 129, 0.2)';
      } else if (ratio >= 1) {
        resRatio.style.color = 'var(--primary)';
        resRatio.style.textShadow = '0 0 8px rgba(99, 102, 241, 0.2)';
      } else {
        resRatio.style.color = 'var(--text-secondary)';
        resRatio.style.textShadow = 'none';
      }
    }
  },

  // PIP VALUE LOGIC
  setupPipValueListeners() {
    const select = document.getElementById('pv-pair');
    const inputs = ['pv-rate', 'pv-lots', 'pv-pipsize'];

    inputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', () => this.calculatePipValue());
    });

    if (select) {
      select.addEventListener('change', (e) => {
        const rateGroup = document.getElementById('pv-rate-group');
        const rateLabel = document.getElementById('pv-rate-label');
        const rateVal = document.getElementById('pv-rate');
        const pipSizeSelect = document.getElementById('pv-pipsize');

        const pair = e.target.value;

        if (pair.includes('USD') && pair.startsWith('EUR_') || pair.startsWith('GBP_')) {
          // Quote is USD
          if (rateGroup) rateGroup.style.display = 'none';
          if (pipSizeSelect) pipSizeSelect.value = '0.0001';
        } else {
          if (rateGroup) rateGroup.style.display = 'block';
          if (rateLabel) {
            if (pair === 'USD_JPY') {
              rateLabel.textContent = 'USD/JPY Exchange Rate';
              if (rateVal) rateVal.value = '150.00';
              if (pipSizeSelect) pipSizeSelect.value = '0.01';
            } else if (pair === 'USD_CAD') {
              rateLabel.textContent = 'USD/CAD Exchange Rate';
              if (rateVal) rateVal.value = '1.3700';
              if (pipSizeSelect) pipSizeSelect.value = '0.0001';
            } else if (pair === 'USD_CHF') {
              rateLabel.textContent = 'USD/CHF Exchange Rate';
              if (rateVal) rateVal.value = '0.8900';
              if (pipSizeSelect) pipSizeSelect.value = '0.0001';
            } else if (pair === 'EUR_GBP') {
              rateLabel.textContent = 'GBP/USD Exchange Rate';
              if (rateVal) rateVal.value = '1.2700';
              if (pipSizeSelect) pipSizeSelect.value = '0.0001';
            }
          }
        }
        this.calculatePipValue();
      });
    }
  },

  calculatePipValue() {
    const pair = document.getElementById('pv-pair')?.value || 'EUR_USD';
    const rate = parseFloat(document.getElementById('pv-rate')?.value) || 1.0;
    const lots = parseFloat(document.getElementById('pv-lots')?.value) || 1.0;
    const pipSize = parseFloat(document.getElementById('pv-pipsize')?.value) || 0.0001;

    // Standard Lot is 100,000 units
    const lotSize = 100000;
    let pipValUSD = 0;

    if (pair === 'EUR_USD' || pair === 'GBP_USD') {
      // Quote is USD, Pip value = lots * lotSize * pipSize
      pipValUSD = lots * lotSize * pipSize;
    } else if (pair === 'USD_JPY') {
      // Quote is JPY, Pip value in JPY = lots * lotSize * pipSize = lots * 100,000 * 0.01 = lots * 1000.
      // Convert to USD by dividing by USD/JPY rate
      if (rate > 0) {
        pipValUSD = (lots * lotSize * pipSize) / rate;
      }
    } else if (pair === 'USD_CAD' || pair === 'USD_CHF') {
      // Quote is CAD/CHF. Pip value in quote = lots * lotSize * pipSize = lots * 10.
      // Convert to USD by dividing by USD/Quote rate
      if (rate > 0) {
        pipValUSD = (lots * lotSize * pipSize) / rate;
      }
    } else if (pair === 'EUR_GBP') {
      // Quote is GBP (cross). Pip value in GBP = lots * lotSize * pipSize = lots * 10.
      // Convert to USD by multiplying by GBP/USD rate
      pipValUSD = (lots * lotSize * pipSize) * rate;
    }

    const valEl = document.getElementById('pv-result-val');
    if (valEl) {
      valEl.textContent = `$${pipValUSD.toFixed(2)}`;
    }
  }
};
