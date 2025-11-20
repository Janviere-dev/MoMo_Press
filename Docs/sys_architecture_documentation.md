# **MoMo Analysis App – System Architecture Documentation**

## **1. Overview**

The **MoMo Analysis App** is a mobile-based financial management tool that helps users analyze and manage their Mobile Money (MoMo) transactions. The system processes SMS messages from MoMo providers, extracts meaningful transaction data, visualizes spending behavior, and offers spending alerts and simple payment options through USSD.

The architecture is designed to support both **offline functionality** (local parsing and USSD operations) and **optional cloud synchronization** for analytics and reporting.

---

## **2. System Components**

### **A. Mobile App (Client Layer)**

The mobile app serves as the main user interface and processing point for transaction analysis.

#### **Key Components**

* **UI Layer:**
  Displays visual transaction summaries, categorized by type (e.g., airtime, bank transfer, code holders). Includes setup, dashboard, and export views.

* **SMS Listener:**
  Automatically detects and reads MoMo SMS messages to extract raw transaction data.

* **Transaction Parser (Local):**
  Uses pattern-matching rules (regex) to convert SMS text into structured data (amount, date, counterparty, balance, etc.).

* **Local Database (SQLite/Realm):**
  Stores parsed transactions, user-added messages, spending limits, and preferences securely on the device.

* **USSD Caller Module:**
  Dynamically composes USSD strings (e.g., `*182*8*1*code#`) and dials using CALL_PHONE permission — no external API required.

* **Permissions:**
  Requires SMS reading and phone call permissions for proper functionality.

#### **Local Logic**

* Spending limits and thresholds trigger alerts or inquiries.

#### **Core Services**

* **Transaction Sync Service:**
  Receives and stores parsed transactions sent from the mobile app.

* **Data Enrichment & Aggregation Service:**
  Computes weekly totals, monthly totals, and spending insights.

* **Business Rules Engine:**
  Runs rules to detect when:

  * Monthly spending limit is exceeded → sends **Alert SMS**

* **Scheduler / Cron Jobs:**
  Automates weekly and monthly data calculations.

---

### **C. Data Stores**

These databases manage user data, transaction history, and analytics.

| **Database**               | **Purpose**                                                                 |
| -------------------------- | --------------------------------------------------------------------------- |
| **Transactions Database**  | Stores structured transaction data (type, amount, time, counterparty, etc.) |
| **User Settings Database** | Stores user preferences, spending limits, and alert configurations          |
| **Analytics Database**     | Contains aggregated insights (weekly averages, monthly summaries)           |

---

## **3. Data Flow Summary**

1. **SMS Received:**
   MoMo message arrives on the user’s phone.

2. **Local Parsing:**
   The app extracts key details (amount, transaction type, counterparty).

3. **Storage:**
   Data is saved locally in the app’s database.

4. **Analysis & Alerts:**

   * The app calculates monthly spending and compares to limits set.
   * If a transaction exceeds limits, an **alert** is raised automatically.

5. **USSD Payment:**
   The user inputs a code, and the app composes a USSD command to complete the payment using the phone dialer.

---

## **4. Key Advantages**

* **Offline-first Design:** Works without constant internet access.
* **Privacy-friendly:** All sensitive data remains on the device.
* **Automated Alerts:** Real-time alerts when limits are excedded.
* **Simple Payments:** Easier USSD transactions with no telecom API dependency.

---

## **5. Security Considerations**

* Local data is encrypted and never shared without user consent.
* SMS and CALL permissions requested transparently.
* Only SMS from M-Money is ever read or processed.

---

## **6. Conclusion**

The MoMo Analysis App architecture provides a local system that allows users to monitor spending, receive smart alerts, and make faster USSD payments securely — all while maintaining control over their financial data.