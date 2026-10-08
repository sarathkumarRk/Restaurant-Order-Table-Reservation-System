🍽️ Restaurant Order & Table Reservation System
A full-stack restaurant management system built using FastAPI, React Vite, MySQL, SQLAlchemy, JWT Authentication, Stripe, SMTP Email, Cloudinary, and Pytest.
The application supports customer food ordering, cart management, Stripe payments, table reservations, and an admin dashboard for managing menu items, categories, tables, orders, reservations, and reports.
📌 1. Project Overview
The Restaurant Order & Table Reservation System provides two main roles:
👤 Customer
Customers can:
- Register and login
- Browse food items
- Search food
- Filter food by category and price
- View food details
- Add food to cart
- Update cart quantity
- Remove cart items
- Place orders
- Make Stripe test payments
- View order history
- View order details
- Create table reservations
- View reservations
- Cancel reservations
- Receive email notifications
👨‍💼 Admin
Admins can:
- Login with admin role
- View dashboard statistics
- Manage categories
- Create food items
- Update food items
- Delete food items
- Upload food images
- Manage food availability
- Manage restaurant tables
- View all orders
- Update order status
- View all reservations
- Update reservation status
- View revenue reports
- View most ordered foods
- View top customers
🏗️ 2. Application Architecture
                    ┌──────────────────────┐
                    │      React Vite      │
                    │      Frontend        │
                    └──────────┬───────────┘
                               │
                               │ HTTP / REST API
                               ▼
                    ┌──────────────────────┐
                    │       FastAPI        │
                    │       Backend        │
                    └──────────┬───────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
       ┌──────────┐      ┌───────────┐    ┌───────────┐
       │  MySQL   │      │  Stripe   │    │ Cloudinary │
       │ Database │      │ Payments  │    │   Images   │
       └──────────┘      └───────────┘    └───────────┘
                               │
                               ▼
                         ┌───────────┐
                         │   SMTP    │
                         │  Email    │
                         └───────────┘

Backend Architecture
backend/
│
├── app/
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── dependencies.py
│   ├── security.py
│   │
│   ├── models/
│   ├── schemas/
│   ├── routers/
│   └── services/
│
├── tests/
├── .env
├── .env.example
├── requirements.txt
└── README.md

🗄️ 3. Database Structure
The application uses MySQL with SQLAlchemy ORM.
Main Tables
users
  │
  ├─────────────── orders
  │                    │
  │                    └── order_items
  │                              │
  │                              └── menu_items
  │
  ├─────────────── cart
  │                    │
  │                    └── cart_items
  │                              │
  │                              └── menu_items
  │
  └─────────────── reservations
                       │
                       └── restaurant_tables


categories
    │
    └── menu_items


orders
    │
    └── payments


reservations
    │
    └── payments

Database Entities
Table	Purpose
users	Customer and admin accounts
categories	Food categories
menu_items	Restaurant food items
cart	Customer shopping cart
cart_items	Items inside cart
orders	Customer orders
order_items	Foods inside orders
restaurant_tables	Restaurant table information
reservations	Customer table reservations
payments	Stripe payment records


Important Relationships
User 1 ──── * Orders

User 1 ──── 1 Cart

Cart 1 ──── * CartItems

MenuItem 1 ──── * CartItems

Order 1 ──── * OrderItems

MenuItem 1 ──── * OrderItems

Category 1 ──── * MenuItems

User 1 ──── * Reservations

RestaurantTable 1 ──── * Reservations

Order 1 ──── * Payments

Reservation 1 ──── * Payments

🔐 4. Authentication
Authentication uses:
- JWT
- Password hashing
- Role-based authorization
Roles
CUSTOMER
ADMIN

Authentication Flow
Register
   ↓
Password Hash
   ↓
Database
   ↓
Login
   ↓
JWT Token
   ↓
Frontend localStorage
   ↓
Authorization: Bearer <token>
   ↓
FastAPI

