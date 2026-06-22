// MT5 CSV/TSV Forensic Parsing Engine

export const ParserService = {
  /**
   * Parses raw MT5 export text into structured data.
   * Handles tab-separated UTF-16 content, semicolons, and standard commas.
   * @param {string} text - Raw CSV text contents
   * @returns {object} Parsed report containing stats and equity curve
   */
  parseMT5CSV(text) {
    if (!text || text.trim() === '') {
      throw new Error('CSV file is empty');
    }

    // Clean up carriage returns and clean Unicode BOM if present
    const cleanText = text.replace(/^\uFEFF/, '').replace(/\r/g, '');
    const lines = cleanText.split('\n');

    // Detect separator: Tab, Semicolon, or Comma
    let separator = ',';
    const firstLine = lines[0] || '';
    if (firstLine.includes('\t')) {
      separator = '\t';
    } else if (firstLine.includes(';')) {
      separator = ';';
    }

    // Find the header row
    let headerRowIndex = -1;
    let headers = [];

    // Search lines for typical MT5 keywords
    for (let i = 0; i < Math.min(lines.length, 15); i++) {
      const cols = lines[i].split(separator).map(c => c.trim().toLowerCase());
      if (cols.includes('ticket') && (cols.includes('profit') || cols.includes('balance'))) {
        headerRowIndex = i;
        headers = lines[i].split(separator).map(c => c.trim().replace(/"/g, ''));
        break;
      }
    }

    if (headerRowIndex === -1) {
      // Fallback: assume line 0 is the header if it has ticket or profit
      const cols = firstLine.split(separator).map(c => c.trim().toLowerCase());
      if (cols.includes('profit') || cols.includes('balance') || cols.includes('type')) {
        headerRowIndex = 0;
        headers = firstLine.split(separator).map(c => c.trim().replace(/"/g, ''));
      } else {
        throw new Error('Could not identify MT5 report headers. Ensure column labels like Ticket, Type, Profit, or Balance are present.');
      }
    }

    // Create a dynamic mapping of headers to column indices
    const headerMap = {};
    headers.forEach((h, index) => {
      const lower = h.toLowerCase();
      // Handle potential duplicate columns or variants
      if (lower === 'ticket') headerMap.ticket = index;
      else if (lower === 'type') headerMap.type = index;
      else if (lower === 'symbol' || lower === 'item') headerMap.symbol = index;
      else if (lower === 'volume' || lower === 'size') headerMap.volume = index;
      else if (lower === 'profit') headerMap.profit = index;
      else if (lower === 'balance') headerMap.balance = index;
      // MT5 exports two 'time' fields: Open Time & Close Time (or just Time for deals)
      // We prioritize Close Time for charting, falling back to any time column
      else if (lower === 'close time') headerMap.closeTime = index;
      else if (lower === 'open time') headerMap.openTime = index;
      else if (lower === 'time') {
        if (headerMap.time === undefined) {
          headerMap.time = index;
        } else {
          headerMap.closeTime = index; // If multiple time fields, second is usually close
        }
      }
    });

    // Determine target time column
    const timeIndex = headerMap.closeTime !== undefined ? headerMap.closeTime : 
                      (headerMap.time !== undefined ? headerMap.time : headerMap.openTime);

    if (timeIndex === undefined) {
      throw new Error('Could not find a valid timestamp column (Time, Open Time, or Close Time)');
    }
    if (headerMap.profit === undefined && headerMap.balance === undefined) {
      throw new Error('Report must contain either a Profit or Balance column');
    }

    const trades = [];
    let initialBalance = 0;
    let runningBalance = 0;
    let currentBalanceSet = false;

    // Parse data rows
    for (let i = headerRowIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(separator).map(c => c.trim().replace(/"/g, ''));
      if (cols.length < Math.max(...Object.values(headerMap)) + 1) {
        continue; // Skip malformed rows
      }

      const type = headerMap.type !== undefined ? cols[headerMap.type].toLowerCase() : '';
      const profit = headerMap.profit !== undefined ? parseFloat(cols[headerMap.profit].replace(/[^0-9.-]/g, '')) || 0 : 0;
      const balanceVal = headerMap.balance !== undefined ? parseFloat(cols[headerMap.balance].replace(/[^0-9.-]/g, '')) || 0 : 0;
      const symbol = headerMap.symbol !== undefined ? cols[headerMap.symbol] : 'N/A';
      const volume = headerMap.volume !== undefined ? parseFloat(cols[headerMap.volume]) || 0 : 0;
      const timeStr = cols[timeIndex];

      // Handle account adjustments (deposits, withdrawals, initial balances)
      if (type.includes('balance') || type.includes('deposit') || type.includes('credit') || type.includes('withdrawal')) {
        if (!currentBalanceSet) {
          initialBalance = balanceVal || profit;
          runningBalance = initialBalance;
          currentBalanceSet = true;
        } else {
          runningBalance += profit;
        }
        continue;
      }

      // If it's a standard trade (buy or sell)
      if (type === 'buy' || type === 'sell' || type.includes('deal') || type === 't/c' || profit !== 0) {
        // If we haven't set runningBalance yet (in case file has no explicit balance deposit row)
        if (!currentBalanceSet) {
          if (headerMap.balance !== undefined && balanceVal !== 0) {
            initialBalance = balanceVal - profit;
            runningBalance = balanceVal;
            currentBalanceSet = true;
          } else {
            // Assume default start
            initialBalance = 10000; // default backup starting equity
            runningBalance = initialBalance + profit;
            currentBalanceSet = true;
          }
        } else {
          runningBalance += profit;
        }

        const openTimeStr = headerMap.openTime !== undefined ? cols[headerMap.openTime] : (headerMap.time !== undefined ? cols[headerMap.time] : cols[timeIndex]);
        let durationMin = 0;
        if (openTimeStr && timeStr && openTimeStr !== timeStr) {
          const diffMs = new Date(timeStr) - new Date(openTimeStr);
          if (!isNaN(diffMs) && diffMs > 0) {
            durationMin = diffMs / 60000;
          }
        }

        trades.push({
          time: timeStr,
          openTime: openTimeStr,
          type: type,
          symbol: symbol,
          volume: volume,
          profit: profit,
          durationMin: durationMin,
          balance: headerMap.balance !== undefined && balanceVal !== 0 ? balanceVal : runningBalance
        });
      }
    }

    if (trades.length === 0) {
      throw new Error('No valid trade records (buy/sell deals) found in the file.');
    }

    // Sort trades chronologically
    trades.sort((a, b) => new Date(a.time) - new Date(b.time));

    // Recalculate equity curve and running balance for clean alignment
    let tempBalance = initialBalance;
    const equityCurve = [{ time: 'Start', balance: initialBalance }];
    
    let winCount = 0;
    let lossCount = 0;
    let grossProfit = 0;
    let grossLoss = 0;
    let maxBalance = initialBalance;
    let maxDrawdownPercent = 0;
    
    let totalDurationMin = 0;
    let tradesWithDuration = 0;
    let buyCount = 0;
    let sellCount = 0;
    let buyWinCount = 0;
    let sellWinCount = 0;
    let bestTradeProfit = -Infinity;
    let worstTradeProfit = Infinity;

    trades.forEach((trade) => {
      tempBalance += trade.profit;
      trade.runningBalance = tempBalance;

      equityCurve.push({
        time: trade.time,
        balance: tempBalance
      });

      // KPI Calculations
      if (trade.profit > 0) {
        winCount++;
        grossProfit += trade.profit;
      } else if (trade.profit < 0) {
        lossCount++;
        grossLoss += Math.abs(trade.profit);
      }

      if (trade.profit > bestTradeProfit) {
        bestTradeProfit = trade.profit;
      }
      if (trade.profit < worstTradeProfit) {
        worstTradeProfit = trade.profit;
      }

      // Buy/Sell count
      if (trade.type.includes('buy')) {
        buyCount++;
        if (trade.profit > 0) buyWinCount++;
      } else if (trade.type.includes('sell')) {
        sellCount++;
        if (trade.profit > 0) sellWinCount++;
      }

      // Duration calculations
      if (trade.durationMin > 0) {
        totalDurationMin += trade.durationMin;
        tradesWithDuration++;
      }

      // Drawdown calculations
      if (tempBalance > maxBalance) {
        maxBalance = tempBalance;
      }
      const ddPercent = ((maxBalance - tempBalance) / maxBalance) * 100;
      if (ddPercent > maxDrawdownPercent) {
        maxDrawdownPercent = ddPercent;
      }
    });

    const totalTrades = winCount + lossCount;
    const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;
    const finalBalance = tempBalance;
    const netProfit = finalBalance - initialBalance;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit;

    const avgWin = winCount > 0 ? grossProfit / winCount : 0;
    const avgLoss = lossCount > 0 ? grossLoss / lossCount : 0;
    const riskRewardAchieved = avgLoss > 0 ? avgWin / avgLoss : 0;
    const expectancy = (winRate / 100 * avgWin) - ((1 - winRate / 100) * avgLoss);
    const avgHoldingTimeMin = tradesWithDuration > 0 ? totalDurationMin / tradesWithDuration : 0;

    return {
      id: 'report_' + Date.now(),
      timestamp: Date.now(),
      kpis: {
        initialBalance: initialBalance,
        finalBalance: finalBalance,
        netProfit: netProfit,
        totalTrades: totalTrades,
        winRate: winRate,
        profitFactor: profitFactor,
        maxDrawdown: maxDrawdownPercent,
        // Advanced analytics
        avgWin: avgWin,
        avgLoss: avgLoss,
        riskRewardAchieved: riskRewardAchieved,
        expectancy: expectancy,
        avgHoldingTimeMin: avgHoldingTimeMin,
        bestTrade: bestTradeProfit === -Infinity ? 0 : bestTradeProfit,
        worstTrade: worstTradeProfit === Infinity ? 0 : worstTradeProfit,
        buyCount: buyCount,
        sellCount: sellCount,
        buyWinRate: buyCount > 0 ? (buyWinCount / buyCount) * 100 : 0,
        sellWinRate: sellCount > 0 ? (sellWinCount / sellCount) * 100 : 0
      },
      trades: trades,
      equityCurve: equityCurve
    };
  }
};
