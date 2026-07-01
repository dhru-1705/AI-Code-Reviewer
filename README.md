# AI Code Reviewer

An AI-powered Code Reviewer built using the MERN Stack that helps developers and students analyze, improve, and optimize their source code using Artificial Intelligence.

The application supports multiple programming languages and provides intelligent code reviews, bug detection, performance suggestions, security recommendations, and optimized code generation.

---

# Features

## User Authentication

- User Registration
- Secure Login
- JWT Authentication
- Password Encryption using bcrypt
- Protected Routes
- Auto Login
- Logout

---

## AI Code Review

- Monaco Code Editor
- Multiple Programming Languages
- AI-Powered Code Analysis
- Syntax Review
- Logical Issue Detection
- Performance Suggestions
- Security Review
- Best Practices
- Optimized Code Generation
- AI Explanation

---

### Dual Analysis Mode

####  Enhanced Analysis

Available for:

- JavaScript
- TypeScript
- Python
- HTML
- CSS

Uses language-specific validators before AI analysis.

---

####  AI Review Only

Available for:

- Java
- C
- C++
- Go

Provides intelligent static analysis without local compilation.

---

###  Review History

- Save Previous Reviews
- View Review History
- Review Details
- Score Tracking
- AI Generated Reports

---

###  User Interface

- Responsive Design
- Dark Mode
- Premium Dashboard
- Monaco Editor
- Interactive Review Panels
- Modern Animations
- Toast Notifications

---

##  Tech Stack

### Frontend

- React.js
- Vite
- Tailwind CSS
- React Router DOM
- Axios
- React Icons
- React Toastify
- Monaco Editor

### Backend

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT Authentication
- bcrypt.js
- dotenv
- CORS

### AI Integration

- Groq API

### Development Tools

- Visual Studio Code
- Git
- GitHub
- Postman

---

## 📂 Project Structure

```
AI-Code-Reviewer
│
├── backend
│   ├── config
│   ├── controllers
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── services
│   ├── utils
│   ├── temp
│   ├── server.js
│   └── package.json
│
├── frontend
│   ├── src
│   │   ├── components
│   │   ├── context
│   │   ├── layouts
│   │   ├── pages
│   │   ├── services
│   │   ├── assets
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   └── package.json
│
├── README.md
└── .env.example
```

---

# Installation

### Clone Repository

```bash
git clone https://github.com/dhru-1705/AI-Code-Reviewer
cd AI-Code-Reviewer
```

---

# Backend Setup

```bash
cd backend

npm install
```

Create a `.env` file

```env
PORT=5000

MONGO_URI=YOUR_MONGODB_URI

JWT_SECRET=YOUR_SECRET

GROQ_API_KEY=YOUR_GROQ_API_KEY
```

Run Backend

```bash
npm run dev
```

---

# Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

---

# Application Flow

```
User Login/Register
        │
        ▼
Dashboard
        │
        ▼
Select Language
        │
        ▼
Write / Paste Code
        │
        ▼
Select Review Type
        │
        ▼
Analyze with AI
        │
        ▼
Enhanced Analysis
        │
        ▼
AI Code Review
        │
        ▼
Review Report
        │
        ▼
Save History
```

# Authentication

- JWT Authentication
- bcrypt Password Hashing
- Protected Routes
- Persistent Login
- Secure Logout

---

# AI Features

- Code Quality Analysis
- Bug Detection
- Performance Optimization
- Security Suggestions
- Best Practices
- AI Explanation
- Optimized Code Generation

---

# Supported Languages

| Language | Analysis Mode |
|----------|---------------|
| JavaScript | Enhanced Analysis |
| TypeScript | Enhanced Analysis |
| Python | Enhanced Analysis |
| HTML | Enhanced Analysis |
| CSS | Enhanced Analysis |
| Java | AI Review Only |
| C | AI Review Only |
| C++ | AI Review Only |
| Go | AI Review Only |

---

# Future Improvements

- File Upload Support
- PDF Report Download
- GitHub Repository Review
- Team Collaboration
- AI Chat Assistant
- Real Compiler Integration
- Docker Deployment
- Code Comparison View
- AI Code Explanation Chat

---

#  Author

**Dhru Patel**

B.Tech Information Technology

---

# License

This project was developed for educational and internship purposes.


# Acknowledgements

- OriginEdge Technologies
- Groq API
- MongoDB Atlas
- React
- Express
- Tailwind CSS
- Monaco Editor
