import SQLite from 'react-native-sqlite-storage';

export interface BudgetAlert {
  category: string;
  exceeded: number;
}

export const checkBudgetLimits = async (
  db: SQLite.SQLiteDatabase,
  userPhone: string
): Promise<BudgetAlert[]> => {
  try {
    const alerts: BudgetAlert[] = [];

    // Get settings with limits
    const [settingsResult] = await db.executeSql(
      `SELECT General_Spending_Limit, Money_Transfer_Limit, Bundles_Limit, Merchant_Limit, 
              Bank_Transfer_Limit, Utilities_Limit, Agent_Limit, Others_Limit FROM Settings 
       WHERE Phone_Number = ? LIMIT 1`,
      [userPhone]
    );

    if (settingsResult.rows.length === 0) {
      return alerts;
    }

    const settings = settingsResult.rows.item(0);

    // Get month start date
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Check General Spending Limit (total of all categories)
    if (settings.General_Spending_Limit > 0) {
      try {
        // Get totals from each table separately and sum them
        const queries = [
          { table: 'Money_Transfers', filter: "AND Transaction_Type = 'sent'" },
          { table: 'Merchant_Payment', filter: '' },
          { table: 'Bundles', filter: '' },
          { table: 'Bank_Transfers', filter: "AND Transaction_Type = 'sent'" },
          { table: 'Others', filter: '' },
          { table: 'Agent_Transactions', filter: '' },
          { table: 'Utilities', filter: '' },
        ];

        let totalSpending = 0;
        for (const query of queries) {
          try {
            const [result] = await db.executeSql(
              `SELECT COALESCE(SUM(Amount), 0) as total FROM ${query.table} 
               WHERE Phone_Number = ? AND Date >= ? ${query.filter}`,
              [userPhone, monthStart]
            );
            const amount = result.rows.item(0).total || 0;
            totalSpending += amount;
          } catch (err) {
            console.log(`Error querying ${query.table}:`, err);
          }
        }

        console.log(`General Spending Total: ${totalSpending}, Limit: ${settings.General_Spending_Limit}`);
        if (totalSpending > settings.General_Spending_Limit) {
          alerts.push({
            category: 'Overall Monthly Spending',
            exceeded: totalSpending - settings.General_Spending_Limit,
          });
        }
      } catch (error) {
        console.error('Error calculating general spending:', error);
      }
    }

    // Check Money Transfers
    if (settings.Money_Transfer_Limit > 0) {
      const [result] = await db.executeSql(
        `SELECT COALESCE(SUM(Amount), 0) as total FROM Money_Transfers 
         WHERE Phone_Number = ? AND Transaction_Type = 'sent' AND Date >= ?`,
        [userPhone, monthStart]
      );
      const total = result.rows.item(0).total || 0;
      if (total > settings.Money_Transfer_Limit) {
        alerts.push({
          category: 'Money Transfers',
          exceeded: total - settings.Money_Transfer_Limit,
        });
      }
    }

    // Check Bank Transfers
    if (settings.Bank_Transfer_Limit > 0) {
      const [result] = await db.executeSql(
        `SELECT COALESCE(SUM(Amount), 0) as total FROM Bank_Transfers 
         WHERE Phone_Number = ? AND Transaction_Type = 'sent' AND Date >= ?`,
        [userPhone, monthStart]
      );
      const total = result.rows.item(0).total || 0;
      if (total > settings.Bank_Transfer_Limit) {
        alerts.push({
          category: 'Bank Transfers',
          exceeded: total - settings.Bank_Transfer_Limit,
        });
      }
    }

    // Check Merchant Payments
    if (settings.Merchant_Limit > 0) {
      const [result] = await db.executeSql(
        `SELECT COALESCE(SUM(Amount), 0) as total FROM Merchant_Payment 
         WHERE Phone_Number = ? AND Date >= ?`,
        [userPhone, monthStart]
      );
      const total = result.rows.item(0).total || 0;
      if (total > settings.Merchant_Limit) {
        alerts.push({
          category: 'Merchant Payments',
          exceeded: total - settings.Merchant_Limit,
        });
      }
    }

    // Check Bundles
    if (settings.Bundles_Limit > 0) {
      const [result] = await db.executeSql(
        `SELECT COALESCE(SUM(Amount), 0) as total FROM Bundles 
         WHERE Phone_Number = ? AND Date >= ?`,
        [userPhone, monthStart]
      );
      const total = result.rows.item(0).total || 0;
      if (total > settings.Bundles_Limit) {
        alerts.push({
          category: 'Bundles',
          exceeded: total - settings.Bundles_Limit,
        });
      }
    }

    // Check Utilities
    if (settings.Utilities_Limit > 0) {
      const [result] = await db.executeSql(
        `SELECT COALESCE(SUM(Amount), 0) as total FROM Utilities 
         WHERE Phone_Number = ? AND Date >= ?`,
        [userPhone, monthStart]
      );
      const total = result.rows.item(0).total || 0;
      if (total > settings.Utilities_Limit) {
        alerts.push({
          category: 'Utilities',
          exceeded: total - settings.Utilities_Limit,
        });
      }
    }

    // Check Agents
    if (settings.Agent_Limit > 0) {
      const [result] = await db.executeSql(
        `SELECT COALESCE(SUM(Amount), 0) as total FROM Agent_Transactions 
         WHERE Phone_Number = ? AND Date >= ?`,
        [userPhone, monthStart]
      );
      const total = result.rows.item(0).total || 0;
      if (total > settings.Agent_Limit) {
        alerts.push({
          category: 'Agents',
          exceeded: total - settings.Agent_Limit,
        });
      }
    }

    // Check Others
    if (settings.Others_Limit > 0) {
      const [result] = await db.executeSql(
        `SELECT COALESCE(SUM(Amount), 0) as total FROM Others 
         WHERE Phone_Number = ? AND Date >= ?`,
        [userPhone, monthStart]
      );
      const total = result.rows.item(0).total || 0;
      if (total > settings.Others_Limit) {
        alerts.push({
          category: 'Others',
          exceeded: total - settings.Others_Limit,
        });
      }
    }

    return alerts;
  } catch (error) {
    console.error('Error checking budget limits:', error);
    return [];
  }
};
