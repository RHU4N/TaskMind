/**
 * @file academicCalculations.js
 * Production mathematical calculations and domain rules for TaskMind.
 * Decoupled pure functions for grade simulations, weighted averages, and attendance rates.
 */

/**
 * Calculates weighted grade simulation and required score on pending assessments.
 *
 * @param {Object} params
 * @param {Array} params.assessments - Array of assessment objects { name, weight, grade, simulatedGrade }
 * @param {number} params.targetAverage - Goal threshold (e.g. 7.0 for passing, 8.5 for distinction)
 * @returns {Object} Calculation breakdown
 */
export function calculateSimulatorGrade({ assessments, targetAverage = 7.0 }) {
  if (!assessments || assessments.length === 0) {
    return {
      hasAssessments: false,
      totalWeight: 0,
      completedWeight: 0,
      pendingWeight: 0,
      completedPoints: 0,
      projectedAverage: null,
      requiredGradeForTarget: null,
      isPossible: true,
      reason: 'Nenhuma avaliação cadastrada para esta disciplina.',
    };
  }

  let totalWeight = 0;
  let completedWeight = 0;
  let completedPoints = 0;
  let pendingWeight = 0;
  let totalSimulatedScore = 0;

  assessments.forEach((item) => {
    const w = Number(item.weight) || 0;
    const g = Number(
      item.simulatedGrade !== undefined
        ? item.simulatedGrade
        : item.grade !== null && item.grade !== undefined
        ? item.grade
        : 0
    );
    totalWeight += w;

    if (item.grade !== null && item.grade !== undefined) {
      completedWeight += w;
      completedPoints += Number(item.grade) * w;
    } else {
      pendingWeight += w;
    }

    totalSimulatedScore += g * w;
  });

  const projectedAverage = totalWeight > 0 ? totalSimulatedScore / totalWeight : 0;

  let requiredGradeForTarget = 0;
  if (pendingWeight > 0) {
    requiredGradeForTarget =
      (targetAverage * totalWeight - completedPoints) / pendingWeight;
  }

  const isPossible = requiredGradeForTarget <= 10.0;

  return {
    hasAssessments: true,
    totalWeight: Math.round(totalWeight * 100) / 100,
    completedWeight: Math.round(completedWeight * 100) / 100,
    pendingWeight: Math.round(pendingWeight * 100) / 100,
    completedPoints: Math.round(completedPoints * 1000) / 1000,
    projectedAverage: Math.round(projectedAverage * 10) / 10,
    requiredGradeForTarget: Math.max(0, Math.round(requiredGradeForTarget * 10) / 10),
    isPossible,
  };
}

/**
 * Calculates attendance percentage and risk threshold based on Brazilian MEC standard (75% minimum).
 *
 * @param {number} attendances - Number of attended classes/hours
 * @param {number} totalClasses - Total classes/hours held
 * @returns {Object} { percentage, isAtRisk }
 */
export function calculateAttendanceRate(attendances, totalClasses) {
  const attended = Number(attendances) || 0;
  const total = Number(totalClasses) || 0;

  if (total <= 0) {
    return { percentage: 100, isAtRisk: false };
  }

  const percentage = Math.round((attended / total) * 100);
  const isAtRisk = percentage < 75; // 75% MEC regulatory rule
  return { percentage, isAtRisk };
}

/**
 * Calculates overall attendance rate across an array of subjects.
 *
 * @param {Array} subjects
 * @returns {number} Average percentage rounded to one decimal place
 */
export function calculateOverallAttendance(subjects) {
  if (!subjects || subjects.length === 0) return 100;

  let totalAttended = 0;
  let totalHeld = 0;

  subjects.forEach((subj) => {
    const pres = Number(subj.attendances) || 0;
    const abs = Number(subj.absences) || 0;
    totalAttended += pres;
    totalHeld += pres + abs;
  });

  if (totalHeld <= 0) return 100;
  return Math.round((totalAttended / totalHeld) * 1000) / 10;
}

/**
 * Calculates student IRA (Índice de Rendimento Acadêmico) weighted by subject credits.
 *
 * @param {Array} subjects
 * @returns {string} Formatted IRA to 2 decimal places
 */
export function calculateIra(subjects) {
  if (!subjects || subjects.length === 0) return '0.00';

  let totalWeightedScore = 0;
  let totalCredits = 0;

  subjects.forEach((subj) => {
    if (
      subj.currentGrade !== null &&
      subj.currentGrade !== undefined &&
      subj.currentGrade !== '' &&
      !isNaN(Number(subj.currentGrade))
    ) {
      const cred = Number(subj.credits) || 4;
      const grade = Number(subj.currentGrade);
      totalWeightedScore += grade * cred;
      totalCredits += cred;
    }
  });

  if (totalCredits <= 0) return '0.00';
  return (totalWeightedScore / totalCredits).toFixed(2);
}
