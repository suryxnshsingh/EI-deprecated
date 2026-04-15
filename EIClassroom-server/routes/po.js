const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authenticateToken = require('../middleware/auth');
const prisma = new PrismaClient();
const router = express.Router();
const ExcelJS = require('exceljs');

// Fetch saved PO data for a subject
router.get('/:subjectId', authenticateToken, async (req, res) => {
  const subjectId = parseInt(req.params.subjectId, 10);
  if (Number.isNaN(subjectId)) return res.status(400).json({ error: 'Invalid subjectId' });
  try {
    const po = await prisma.pO.findUnique({ where: { subjectId } });
    if (!po) return res.status(404).json({ error: 'PO not found' });
    res.json(po);
  } catch (error) {
    console.error('Error fetching PO:', error);
    res.status(500).json({ error: 'Failed to fetch PO' });
  }
});

// Export CO-PO attainment matrix as Excel file
// NOTE: must be declared BEFORE `/:subjectId` to avoid being shadowed by the param route.
router.post('/export-co-po-matrix', async (req, res) => {
  try {
    const { matrix, averageRow, headers } = req.body;

    if (!matrix || !averageRow || !headers) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    // Create a new Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('CO-PO Attainment Matrix');

    // Add headers
    const headerRow = [''].concat(headers);
    worksheet.addRow(headerRow);

    // Add data rows
    const rowLabels = ["CO1", "CO2", "CO3", "CO4", "CO5"];

    // Add the matrix data rows
    for (let i = 0; i < matrix.length; i++) {
      const rowData = [rowLabels[i]].concat(matrix[i]);
      worksheet.addRow(rowData);
    }

    // Calculate column averages (excluding null/undefined values)
    const columnAverages = [];
    for (let j = 0; j < headers.length; j++) {
      const columnValues = matrix.map(row => row[j]).filter(val => val !== null && val !== undefined && !isNaN(val));
      if (columnValues.length > 0) {
        const sum = columnValues.reduce((acc, curr) => acc + parseFloat(curr), 0);
        const avg = sum / columnValues.length;
        columnAverages.push(avg.toFixed(2));
      } else {
        columnAverages.push('-');
      }
    }

    // Add column averages row
    const columnAvgRow = ['Column Average'].concat(columnAverages);
    worksheet.addRow(columnAvgRow);

    // Style the worksheet
    worksheet.getRow(1).font = { bold: true };
    worksheet.getColumn(1).font = { bold: true };

    // Style the Column Average row
    worksheet.getRow(matrix.length + 2).font = { bold: true }; // Column Average row

    // Set column widths
    worksheet.columns.forEach(column => {
      column.width = 12;
    });
    worksheet.getColumn(1).width = 15;

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=CO_PO_Attainment_Matrix.xlsx');

    // Write the workbook to response
    await workbook.xlsx.write(res);
    res.status(200).end();
  } catch (error) {
    console.error('Error generating Excel file:', error);
    res.status(500).json({ error: 'Failed to generate Excel file' });
  }
});

// Save (upsert) PO data for a subject
router.post('/:subjectId', authenticateToken, async (req, res) => {
  const subjectId = parseInt(req.params.subjectId, 10);
  if (Number.isNaN(subjectId)) return res.status(400).json({ error: 'Invalid subjectId' });
  const { matrix1, matrix2, indirectMatrix, indirectAverage } = req.body;

  if (!Array.isArray(matrix1) || !Array.isArray(matrix2)) {
    return res.status(400).json({ error: 'matrix1 and matrix2 must be arrays' });
  }
  if (indirectMatrix !== undefined && !Array.isArray(indirectMatrix)) {
    return res.status(400).json({ error: 'indirectMatrix must be an array' });
  }
  if (indirectAverage !== undefined && !Array.isArray(indirectAverage)) {
    return res.status(400).json({ error: 'indirectAverage must be an array' });
  }

  try {
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) return res.status(404).json({ error: 'Subject not found' });

    const po = await prisma.pO.upsert({
      where: { subjectId },
      update: { matrix1, matrix2, indirectMatrix, indirectAverage },
      create: { subjectId, matrix1, matrix2, indirectMatrix, indirectAverage },
    });
    res.json(po);
  } catch (error) {
    console.error('Error saving PO:', error);
    res.status(500).json({ error: 'Failed to save PO' });
  }
});

// Fetch saved PO snapshot for a subject
router.get('/:subjectId/snapshot', authenticateToken, async (req, res) => {
  const subjectId = parseInt(req.params.subjectId, 10);
  if (Number.isNaN(subjectId)) return res.status(400).json({ error: 'Invalid subjectId' });
  try {
    const snapshot = await prisma.pOSnapshot.findUnique({ where: { subjectId } });
    if (!snapshot) return res.status(404).json({ error: 'Snapshot not found' });
    res.json(snapshot);
  } catch (error) {
    console.error('Error fetching PO snapshot:', error);
    res.status(500).json({ error: 'Failed to fetch PO snapshot' });
  }
});

// Commit (upsert) PO snapshot for a subject — freezes current overall PO into the final report table
router.post('/:subjectId/snapshot', authenticateToken, async (req, res) => {
  const subjectId = parseInt(req.params.subjectId, 10);
  if (Number.isNaN(subjectId)) return res.status(400).json({ error: 'Invalid subjectId' });
  const { directAverage, indirectAverage, overallAverage } = req.body;

  if (!Array.isArray(directAverage) || !Array.isArray(indirectAverage) || !Array.isArray(overallAverage)) {
    return res.status(400).json({ error: 'directAverage, indirectAverage, and overallAverage must be arrays' });
  }

  try {
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) return res.status(404).json({ error: 'Subject not found' });

    const snapshot = await prisma.pOSnapshot.upsert({
      where: { subjectId },
      update: { directAverage, indirectAverage, overallAverage },
      create: { subjectId, directAverage, indirectAverage, overallAverage },
    });
    res.json(snapshot);
  } catch (error) {
    console.error('Error saving PO snapshot:', error);
    res.status(500).json({ error: 'Failed to save PO snapshot' });
  }
});

module.exports = router;
