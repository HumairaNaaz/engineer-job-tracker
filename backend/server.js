const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const Application = require('./models/Application');
const SavedJob = require('./models/SavedJob');
const authRoutes = require('./routes/auth');
const requireAuth = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// AUTH ROUTES
app.use('/api/auth', authRoutes);

// ROUTE: Fetch live engineering jobs (public, no login needed)
app.get('/api/jobs', async (req, res) => {
  try {
    const response = await axios.get('https://remoteok.com/api', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const categoryMap = {
      Software: ['software', 'fullstack', 'full-stack', 'developer', 'frontend', 'backend', 'react', 'node', 'java', 'python', 'javascript'],
      DevOps: ['devops', 'sre', 'infrastructure', 'cloud', 'kubernetes', 'aws', 'platform'],
      Data: ['data engineer', 'data scientist', 'machine learning', 'ml', 'ai', 'analytics'],
      Mechanical: ['mechanical'],
      Electrical: ['electrical', 'embedded', 'hardware', 'firmware'],
      Civil: ['civil', 'structural', 'construction'],
      Other: [],
    };

    function getCategory(text) {
      const lower = text.toLowerCase();
      for (const [category, keywords] of Object.entries(categoryMap)) {
        if (keywords.some((kw) => lower.includes(kw))) return category;
      }
      return 'Other';
    }

    const engineeringKeywords = [
      'engineer', 'developer', 'dev', 'software', 'backend', 'frontend',
      'fullstack', 'full-stack', 'devops', 'data', 'cloud', 'infrastructure',
      'mechanical', 'electrical', 'civil', 'embedded', 'hardware', 'systems'
    ];

    const jobs = response.data
      .slice(1, 100)
      .filter((job) =>
        job.position &&
        job.company &&
        !job.position.toLowerCase().includes("don't currently have") &&
        !job.position.startsWith('http')
      )
      .filter((job) => {
        const text = (job.position + ' ' + (job.tags || []).join(' ')).toLowerCase();
        return engineeringKeywords.some((kw) => text.includes(kw));
      })
      .map((job) => {
        const cleanPosition = job.position
          .replace(/&amp;/g, '&')
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"');
        const combinedText = cleanPosition + ' ' + (job.tags || []).join(' ');
        return { ...job, position: cleanPosition, category: getCategory(combinedText) };
      })
      .slice(0, 30);

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch jobs' });
  }
});

// PROTECTED ROUTES BELOW — require login

app.get('/api/applications', requireAuth, async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.userId }).sort({ dateAdded: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch applications' });
  }
});

app.post('/api/applications', requireAuth, async (req, res) => {
  try {
    const { company, position, url } = req.body;
    const exists = await Application.findOne({ userId: req.userId, company, position });
    if (exists) return res.status(409).json({ message: 'Already tracked' });

    const newApp = new Application({ userId: req.userId, company, position, url });
    await newApp.save();
    res.json(newApp);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add application' });
  }
});

app.put('/api/applications/:id', requireAuth, async (req, res) => {
  try {
    const { status, notes, interviewDate } = req.body;
    const updateFields = {};
    if (status !== undefined) updateFields.status = status;
    if (notes !== undefined) updateFields.notes = notes;
    if (interviewDate !== undefined) updateFields.interviewDate = interviewDate;

    const updated = await Application.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updateFields,
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update application' });
  }
});

app.delete('/api/applications/:id', requireAuth, async (req, res) => {
  try {
    await Application.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete application' });
  }
});
// ROUTE: Get all saved (bookmarked) jobs for logged-in user
app.get('/api/saved', requireAuth, async (req, res) => {
  try {
    const saved = await SavedJob.find({ userId: req.userId }).sort({ savedAt: -1 });
    res.json(saved);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch saved jobs' });
  }
});

// ROUTE: Save (bookmark) a job
app.post('/api/saved', requireAuth, async (req, res) => {
  try {
    const { jobId, position, company, url } = req.body;
    const exists = await SavedJob.findOne({ userId: req.userId, jobId });
    if (exists) return res.status(409).json({ message: 'Already saved' });

    const newSaved = new SavedJob({ userId: req.userId, jobId, position, company, url });
    await newSaved.save();
    res.json(newSaved);
  } catch (error) {
    res.status(500).json({ message: 'Failed to save job' });
  }
});

// ROUTE: Remove a saved job
app.delete('/api/saved/:id', requireAuth, async (req, res) => {
  try {
    await SavedJob.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ message: 'Removed' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove saved job' });
  }
});
// ROUTE: Generate AI interview prep questions for a job
app.post('/api/ai/interview-prep', requireAuth, async (req, res) => {
  try {
    const { position, company } = req.body;

    const groqResponse = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: `Give me 5 likely interview questions for a "${position}" role at "${company}". Return ONLY a numbered list of 5 questions, no intro or explanation, no markdown formatting.`,
          },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const text = groqResponse.data.choices[0].message.content;
    res.json({ questions: text });
  } catch (error) {
    console.error('Groq API error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Failed to generate interview questions' });
  }
});

// ROUTE: Generate AI cover letter opening paragraph
app.post('/api/ai/cover-letter', requireAuth, async (req, res) => {
  try {
    const { position, company } = req.body;
    const user = await require('./models/User').findById(req.userId);

    const groqResponse = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: `Write a compelling 3-sentence cover letter opening paragraph for ${user?.name || 'a candidate'} applying to the "${position}" role at "${company}". Make it enthusiastic but professional, and specific to this role. Return ONLY the paragraph text, no intro, no explanation, no quotation marks.`,
          },
        ],
        temperature: 0.8,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const text = groqResponse.data.choices[0].message.content;
    res.json({ coverLetter: text });
  } catch (error) {
    console.error('Groq API error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Failed to generate cover letter' });
  }
});

// ROUTE: Get logged-in user's profile (including skills)
app.get('/api/profile', requireAuth, async (req, res) => {
  try {
    const User = require('./models/User');
    const user = await User.findById(req.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// ROUTE: Update skills
app.put('/api/profile/skills', requireAuth, async (req, res) => {
  try {
    const User = require('./models/User');
    const { skills } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.userId,
      { skills },
      { new: true }
    ).select('-password');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update skills' });
  }
});

// ROUTE: AI Job Fit Score
app.post('/api/ai/job-fit', requireAuth, async (req, res) => {
  try {
    const User = require('./models/User');
    const { position, company, tags } = req.body;
    const user = await User.findById(req.userId);

    if (!user.skills || user.skills.trim() === '') {
      return res.status(400).json({ message: 'Please add your skills in your profile first' });
    }

    const groqResponse = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: `A candidate has these skills: "${user.skills}". 
A job posting is: "${position}" at "${company}", with tags: ${(tags || []).join(', ')}.
Rate how well this candidate's skills match this job on a scale of 0-100.
Respond ONLY in this exact format, nothing else:
SCORE: [number]
REASON: [one short sentence explaining the score]`,
          },
        ],
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const text = groqResponse.data.choices[0].message.content;
    const scoreMatch = text.match(/SCORE:\s*(\d+)/i);
    const reasonMatch = text.match(/REASON:\s*(.+)/i);

    res.json({
      score: scoreMatch ? parseInt(scoreMatch[1]) : null,
      reason: reasonMatch ? reasonMatch[1].trim() : text,
    });
  } catch (error) {
    console.error('Groq API error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Failed to calculate job fit' });
  }
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));