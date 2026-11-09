# Royal Jewellers

A full-stack jewellery store organized as a small monorepo:

~~~text
royal-jewellers/
  frontend/    React + Vite storefront
  backend/     Express API + MongoDB models
  docs/        Product and system plans
~~~

## Start locally

Run these from this folder in two PowerShell windows.

Frontend:

~~~powershell
npm install --prefix frontend
npm run dev:frontend
~~~

Backend:

~~~powershell
npm install --prefix backend
Copy-Item backend/.env.example backend/.env
~~~

Put the MongoDB connection URL in backend/.env as MONGODB_URI. Use the database royal_jawellars. Then start the backend:

~~~powershell
npm run dev:backend
~~~

The storefront is usually at http://localhost:5173 and the API health endpoint at http://localhost:4000/api/health. Customers register and sign in with email and password, can browse without signing in, and need an account to place an order. Password recovery uses an emailed reset link and two recovery answers. Admin access is assigned by changing the user's role in MongoDB. The admin can manage products, orders, and contact messages. Contact notes and newsletter subscriptions are saved in MongoDB. See frontend/README.md and backend/README.md for local setup. The project plan is in docs/PROJECT_PLAN.md.
