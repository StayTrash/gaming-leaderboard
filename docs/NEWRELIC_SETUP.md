# New Relic Setup & Usage (Node.js APM)

Based on [New Relic’s official Node.js agent docs](https://docs.newrelic.com/docs/apm/agents/nodejs-agent/installation-configuration/install-nodejs-agent/). This project already has the agent installed and loaded; you only need an account and a license key.

---

## Assignment checklist: “New Relic for Monitoring”

| Requirement | Done in code? | What you do |
|-------------|----------------|-------------|
| **Track API latencies under real load** | ✅ Yes | Agent instruments Express automatically. Run the app + `load_test.py` (or frontend); latencies appear under **APM → Your app → Transactions**. |
| **Identify bottlenecks and slow database queries** | ✅ Yes | Agent instruments `pg`; DB time and slow queries appear under **APM → Your app → Databases** and inside **Transaction traces**. |
| **Set up alerts for slow response times** | ⚠️ In UI | Data is in New Relic; you create the alert once in the UI. See [§ Set up alerts for slow response times](#set-up-alerts-for-slow-response-times) below. |

---

## 1. Create a New Relic account

- Sign up (free): **[newrelic.com/signup](https://newrelic.com/signup)**  
- No credit card required; free tier includes 100 GB/month.

**EU region:** Use **[one.eu.newrelic.com](https://one.eu.newrelic.com)** and the EU collector if your data must stay in the EU.

---

## 2. Get your license key

The **license key** is a 40-character string used by the Node.js agent to send APM data to New Relic.

1. Log in at **[one.newrelic.com](https://one.newrelic.com)** (or **one.eu.newrelic.com** for EU).
2. Click your **name** (bottom-left) → **API keys** (or open **[API Keys](https://one.newrelic.com/launcher/api-keys-ui.api-keys-launcher)** from the launcher).
3. Under **License keys**, copy an existing key or create one.
4. **Important:** Copy the key somewhere safe right away. As of late 2024, you may not be able to view it again in the UI after leaving the page.

Do **not** commit the key to git. Use environment variables (see below).

---

## 3. Configure the backend

### Option A: Environment variables (recommended)

In `backend/.env`:

```env
DB_PASSWORD=your_postgres_password
NEW_RELIC_LICENSE_KEY=your_40_char_license_key_here
NEW_RELIC_APP_NAME=Leaderboard Backend
```

- **NEW_RELIC_LICENSE_KEY** – Required. Without it, the agent won’t send data.
- **NEW_RELIC_APP_NAME** – Optional. Name shown in the APM UI (default in code is `Leaderboard Backend`).

### Option B: Config file only

Edit `backend/newrelic.js` and set `license_key` and `app_name`. **Do not commit real keys**; use env in production.

### Agent must load first

The project loads dotenv then New Relic **before** any other app code (see `src/bootstrap.ts`):

- **Development:** Bootstrap runs first; New Relic loads only if `NEW_RELIC_LICENSE_KEY` is set.
- **Production:** If you run compiled JS (e.g. `node dist/server.js`), start with:
  ```bash
  node -r newrelic dist/server.js
  ```
  so the agent is required before your app.

---

## 4. Run the app and generate traffic

1. From `backend`:
   ```bash
   npm run dev
   ```
2. Send traffic so the agent has something to report:
   - Use the frontend at [http://localhost:3000](http://localhost:3000), or
   - Run the load script: `python load_test.py` (from repo root).
3. Wait **2–5 minutes** for data to show up in New Relic.

---

## 5. Use the New Relic UI

1. In New Relic, go to **APM & services** (or **Applications**).
2. Open your app (e.g. **Leaderboard Backend**).
3. You’ll see:
   - **Overview** – Throughput, response time, error rate.
   - **Transactions** – Per-endpoint latency (e.g. `/api/leaderboard/top`, `/api/leaderboard/submit`).
   - **Databases** – Slow queries and DB time.
   - **Errors** – Errors and stack traces.

### Useful for this assignment

- **Track API latencies:** Transactions → click a transaction (e.g. `Express/GET//api/leaderboard/top`) → see breakdown and DB/Redis time.
- **Find bottlenecks:** Databases → slow queries; Transactions → “Slowest transactions”.

---

## Set up alerts for slow response times

Alerts are configured in the New Relic UI (not in code). One-time setup:

1. In New Relic go to **Alerts & AI** → **Alert conditions (policies)** (or **Policies**).
2. Create a **new alert policy** (e.g. “Leaderboard API”) if you don’t have one, or use an existing policy.
3. **New alert condition** → choose **APM** (or **Golden signal / metrics** for guided flow).
4. Select your app (e.g. **Leaderboard Backend**).
5. For “slow response time”:
   - **Metric:** e.g. **Response time** or **Apdex**.
   - **Threshold:** e.g. “Average response time &gt; 500 ms” or “Apdex &lt; 0.7”.
   - Set **duration** (e.g. 5 minutes) and **severity** (Critical / Warning).
6. Add a **notification channel** (email, Slack, etc.) to the policy so you get notified.
7. Save.

After that, New Relic will alert you when response times exceed your threshold. For more options (e.g. NRQL), see [Create alert conditions](https://docs.newrelic.com/docs/alerts-applied-intelligence/new-relic-alerts/alert-conditions/create-alert-conditions/).

---

## 6. Optional: Disable in tests

The agent is loaded in `server.ts`; when you run Jest, the app is imported and the agent can start. To avoid sending test traffic to New Relic:

- Set in test env (e.g. in Jest setup or `package.json` script):  
  `NEW_RELIC_ENABLED=false`  
  so the agent doesn’t connect.  
- Or rely on the fact that `NEW_RELIC_LICENSE_KEY` is usually unset in CI/test; with an empty key, the agent typically won’t send data.

---

## 7. References

- [Install the Node.js agent](https://docs.newrelic.com/docs/apm/agents/nodejs-agent/installation-configuration/install-nodejs-agent/)
- [Node.js agent configuration](https://docs.newrelic.com/docs/apm/agents/nodejs-agent/installation-configuration/nodejs-agent-configuration/) (all options and env vars)
- [API keys (license key)](https://docs.newrelic.com/docs/apis/intro-apis/new-relic-api-keys/)
- [Troubleshooting Node.js](https://docs.newrelic.com/docs/apm/agents/nodejs-agent/troubleshooting/troubleshooting-your-nodejs-installation/)
