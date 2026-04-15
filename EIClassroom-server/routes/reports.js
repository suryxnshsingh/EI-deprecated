const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authenticateToken = require('../middleware/auth');
const prisma = new PrismaClient();
const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Helper: ensure the teacher owns the report
async function assertOwnsReport(reportId, teacherId) {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) return { error: 'Report not found', status: 404 };
  if (report.teacherId !== teacherId) return { error: 'Forbidden', status: 403 };
  return { report };
}

async function assertOwnsSemester(semesterId, teacherId) {
  const sem = await prisma.reportSemester.findUnique({
    where: { id: semesterId },
    include: { report: true },
  });
  if (!sem) return { error: 'Semester not found', status: 404 };
  if (sem.report.teacherId !== teacherId) return { error: 'Forbidden', status: 403 };
  return { semester: sem };
}

async function assertOwnsSubjectRow(rowId, teacherId) {
  const row = await prisma.reportSubject.findUnique({
    where: { id: rowId },
    include: { semester: { include: { report: true } } },
  });
  if (!row) return { error: 'Row not found', status: 404 };
  if (row.semester.report.teacherId !== teacherId) return { error: 'Forbidden', status: 403 };
  return { row };
}

// List teacher's subjects with snapshot availability (used by the add-subject picker)
router.get('/available-subjects', async (req, res) => {
  const teacherId = req.teacher.teacherId;
  try {
    const subjects = await prisma.subject.findMany({
      where: { teacherId },
      orderBy: [{ session: 'desc' }, { semester: 'desc' }, { code: 'asc' }],
      include: { POSnapshot: { select: { updatedAt: true } } },
    });
    res.json(
      subjects.map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        session: s.session,
        semester: s.semester,
        hasSnapshot: Boolean(s.POSnapshot),
        snapshotUpdatedAt: s.POSnapshot?.updatedAt || null,
      }))
    );
  } catch (error) {
    console.error('Error listing available subjects:', error);
    res.status(500).json({ error: 'Failed to list subjects' });
  }
});

