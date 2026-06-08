# Automated Job Tracker & Scraper Pipeline

## Overview
A full-stack job tracking platform and automated scraping engine designed to streamline the off-campus job search. The platform aggregates software engineering opportunities directly from the internal Applicant Tracking Systems (ATS) and career portals of top technology and financial companies. It features an integrated, drag-and-drop Kanban board for managing application lifecycles.

## Live Deployment
Live Demo: [https://jobtrackerfrontend-fe1a.onrender.com](https://jobtrackerfrontend-fe1a.onrender.com)

---

## Technical Architecture

### Frontend
* **Framework:** React.js powered by Vite
* **Routing:** React Router
* **Application Management:** Custom drag-and-drop Kanban interface for status tracking (Applied, OA, Interview, Offer, Rejected, Accepted)

### Backend & Database
* **Server:** Node.js and Express.js
* **Database:** MongoDB for robust data persistence
* **Authentication:** JWT-secured access control
* **Orchestration:** Master runner engine with automated cron scheduling for bi-daily data refreshing
* **Notifications:** Global email reporting pipeline to monitor scraper health and module failures

### Scraping Engine & Bypass Strategies
The system bypasses third-party aggregators by interfacing directly with corporate ATS backends using advanced extraction methodologies:
* **WAF Evasion:** Custom HTTPS agents with TLS fingerprint spoofing to bypass Cloudflare and Akamai Web Application Firewalls.
* **Authentication Handshakes:** Two-step handshake protocols to harvest and inject dynamic CSRF tokens and session cookies for locked AJAX endpoints.
* **Aggressive Filtering:** "Bank Title Strategy" and inverse title filtering to eliminate senior-level positions (VP, Director, Lead) and isolate entry-to-mid-level roles.
* **Data Extraction:** Direct reverse-engineering of private APIs, static CDN dumps, and targeted GraphQL queries.

---

## Supported Companies

The automated pipeline actively extracts roles from a singular continuous matrix of major corporate tech portals and automated enterprise platforms:

* Google
* Amazon
* Microsoft
* Apple
* GitHub
* Salesforce
* Cisco
* Uber
* Intuit
* Tower Research Capital
* JPMorgan Chase & Co.
* Morgan Stanley
* Goldman Sachs
* UBS
* HSBC
* Deutsche Bank
* Citi
* Visa
* Mastercard
* BNY Mellon
* BlackRock
* Walmart
* NVIDIA
* Adobe
* Stripe
* Discord
* Airbnb
* Twilio
* Pinterest
* Figma
* Atlassian
* Razorpay
* Swiggy
* Cred
* Zepto
* Postman
* Vercel
* Notion

---

## Local Setup

1. Clone the repository.
2. Install dependencies for both the frontend and backend environments using `npm install`.
3. Configure your `.env` variables (MongoDB URI, JWT Secret, RapidAPI keys, Email credentials).
4. Run the backend server using `npm run dev`.
5. Launch the frontend development server using `npm run dev`.