📡 5. API Endpoints
Authentication
Method	Endpoint	Access
POST	/auth/register	Public
POST	/auth/login	Public
GET	/auth/me	Authenticated


Categories
Method	Endpoint	Access
POST	/categories	Admin
GET	/categories	Authenticated
GET	/categories/{category_id}	Authenticated
PUT	/categories/{category_id}	Admin
DELETE	/categories/{category_id}	Admin


Menu
Method	Endpoint	Access
POST	/menu	Admin
GET	/menu	Authenticated
GET	/menu/{menu_id}	Authenticated
PUT	/menu/{menu_id}	Admin
DELETE	/menu/{menu_id}	Admin
POST	/menu/{menu_id}/image	Admin


Menu Search
GET /menu?page=1&limit=10

Search
GET /menu?search=biryani

Category Filter
GET /menu?category=Biryani

Price Filter
GET /menu?min_price=100&max_price=500

Pagination
GET /menu?page=2&limit=10

🛒 6. Cart APIs
Method	Endpoint
GET	/cart
POST	/cart/items
PUT	/cart/items/{item_id}
DELETE	/cart/items/{item_id}
DELETE	/cart


Only authenticated customers can access cart APIs.
📦 7. Order APIs
Method	Endpoint	Access
POST	/orders	Customer
GET	/orders	Customer
GET	/orders/{order_id}	Customer
GET	/orders/admin/all	Admin
PUT	/orders/admin/{order_id}/status	Admin


Order Status
ORDER_PLACED
      ↓
CONFIRMED
      ↓
PREPARING
      ↓
READY
      ↓
COMPLETED

Cancellation:
ORDER_PLACED → CANCELLED
CONFIRMED → CANCELLED

🪑 8. Table APIs
Method	Endpoint	Access
POST	/tables	Admin
GET	/tables	Authenticated
GET	/tables/{table_id}	Authenticated
PUT	/tables/{table_id}	Admin
DELETE	/tables/{table_id}	Admin


📅 9. Reservation APIs
Method	Endpoint	Access
GET	/reservations/available-tables	Customer
POST	/reservations	Customer
GET	/reservations	Customer
GET	/reservations/{reservation_id}	Customer
PUT	/reservations/{reservation_id}/cancel	Customer
GET	/reservations/admin/all	Admin
PUT	/reservations/admin/{reservation_id}/status	Admin


Reservation Status
PENDING
   ↓
CONFIRMED
   ↓
COMPLETED

Cancellation:
PENDING → CANCELLED
CONFIRMED → CANCELLED

💳 10. Stripe APIs
Method	Endpoint
POST	/payments/create-checkout-session
POST	/payments/webhook


Payment Status
PENDING
SUCCESS
FAILED
REFUNDED

Payment Flow
Customer
   ↓
Place Order
   ↓
Create Stripe Checkout Session
   ↓
Stripe Checkout
   ↓
Test Payment
   ↓
Stripe Webhook
   ↓
FastAPI Webhook
   ↓
Update Payment
   ↓
SUCCESS

The frontend does not directly mark the payment as successful. Stripe webhook processing updates the payment status.
📊 11. Admin Reports
The admin dashboard provides:
Dashboard
Total Orders
Today's Orders
Total Revenue
Today's Revenue
Pending Orders
Today's Reservations

Reports
Most Ordered Foods
Total Revenue
Daily Revenue
Reservations Per Day
Top Customers

Endpoints:
GET /admin/dashboard
GET /admin/most-ordered-foods
GET /admin/total-revenue
GET /admin/daily-revenue
GET /admin/reservations-per-day
GET /admin/top-customers

⚙️ 12. Setup Instructions
Step 1 — Clone Project
git clone <your-github-repository-url>
cd restaurant-order-system

🐍 13. Backend Setup
Go to backend:
cd backend

Create virtual environment:
python -m venv venv

Activate on Windows:
venv\Scripts\activate

Install dependencies:
pip install -r requirements.txt

