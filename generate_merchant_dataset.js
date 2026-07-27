const fs = require('fs');

const END_DATE = new Date("2026-03-21T23:59:59Z");
const START_DATE = new Date(END_DATE);
START_DATE.setDate(START_DATE.getDate() - 6);
START_DATE.setHours(0, 0, 0, 0);

const randomBetween = (min, max) => Math.random() * (max - min) + min;
const randomInt = (min, max) => Math.floor(randomBetween(min, max + 1));
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

const generateData = () => {
  const data = {
    transactions: [],
    fees: [],
    settlements: [],
    instant_settlements: [],
    refunds: [],
    chargebacks: [],
    daily_metrics: [],
    alerts: [],
    reconciliation: [],
    payment_method_stats: []
  };

  const paymentMethods = ["UPI", "CARD", "CARD", "WALLET"];
  const failureReasons = ["BANK_DOWN", "TIMEOUT", "USER_ABORT"];
  const settlementTypes = ["T+1", "T+2", "INSTANT"];

  let dailyStatsMap = {};

  let currentSettlementBatch = {};

  for (let d = 0; d < 7; d++) {
    const currentDay = new Date(START_DATE);
    currentDay.setDate(START_DATE.getDate() + d);
    const dateStr = currentDay.toISOString().split('T')[0];

    dailyStatsMap[dateStr] = {
      total_txn: 0,
      successful_txn: 0,
      failed_txn: 0,
      total_revenue: 0,
      total_fees: 0,
      net_earnings: 0,
      failed_amount: 0,
      date: dateStr
    };

    const numTxns = randomInt(80, 150);
    
    // Day 3 and 5 have high UPI failures
    const isBadUpiDay = d === 2 || d === 4;

    for (let t = 0; t < numTxns; t++) {
      const txnId = `TXN_${dateStr.replace(/-/g, '')}_${t + 1}`;
      
      // Skew towards evening (16:00 - 22:00)
      let hour = randomInt(0, 23);
      if (Math.random() > 0.4) hour = randomInt(16, 22);
      
      const txnTime = new Date(currentDay);
      txnTime.setHours(hour, randomInt(0, 59), randomInt(0, 59));
      
      const method = randomChoice(paymentMethods);
      const amount = Math.round(randomBetween(50, 20000) * 100) / 100;
      
      let failProb = 0.1;
      if (isBadUpiDay && method === "UPI") failProb = 0.35; // Spike in UPI failures
      
      const isFailed = Math.random() < failProb;
      const status = isFailed ? "FAILED" : (Math.random() < 0.05 ? "PENDING" : "SUCCESS");
      
      dailyStatsMap[dateStr].total_txn++;
      
      const transaction = {
        txn_id: txnId,
        timestamp: txnTime.toISOString(),
        amount: amount,
        status: status,
        payment_method: method
      };

      if (isFailed) {
        transaction.failure_reason = randomChoice(failureReasons);
        dailyStatsMap[dateStr].failed_txn++;
        dailyStatsMap[dateStr].failed_amount += amount;
      } else if (status === "SUCCESS") {
        dailyStatsMap[dateStr].successful_txn++;
        dailyStatsMap[dateStr].total_revenue += amount;

        // Calculate Fees
        let mdrRate = method === "UPI" ? randomBetween(0.005, 0.01) : randomBetween(0.015, 0.03);
        const mdr = Math.round((amount * mdrRate) * 100) / 100;
        const gst = Math.round((mdr * 0.18) * 100) / 100;
        const platformFee = randomChoice([0, 0, 2, 5]); // occasional platform fee
        let instantFee = 0;
        
        const isInstant = Math.random() < 0.3; // 30% instant settlement
        if (isInstant) {
          instantFee = amount > 5000 ? randomInt(50, 150) : randomInt(10, 40);
        }

        const totalFee = Math.round((mdr + gst + platformFee + instantFee) * 100) / 100;
        const netAmount = Math.round((amount - totalFee) * 100) / 100;
        
        dailyStatsMap[dateStr].total_fees += totalFee;
        dailyStatsMap[dateStr].net_earnings += netAmount;

        data.fees.push({
          txn_id: txnId,
          mdr: mdr,
          gst: gst,
          platform_fee: platformFee,
          instant_fee: instantFee,
          total_fee: totalFee
        });

        if (isInstant) {
          data.instant_settlements.push({
            txn_id: txnId,
            fee: instantFee,
            settled_amount: netAmount,
            timestamp: new Date(txnTime.getTime() + randomInt(5, 30)*60000).toISOString() // settles in 5-30 mins
          });
        } else {
          // Batch for T+1 / T+2
          const stype = Math.random() < 0.8 ? "T+1" : "T+2";
          if (!currentSettlementBatch[stype]) {
            currentSettlementBatch[stype] = [];
          }
          currentSettlementBatch[stype].push({
            txn_id: txnId,
            net_amount: netAmount,
            date: dateStr,
            time: txnTime
          });
        }

        // Refunds
        if (Math.random() < 0.08) {
          data.refunds.push({
            refund_id: `REF_${txnId}`,
            txn_id: txnId,
            amount: Math.round(amount * (Math.random() > 0.5 ? 1 : randomBetween(0.1, 0.9))), // full or partial
            status: randomChoice(["SUCCESS", "PENDING"]),
            delay_days: randomInt(0, 5),
            fee_deduction: Math.random() < 0.5 ? 0 : randomInt(5, 20)
          });
        }

        // Chargebacks
        if (Math.random() < 0.02) {
          data.chargebacks.push({
            chargeback_id: `CB_${txnId}`,
            txn_id: txnId,
            amount: amount,
            penalty_fee: randomInt(200, 500),
            status: randomChoice(["OPEN", "WON", "LOST"])
          });
        }

        // Reconciliation
        if (Math.random() < 0.03) {
          data.reconciliation.push({
            txn_id: txnId,
            expected_amount: netAmount,
            received_amount: netAmount - randomInt(10, 100),
            status: "MISMATCH",
            reason: randomChoice(["HIDDEN_FEE_DEDUCTION", "SYSTEM_ERROR", "TAX_HOLD"])
          });
        }
      }

      data.transactions.push(transaction);
    } // end txn loop

    // Process daily settlements
    for (const stype of ["T+1", "T+2"]) {
      if (currentSettlementBatch[stype] && currentSettlementBatch[stype].length > 0) {
        const txns = currentSettlementBatch[stype].map(t => t.txn_id);
        const settledAmt = currentSettlementBatch[stype].reduce((sum, t) => sum + t.net_amount, 0);
        
        const isDelayed = Math.random() < 0.25;
        const delayDays = isDelayed ? randomInt(1, 3) : 0;
        
        const expectedDate = new Date(currentDay);
        expectedDate.setDate(expectedDate.getDate() + (stype === "T+1" ? 1 : 2));
        
        const actualDate = new Date(expectedDate);
        actualDate.setDate(actualDate.getDate() + delayDays);

        data.settlements.push({
          settlement_id: `SET_${dateStr}_${stype}`,
          type: stype,
          expected_date: expectedDate.toISOString().split('T')[0],
          actual_date: isDelayed && expectedDate > END_DATE ? null : actualDate.toISOString().split('T')[0],
          status: isDelayed && expectedDate >= END_DATE ? "PENDING" : "COMPLETED",
          delay: isDelayed,
          delay_reason: isDelayed ? randomChoice(["BANK_DELAY", "HOLIDAY", "PROCESSING_ISSUE"]) : null,
          settled_amount: Math.round(settledAmt * 100) / 100,
          txn_count: txns.length,
          transactions: txns
        });
        
        currentSettlementBatch[stype] = []; // clear
      }
    }
  } // end day loop

  // Finalize stats
  for (const date in dailyStatsMap) {
    const s = dailyStatsMap[date];
    s.total_revenue = Math.round(s.total_revenue * 100)/100;
    s.total_fees = Math.round(s.total_fees * 100)/100;
    s.net_earnings = Math.round(s.net_earnings * 100)/100;
    s.failed_amount = Math.round(s.failed_amount * 100)/100;
    data.daily_metrics.push(s);
  }

  // Alerts
  data.alerts.push({
    date: new Date(START_DATE.getTime() + 2*86400000).toISOString().split('T')[0],
    level: "HIGH",
    message: "High UPI failure rate detected (35%). Consider enabling Fallback Routing."
  });
  data.alerts.push({
    date: new Date(START_DATE.getTime() + 4*86400000).toISOString().split('T')[0],
    level: "WARNING",
    message: "Settlement delayed by 1 day due to Bank Holiday."
  });
  data.alerts.push({
    date: END_DATE.toISOString().split('T')[0],
    level: "INFO",
    message: "Unusual spike in instant settlement fees (+20% vs yesterday)."
  });

  // Payment method stats
  ["UPI", "CARD", "WALLET"].forEach(m => {
    const methodTxns = data.transactions.filter(t => t.payment_method === m);
    if(methodTxns.length === 0) return;
    const total = methodTxns.length;
    const failed = methodTxns.filter(t => t.status === "FAILED").length;
    const rev = methodTxns.reduce((s,t) => s + (t.amount||0), 0);
    
    data.payment_method_stats.push({
      method: m,
      total_transactions: total,
      success_rate: Math.round(((total - failed) / total)*100) + "%",
      failure_rate: Math.round((failed / total)*100) + "%",
      avg_transaction_value: Math.round((rev / total)*100)/100
    });
  });

  fs.writeFileSync('./data/merchant_dataset.json', JSON.stringify(data, null, 2));
  console.log("Dataset generated at data/merchant_dataset.json");
};

generateData();
