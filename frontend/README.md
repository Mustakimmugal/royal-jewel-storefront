# MH JEWELLERS frontend

This folder contains the React/Vite storefront. The backend lives in the sibling folder backend.

## Run locally

Requirements: Node.js 20 or newer and MongoDB local or Atlas.

1. In this folder, install dependencies and start the frontend:

   ~~~powershell
   npm install
   npm run dev
   ~~~

2. In another PowerShell window, open the backend folder, create its environment file from the example, set MONGODB_URI, and start the API:

   ~~~powershell
   cd ..\backend
   npm install
   Copy-Item .env.example .env
   npm run dev
   ~~~

The database name should be royal_jawellars. The API reads backend/.env first and can also read MONGODB_URI from frontend/.env. The API health endpoint is http://localhost:4000/api/health.

From this frontend folder, npm run dev:api starts the sibling backend.

The catalog uses API products when available and sample products as a local fallback. Customers register and sign in with email and password. Password reset uses a one-time email link followed by the account's recovery answers; local reset links print in the backend terminal. A signed-in session is required to place COD orders. Signed-in customers can view their order history from the account icon. Email provider credentials, online payments, media uploads, advanced admin modules, and production hosting are not configured yet.
