# 🎯 Engineer Job Tracker

A full-stack MERN application that helps engineering students and job seekers discover live job openings and track their applications through every stage — with AI-powered interview prep, cover letters, and job fit scoring.

**🔗 Live Demo:** https://engineer-job-tracker.vercel.app

## ✨ Features

- 🔍 Live engineering job listings (Software, DevOps, Data, Mechanical, Electrical, Civil)
- 🗂️ Drag-and-drop Kanban board (Applied → Interview → Offer → Rejected)
- 🔐 Secure authentication (JWT + bcrypt password hashing)
- ⭐ Save jobs for later before committing to track them
- 📝 Notes and interview date tracking per application
- ✨ AI-generated interview prep questions (Groq/Llama 3.3)
- ✉️ AI-generated cover letter openers
- 🎯 AI job fit scoring based on your skills
- 📱 Fully responsive design
- 💼 Custom favicon and branded page title

## 🛠️ Tech Stack

**Frontend:** React, Vite, React Router, Axios
**Backend:** Node.js, Express, JWT, bcrypt
**Database:** MongoDB Atlas + Mongoose
**AI:** Groq API (Llama 3.3)
**Third-party API:** RemoteOK

## 🚀 Getting Started Locally

### Prerequisites
- Node.js installed
- MongoDB Atlas account (free tier)
- Groq API key (free)

### Backend Setup
\`\`\`bash
cd backend
npm install
# create a .env file with MONGO_URI, JWT_SECRET, GROQ_API_KEY, PORT
npm run dev
\`\`\`

### Frontend Setup
\`\`\`bash
cd frontend
npm install
# create a .env file with VITE_API_URL=http://localhost:5000
npm run dev
\`\`\`

## 📸 Screenshots

*(add 2-3 screenshots here)*

## 👩‍💻 Author

Built by **Humaira Naaz**