// List reports for current teacher
router.get('/', async (req, res) => {
  const teacherId = req.teacher.teacherId;
  try {
    const reports = await prisma.report.findMany({
      where: { teacherId },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(reports);
  } catch (error) {
    console.error('Error listing reports:', error);
    res.status(500).json({ error: 'Failed to list reports' });
  }
});

// Create report
router.post('/', async (req, res) => {
  const teacherId = req.teacher.teacherId;
  const { name } = req.body;
  if (!name || typeof name !== 'string') return res.status(400).json({ error: 'name is required' });
  try {
    const report = await prisma.report.create({ data: { name, teacherId } });
    res.json(report);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// Get full report tree
router.get('/:id', async (req, res) => {
  const teacherId = req.teacher.teacherId;
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  try {
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        semesters: {
          orderBy: { order: 'asc' },
          include: {
            subjects: {
              orderBy: { order: 'asc' },
              include: { subject: { select: { id: true, code: true, name: true, session: true, semester: true } } },
            },
          },
        },
      },
    });
    if (!report) return res.status(404).json({ error: 'Report not found' });
    if (report.teacherId !== teacherId) return res.status(403).json({ error: 'Forbidden' });
    res.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// Rename report
router.patch('/:id', async (req, res) => {
  const teacherId = req.teacher.teacherId;
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const owner = await assertOwnsReport(id, teacherId);
  if (owner.error) return res.status(owner.status).json({ error: owner.error });
  try {
    const report = await prisma.report.update({ where: { id }, data: { name } });
    res.json(report);
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

// Delete report
router.delete('/:id', async (req, res) => {
  const teacherId = req.teacher.teacherId;
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  const owner = await assertOwnsReport(id, teacherId);
  if (owner.error) return res.status(owner.status).json({ error: owner.error });
  try {
    await prisma.report.delete({ where: { id } });
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

// Add semester
router.post('/:id/semesters', async (req, res) => {
  const teacherId = req.teacher.teacherId;
  const reportId = parseInt(req.params.id, 10);
  if (Number.isNaN(reportId)) return res.status(400).json({ error: 'Invalid id' });
  const { label, order } = req.body;
  if (!label) return res.status(400).json({ error: 'label is required' });
  const owner = await assertOwnsReport(reportId, teacherId);
  if (owner.error) return res.status(owner.status).json({ error: owner.error });
  try {
    const count = await prisma.reportSemester.count({ where: { reportId } });
    const sem = await prisma.reportSemester.create({
      data: { reportId, label, order: typeof order === 'number' ? order : count },
    });
    res.json(sem);
  } catch (error) {
    console.error('Error adding semester:', error);
    res.status(500).json({ error: 'Failed to add semester' });
  }
});

// Update semester
router.patch('/semesters/:semId', async (req, res) => {
  const teacherId = req.teacher.teacherId;
  const semId = parseInt(req.params.semId, 10);
  if (Number.isNaN(semId)) return res.status(400).json({ error: 'Invalid id' });
  const owner = await assertOwnsSemester(semId, teacherId);
  if (owner.error) return res.status(owner.status).json({ error: owner.error });
  const { label, order } = req.body;
  const data = {};
  if (label !== undefined) data.label = label;
  if (order !== undefined) data.order = order;
  try {
    const sem = await prisma.reportSemester.update({ where: { id: semId }, data });
    res.json(sem);
  } catch (error) {
    console.error('Error updating semester:', error);
    res.status(500).json({ error: 'Failed to update semester' });
  }
});

// Delete semester
router.delete('/semesters/:semId', async (req, res) => {
  const teacherId = req.teacher.teacherId;
  const semId = parseInt(req.params.semId, 10);
  if (Number.isNaN(semId)) return res.status(400).json({ error: 'Invalid id' });
  const owner = await assertOwnsSemester(semId, teacherId);
  if (owner.error) return res.status(owner.status).json({ error: owner.error });
  try {
    await prisma.reportSemester.delete({ where: { id: semId } });
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting semester:', error);
    res.status(500).json({ error: 'Failed to delete semester' });
  }
});

// Add subject row to semester — freezes current POSnapshot.overallAverage
router.post('/semesters/:semId/subjects', async (req, res) => {
  const teacherId = req.teacher.teacherId;
  const semId = parseInt(req.params.semId, 10);
  if (Number.isNaN(semId)) return res.status(400).json({ error: 'Invalid id' });
  const owner = await assertOwnsSemester(semId, teacherId);
  if (owner.error) return res.status(owner.status).json({ error: owner.error });

  const { subjectId, category, theoryPractical } = req.body;
  if (!subjectId || !theoryPractical) {
    return res.status(400).json({ error: 'subjectId and theoryPractical are required' });
  }

  try {
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    if (subject.teacherId !== teacherId) return res.status(403).json({ error: 'Forbidden' });

    const snapshot = await prisma.pOSnapshot.findUnique({ where: { subjectId } });
    if (!snapshot) {
      return res.status(400).json({ error: 'Subject has no committed PO snapshot. Commit PO first.' });
    }

    const count = await prisma.reportSubject.count({ where: { semesterId: semId } });
    const row = await prisma.reportSubject.create({
      data: {
        semesterId: semId,
        subjectId,
        category: category ?? null,
        theoryPractical,
        overallPO: snapshot.overallAverage,
        order: count,
      },
      include: { subject: { select: { id: true, code: true, name: true, session: true, semester: true } } },
    });
    res.json(row);
  } catch (error) {
    console.error('Error adding subject row:', error);
    res.status(500).json({ error: 'Failed to add subject row' });
  }
});

// Update subject row — optionally refresh overallPO from latest snapshot
router.patch('/subjects/:rowId', async (req, res) => {
  const teacherId = req.teacher.teacherId;
  const rowId = parseInt(req.params.rowId, 10);
  if (Number.isNaN(rowId)) return res.status(400).json({ error: 'Invalid id' });
  const owner = await assertOwnsSubjectRow(rowId, teacherId);
  if (owner.error) return res.status(owner.status).json({ error: owner.error });

  const { category, theoryPractical, order, refreshPO } = req.body;
  const data = {};
  if (category !== undefined) data.category = category;
  if (theoryPractical !== undefined) data.theoryPractical = theoryPractical;
  if (order !== undefined) data.order = order;

  try {
    if (refreshPO) {
      const snapshot = await prisma.pOSnapshot.findUnique({ where: { subjectId: owner.row.subjectId } });
      if (!snapshot) return res.status(400).json({ error: 'No committed PO snapshot for this subject' });
      data.overallPO = snapshot.overallAverage;
    }
    const row = await prisma.reportSubject.update({
      where: { id: rowId },
      data,
      include: { subject: { select: { id: true, code: true, name: true, session: true, semester: true } } },
    });
    res.json(row);
  } catch (error) {
    console.error('Error updating subject row:', error);
    res.status(500).json({ error: 'Failed to update subject row' });
  }
});

// Delete subject row
router.delete('/subjects/:rowId', async (req, res) => {
  const teacherId = req.teacher.teacherId;
  const rowId = parseInt(req.params.rowId, 10);
  if (Number.isNaN(rowId)) return res.status(400).json({ error: 'Invalid id' });
  const owner = await assertOwnsSubjectRow(rowId, teacherId);
  if (owner.error) return res.status(owner.status).json({ error: owner.error });
  try {
    await prisma.reportSubject.delete({ where: { id: rowId } });
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting subject row:', error);
    res.status(500).json({ error: 'Failed to delete subject row' });
  }
});

module.exports = router;