🗄️ 14. MySQL Setup
Create database:
CREATE DATABASE restaurant_db;

Example database URL:
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/restaurant_db

Update the credentials according to your MySQL installation.
🔑 15. Environment Variables
Create:
backend/.env

Use .env.example as the template.
Example:
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/restaurant_db

SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=yourgmail@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM_EMAIL=yourgmail@gmail.com

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

Never commit .env to GitHub.
Only commit:
.env.example

💳 16. Stripe Setup
Create a Stripe account and use Test Mode.
Add your Stripe secret key:
STRIPE_SECRET_KEY=sk_test_xxxxxxxxx

Run the backend:
uvicorn app.main:app --reload

In another terminal, run Stripe CLI:
stripe listen --forward-to localhost:8000/payments/webhook

Stripe CLI will provide:
whsec_xxxxxxxxx

Add it to .env:
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxx

Restart the backend after updating .env.
Test Card
Use:
Card Number: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any valid ZIP

📧 17. Email Setup
The project uses SMTP for email notifications.
For Gmail:
1. Enable 2-Step Verification.
2. Create a Gmail App Password.
3. Add the App Password to .env.
Example:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=yourgmail@gmail.com
SMTP_PASSWORD=your_16_character_app_password
SMTP_FROM_EMAIL=yourgmail@gmail.com

Email notifications include:
Payment Success
Order Status Change
Reservation Confirmation
Reservation Cancellation

🖼️ 18. Image Upload Setup
The project uses Cloudinary for food image uploads.
Add Cloudinary credentials:
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

Supported image formats:
JPG
JPEG
PNG
WEBP

Image flow:
Admin
  ↓
Select Food Image
  ↓
React
  ↓
FastAPI
  ↓
Cloudinary
  ↓
Image URL
  ↓
MySQL

The database stores the Cloudinary image URL rather than the image file itself.
🚀 19. Backend Execution
From the backend directory:
venv\Scripts\activate

Run FastAPI:
uvicorn app.main:app --reload

Backend:
http://127.0.0.1:8000

📖 20. Swagger API Documentation
FastAPI automatically provides Swagger documentation.
Open:
http://127.0.0.1:8000/docs

Alternative ReDoc:
http://127.0.0.1:8000/redoc

Swagger can be used to test:
- Authentication
- Menu
- Categories
- Cart
- Orders
- Reservations
- Tables
- Payments
- Admin APIs
For protected APIs:
Authorize
↓
Bearer <JWT_TOKEN>

⚛️ 21. Frontend Setup
Open another terminal.
cd frontend

Install dependencies:
npm install

Run React Vite:
npm run dev

Frontend will normally run at:
http://localhost:5173

🔔 22. Toast Notifications
The frontend uses:
react-toastify

Toast notifications are displayed for:
- Login success/failure
- Registration success/failure
- Food creation
- Food update
- Food deletion
- Image upload
- Cart operations
- Order creation
- Reservation creation
- Reservation cancellation
- API errors
🔎 23. Search, Filtering & Pagination
Menu API supports:
Search
/menu?search=biryani

Category
/menu?category=Biryani

Minimum Price
/menu?min_price=100

Maximum Price
/menu?max_price=500

Pagination
/menu?page=1&limit=10

Example response:
{
  "items": [],
  "page": 1,
  "limit": 10,
  "total": 25,
  "total_pages": 3
}

🧪 24. Testing
The project uses Pytest.
From backend:
pytest

For verbose output:
pytest -v

Run a specific test file:
pytest tests/test_auth.py -v

Run a specific test:
pytest tests/test_auth.py::test_register -v

🧪 25. Test Coverage Areas
The test suite should cover important business logic including:
User Registration
User Login
JWT Authentication
Role Authorization
Menu Creation
Menu Search
Menu Pagination
Cart Operations
Order Creation
Order Ownership
Reservation Creation
Reservation Duplicate Validation
Table Availability
Reservation Cancellation
Admin Authorization
Order Status Transition