# OldPhoneSales

OldPhoneDeals is a full-stack eCommerce platform built with React, Express, and MongoDB that specializes in buying and selling used mobile phones. The application features a user friendly interface where regular users can browse, search, and purchase phones, add items to their cart or wishlist, post reviews on products, and list their own phones for sale. For administrators, the system offers comprehensive management functionalities including user management, listing control, review moderation, and sales activity tracking. This project implements a complete separation between frontend and backend, with secure user authentication, responsive design, and real-time inventory updates. 

## Installation Requirements

### Prerequisites

- Node.js (v20.13.1 or higher)
- npm (v10.5.2 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Git

### Installation Steps

1. Clone the repository

```bash
git clone https://github.sydney.edu.au/COMP5347-COMP4347-2025/TUT9-G5.git
cd oldphonedeals
```

2. Install Backend Dependencies

```bash
cd server
npm install
```

3. Install Frontend Dependencies

```bash
cd client
npm install
```

### Set up Environment Variables

Create a `.env` file in the `server` directory (the backend folder). Add the following environment variables to this file:

```
MONGODB_URI=mongodb+srv://COMP5347Tut9G5:COMP5347Tut9G5@oldphonedeals.g41oq1k.mongodb.net/OldPhoneDeals?retryWrites=true&w=majority
PORT=7777
SESSION_SECRET=COMP6347

FRONTEND_URL=http://localhost:5173

EMAIL_SERVICE=SMTP
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=b48b3515fee370
EMAIL_PASS=0935404da627a7
EMAIL_FROM="OldPhoneDeals Team <no-reply@OldPhoneDeals.com>"

EMAIL_SERVICE_USING_GMAIL=true
EMAIL_SERVICE_GMAIL=gmail
EMAIL_USER_GMAIL=lyh2000410@gmail.com
EMAIL_PASS_GMAIL=tzbn bsja rxbl spot

PASSWORD_RESET_TOKEN_BYTES=32
PASSWORD_RESET_TOKEN_EXPIRY_MS=3600000

JWT_SECRET= 6cd5f4e20a0b06c202f2ff07532af5ec25c415fbd7259de618d36098cbc5a0a667f86c3a71b7aa25801e607ecd44b231bc64e20f17be0135a49d074f2fc993ff
BCRYPT_SALT_ROUNDS=12
```

#### Email Configuration

- **Email Service Selection**
    
    ```bash
    EMAIL_SERVICE_USING_GMAIL=true
    ```
    
    This environment variable controls which email service the application uses:
    
    - When set to `true`: The application uses Gmail's SMTP service
    - When set to `false`: The application uses Mailtrap's test SMTP service

- **Mailtrap Configuration**
    
    ```bash
    EMAIL_USER=b48b3515fee370
    EMAIL_PASS=0935404da627a7
    ```
    
    These fields are used when `EMAIL_SERVICE_USING_GMAIL` is set to `false`.
    To use your own Mailtrap account:
    
    1. Create an account on [Mailtrap.io](https://mailtrap.io/)
    2. Go to your Mailtrap inbox
    3. Find your SMTP credentials
    4. Replace these values with your own credentials

- **Gmail Configuration**
    
    ```bash
    EMAIL_USER_GMAIL=lyh2000410@gmail.com
    EMAIL_PASS_GMAIL=tzbn bsja rxbl spot
    ```
    
    These fields are used when `EMAIL_SERVICE_USING_GMAIL` is set to `true`.
    To use your own Gmail account:
    
    1. Set up 2-Step Verification in your Google Account
    2. Generate an App Password for the application
    3. Replace these values with your Gmail address and generated App Password
    
    For detailed instructions on setting up Gmail App Passwords, please watch this tutorial: [YouTube: How to Set Up App Password for Gmail](https://www.youtube.com/watch?v=hXiPshHn9Pw)
    
### Run the Application

To run the application, follow these steps:

1.  **Start the Backend Server:**
    Navigate to the server directory and run the development script:
    
    ```bash
    cd server
    npm run dev
    ```
    
2.  **Start the Frontend Development Server:**
    In a new terminal, navigate to the client directory and start the application:
    
    ```bash
    cd client
    npm run start
    ```
    
3.  **Access the Application:**
    Open your browser and go to [`http://localhost:5173/`](http://localhost:5173/).

## API Documentation

Backend API documentation is exposed via Swagger UI at: [`http://localhost:7777/api-docs`](http://localhost:7777/api-docs). 
This allows you to explore and test the available API endpoints when the backend server is running.

## Database

The application utilizes **MongoDB** as its primary datastore, with **Mongoose** serving as the Object Data Modeling (ODM) library to facilitate interaction with MongoDB from the Node.js backend.

### Connection

Database connection is configured through the `MONGODB_URI` environment variable, which should be defined in a `.env` file within the `server/` directory. The example `MONGODB_URI` provided in the setup instructions connects to a MongoDB Atlas cluster:
`MONGODB_URI=mongodb+srv://COMP5347Tut9G5:COMP5347Tut9G5@oldphonedeals.g41oq1k.mongodb.net/OldPhoneDeals?retryWrites=true&w=majority`

For comprehensive backend configuration details, please refer to the "Set up Environment Variables" section.

### Data Models (Collections)

The core data structures are defined as Mongoose schemas located in the `server/models/` directory. The main collections are:

*   **`User`** (`server/models/user.js`)
    *   **Purpose**: Manages user accounts and profiles.
    *   **Key Fields**: `firstname` (String), `lastname` (String), `email` (String, unique), `password` (String, hashed), `status` (Enum: `active`, `inactive`, `pending`), `role` (Enum: `admin`, `user`, `superAdmin`), `lastLoginTime` (Date), `timestamps`.
*   **`Phone`** (`server/models/phone.js`)
    *   **Purpose**: Represents mobile phone listings.
    *   **Key Fields**: `title` (String), `brand` (String), `image` (String, path to image file), `stock` (Number), `seller` (ObjectId, ref: `User`), `price` (Number), `status` (Enum: `available`, `disabled`), `timestamps`.
    *   **Embedded Reviews** (`ReviewSchema`): Contains an array of review sub-documents.
        *   **Key Fields**: `reviewer` (ObjectId, ref: `User`), `rating` (Number, 1-5), `comment` (String), `hidden` (String), `timestamps`.
*   **`Order`** (`server/models/order.js`)
    *   **Purpose**: Stores details of customer purchases.
    *   **Key Fields**: `user` (ObjectId, ref: `User`), `totalAmount` (Number), `status` (Enum: `pending`, `completed`, `cancelled`), `paymentMethod` (Enum: `credit_card`, `paypal`, `bank_transfer`), `note` (String), `timestamps`.
    *   **Embedded Order Items** (`OrderItemSchema`): Contains an array of items included in the order.
        *   **Key Fields**: `phone` (ObjectId, ref: `Phone`), `quantity` (Number), `price` (Number, price at time of order).
*   **`Cart`** (`server/models/cart.js`)
    *   **Purpose**: Manages items in a user's shopping cart. Each user has a single cart.
    *   **Key Fields**: `user` (ObjectId, ref: `User`, unique), `timestamps`.
    *   **Embedded Cart Items** (`CartItemSchema`): Contains an array of items in the cart.
        *   **Key Fields**: `phone` (ObjectId, ref: `Phone`), `quantity` (Number).
*   **`Wishlist`** (`server/models/wishlist.js`)
    *   **Purpose**: Manages a user's wishlist of desired phones. Each user has a single wishlist.
    *   **Key Fields**: `user` (ObjectId, ref: `User`, unique), `timestamps`.
    *   **Embedded Wishlist Items** (`WishlistItemSchema`): Contains an array of items in the wishlist.
        *   **Key Fields**: `phone` (ObjectId, ref: `Phone`).
*   **`PasswordResetToken`** (`server/models/passwordResetToken.js`)
    *   **Purpose**: Stores temporary tokens for password reset requests.
    *   **Key Fields**: `userId` (ObjectId, ref: `User`), `token` (String, indexed), `expiresAt` (Date, auto-expires), `timestamps`.

### Data Initialization & Seeding

The application provides several API endpoints for database initialization and seeding, intended primarily for development and initial setup. These operations are orchestrated by services in `server/service/dbInitService.js`, controllers in `server/controllers/dbInitController.js`, and routes defined in `server/routes/dbInit.js`.

1.  **Populate Basic Data (Users and Phones)**

    *   **Endpoint**: `PUT /api/admin/init-db`
    
    *   **Action**: This endpoint reads initial user data from `server/public/dataset/userlist.json` and phone product data from `server/public/dataset/phonelisting.json`. It then populates the `User` and `Phone` collections respectively.
        *   Users from `userlist.json` are created with a default hashed password and an `active` status.
        *   If a user ID from the JSON file already exists in the database, that user entry is skipped.

2.  **Initialize Phone Images**

    *   **Endpoint**: `PUT /api/admin/init-phone-images`
    
    *   **Action**: This service iterates through all existing phone documents in the database. For each phone, it attempts to locate a corresponding image file named `[brand].jpeg` within the `server/public/images/` directory (e.g., `server/public/images/Apple.jpeg`). If an image is found, the phone's `image` field is updated with the relative path (e.g., `/images/Apple.jpeg`).

3.  **Create an Administrator User**

    *   **Endpoint**: `POST /api/admin/init-admin`
    
    *   **Action**: Creates a new user with the `admin` role and `active` status.
    
    *   **Request Body (JSON)**:
        ```json
        {
          "firstname": "Admin",
          "lastname": "User",
          "email": "admin@example.com",
          "password": "yoursecurepassword"
        }
        ```
    *   The password provided in the request body is hashed before being stored.
    *   The system prevents the creation of an admin user if an account with the specified email address already exists.

## Built With

- [React](https://reactjs.org/) - A JavaScript library for building user interfaces
- [Express](https://expressjs.com/) - Fast, unopinionated, minimalist web framework for Node.js
- [MongoDB](https://www.mongodb.com/) - NoSQL database for modern applications
- [Node.js](https://nodejs.org/) - JavaScript runtime environment
- [Ant Design](https://ant.design/) - A design system for enterprise-level products
- [React Bootstrap](https://react-bootstrap.github.io/) - The most popular front-end framework rebuilt for React
- [Nodemailer](https://nodemailer.com/) - Module for Node.js to send emails
- [JWT](https://jwt.io/) - JSON Web Tokens for secure authentication
- [Mongoose](https://mongoosejs.com/) - MongoDB object modeling for Node.js

## Group Member

Zhuru Wang - mailto:zwan0933@uni.sydney.edu.au

Yihang Liu - mailto:yliu0826@uni.sydney.edu.au

Yi Xu - mailto:yixu4396@uni.sydney.edu.au

Weixuan Kong - mailto:wkon0621@uni.sydney.edu.au
