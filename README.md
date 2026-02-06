# Real-Time Classroom Interaction Platform 🎓

A modern, premium real-time classroom interaction web application for university students and lecturers. Built with React, TypeScript, Tailwind CSS, and Supabase.

## ✨ Features

### For Students

- Join sessions with a simple 6-digit code
- Answer multiple-choice questions with intuitive UI
- Submit essay/open-ended responses
- Clean, distraction-free interface
- Real-time question updates
- Anonymous participation

### For Teachers

- Create and manage classroom sessions
- Create MCQ and essay questions
- View real-time results as students submit answers
- **MCQ Results:**
  - Animated bar charts
  - Live counters per option
  - Percentage breakdowns
- **Essay Results:**
  - Answer versioning (new answers highlighted, old ones fade)
  - Real-time answer wall
  - Chronological display
- Projector-friendly design with high contrast

## 🚀 Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **Animations:** Framer Motion
- **Charts:** Recharts
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **Routing:** React Router v7

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account
- Modern web browser

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install clsx tailwind-merge uuid
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the migration file:
   - Execute `supabase/migrations/001_initial_schema.sql`
3. Get your project credentials:
   - Project URL
   - Anon/Public Key

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Create a Teacher Account

In your Supabase dashboard:

1. Go to Authentication > Users
2. Click "Add user"
3. Create an account with email/password
4. This will be your teacher login

### 5. Run the Application

```bash
npm run dev
```

Visit `http://localhost:5173`

## 🎯 Usage Guide

### For Students

1. Navigate to `/join`
2. Enter the 6-digit session code provided by your teacher
3. Wait for the teacher to activate a question
4. Answer and submit
5. You'll never see other students' answers or results

### For Teachers

1. Login at `/teacher/login`
2. Create a new session from the dashboard
3. Share the generated 6-digit code with students
4. Create questions (MCQ or Essay type)
5. Activate a question to display it to students
6. View real-time results as students submit answers
7. Deactivate when done and activate the next question

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── student/         # Student-specific components
│   └── teacher/         # Teacher-specific components
├── lib/
│   ├── supabase.ts      # Supabase client
│   ├── auth.ts          # Authentication utilities
│   └── utils.ts         # Helper functions
├── pages/
│   ├── student/         # Student pages
│   └── teacher/         # Teacher pages
├── types/
│   └── database.types.ts # TypeScript database types
├── App.tsx              # Main app with routing
└── main.tsx             # Entry point
```

## 🎨 Design Features

- **Modern Academic Aesthetic:** Calm colors, soft shadows, rounded corners
- **Glass Effects:** Subtle glassmorphism for depth
- **High Contrast:** Optimized for projector visibility
- **Smooth Animations:** Framer Motion for all transitions
- **Responsive Design:** Works on phones, tablets, desktops, and projectors
- **Touch-Friendly:** Large buttons and inputs for mobile/tablet users

## 🔐 Security

- Row Level Security (RLS) policies on all tables
- Teachers can only access their own sessions
- Students can only read active questions
- Answers are append-only (no updates or deletes)
- Anonymous student IDs for privacy

## 🌐 Deployment

### Build for Production

```bash
npm run build
```

The `dist` folder contains the static build, which can be deployed to:

- Vercel
- Netlify
- GitHub Pages
- Any static hosting service

### Environment Variables in Production

Make sure to set your Supabase credentials in your hosting platform's environment variables.

## 📝 Database Schema

- **sessions:** Classroom sessions with unique codes
- **questions:** MCQ or essay questions linked to sessions
- **options:** Multiple choice options (for MCQ questions)
- **answers:** Student submissions (append-only)

## 🚨 Important Notes

1. **Student Answers are Versioned:** When a student submits multiple answers to the same essay question, all answers are kept. The latest answer is highlighted, and older answers fade.

2. **Only One Active Question:** Only one question can be active per session at a time. Activating a new question automatically deactivates the previous one.

3. **Anonymous Students:** Students don't create accounts. They get a random UUID stored in localStorage. Clearing browser data creates a new identity.

4. **Real-time Only on Submit:** For essay questions, answers are sent ONLY when the student clicks Submit. There is no live typing broadcast.

## 🎓 Perfect for

- University lectures
- Classroom polls
- Quick assessments
- Interactive Q&A sessions
- Student feedback collection
- Workshop participation tracking

---

**Built with ❤️ for modern classrooms**
