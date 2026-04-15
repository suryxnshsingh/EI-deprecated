const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authenticateToken = require('../middleware/auth');
const prisma = new PrismaClient();
const router = express.Router();


// Create a new subject
router.post('/newsubject', authenticateToken, async (req, res) => {
  const { name, code, session, semester } = req.body;
  const teacherId = req.teacher.teacherId;

  if (!name || !code || !session || semester === undefined || semester === null) {
    return res.status(400).json({ error: 'name, code, session and semester are required' });
  }

  const semesterInt = parseInt(semester, 10);
  if (Number.isNaN(semesterInt)) {
    return res.status(400).json({ error: 'semester must be an integer' });
  }

  try {
    const subject = await prisma.subject.create({
      data: { name, code, session, semester: semesterInt, teacherId },
    });
    res.status(201).json(subject);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Subject with this code, session and semester already exists' });
    }
    console.error("Error creating subject:", error);
    res.status(500).json({ error: "Failed to create subject" });
  }
});

//get all subjects for a teacher
router.get('/subjects', authenticateToken, async (req, res) => {
  const teacherId = req.teacher.teacherId;

  try {
    const subjects = await prisma.subject.findMany({
      where: { teacherId },
      orderBy: [{ session: 'desc' }, { semester: 'desc' }, { code: 'asc' }],
    });
    res.json(subjects);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
});

//get all subjects irrespective of teacher
router.get('/allsubjects', async (req, res) => {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: [{ session: 'desc' }, { semester: 'desc' }, { code: 'asc' }],
    });
    res.json(subjects);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
});

module.exports = router;
