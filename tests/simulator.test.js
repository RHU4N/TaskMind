import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Import actual production functions directly from production modules
import {
  calculateSimulatorGrade,
  calculateAttendanceRate,
  calculateOverallAttendance,
  calculateIra,
} from '../src/utils/academicCalculations.js';

import {
  extractTaskTitle,
  matchSubjectInText,
  processAgentMessage,
} from '../src/services/agentService.js';

import {
  validateProposalExecution,
  prepareTaskFromProposal,
  markProposalExecuted,
  SUPPORTED_AGENT_TOOLS,
} from '../src/services/agentExecutionService.js';

describe('TaskMind Production Mathematical & Domain Logic Tests', () => {
  describe('Grade & Approval Simulator Production Formulas', () => {
    test('Calculates Banco de Dados II scenario accurately', () => {
      // Completed: TP1 (0.25 weight, grade 8.8) + Exercícios (0.15 weight, grade 9.5)
      // Pending: Prova P1 (0.35 weight) + Projeto Final (0.25 weight)
      // Total weight: 1.00
      const assessments = [
        { name: 'TP1 - Modelagem Relacional', weight: 0.25, grade: 8.8, simulatedGrade: 8.8 },
        { name: 'Exercícios Práticos SQL', weight: 0.15, grade: 9.5, simulatedGrade: 9.5 },
        { name: 'Prova P1 Teórica', weight: 0.35, grade: null, simulatedGrade: 8.0 },
        { name: 'Projeto Final de Banco', weight: 0.25, grade: null, simulatedGrade: 8.5 },
      ];

      const result = calculateSimulatorGrade({ assessments, targetAverage: 8.5 });

      assert.equal(result.hasAssessments, true);
      assert.equal(result.totalWeight, 1.0);
      assert.equal(result.completedWeight, 0.4);
      assert.equal(result.pendingWeight, 0.6);
      assert.equal(result.completedPoints, 3.625);

      // Required grade: (8.5 * 1.0 - 3.625) / 0.6 = 4.875 / 0.6 = 8.125 -> rounds to 8.1
      assert.equal(result.requiredGradeForTarget, 8.1);
      assert.equal(result.isPossible, true);

      // Projected average with simulated grades 8.0 and 8.5:
      // 3.625 + (0.35 * 8.0 = 2.8) + (0.25 * 8.5 = 2.125) = 8.55 / 1.0 -> 8.6
      assert.equal(result.projectedAverage, 8.6);
    });

    test('Identifies impossible target grade without crashing', () => {
      const assessments = [
        { name: 'P1', weight: 0.5, grade: 2.0, simulatedGrade: 2.0 },
        { name: 'P2', weight: 0.5, grade: null, simulatedGrade: 5.0 },
      ];

      // To reach 9.0 target: (9.0 * 1.0 - 1.0) / 0.5 = 16.0 > 10.0 -> isPossible should be false
      const result = calculateSimulatorGrade({ assessments, targetAverage: 9.0 });
      assert.equal(result.isPossible, false);
      assert.equal(result.requiredGradeForTarget, 16.0);
    });

    test('Handles already passed student with 0 required grade', () => {
      const assessments = [
        { name: 'P1', weight: 0.6, grade: 10.0, simulatedGrade: 10.0 },
        { name: 'P2', weight: 0.4, grade: null, simulatedGrade: 0.0 },
      ];

      // Points earned: 6.0. Target: 5.0. Required: (5.0 - 6.0) / 0.4 = -2.5 -> clamped to 0
      const result = calculateSimulatorGrade({ assessments, targetAverage: 5.0 });
      assert.equal(result.requiredGradeForTarget, 0);
      assert.equal(result.isPossible, true);
    });

    test('Prevents fabricated results when subject has no assessments (empty state)', () => {
      const result = calculateSimulatorGrade({ assessments: [], targetAverage: 7.0 });
      assert.equal(result.hasAssessments, false);
      assert.equal(result.projectedAverage, null);
      assert.equal(result.requiredGradeForTarget, null);
      assert.equal(result.totalWeight, 0);
      assert.ok(result.reason.includes('Nenhuma avaliação cadastrada'));
    });
  });

  describe('Attendance Rules and Grade Integrity (MEC 75% & IRA)', () => {
    test('Calculates passing attendance above 75%', () => {
      const { percentage, isAtRisk } = calculateAttendanceRate(42, 48);
      assert.equal(percentage, 88);
      assert.equal(isAtRisk, false);
    });

    test('Identifies attendance at risk below 75%', () => {
      const { percentage, isAtRisk } = calculateAttendanceRate(32, 48);
      assert.equal(percentage, 67);
      assert.equal(isAtRisk, true);
    });

    test('Edge case exactly at 75% is not at risk', () => {
      const { percentage, isAtRisk } = calculateAttendanceRate(36, 48);
      assert.equal(percentage, 75);
      assert.equal(isAtRisk, false);
    });

    test('Calculates overall attendance and IRA across multiple subjects', () => {
      const subjects = [
        { attendances: 28, absences: 2, credits: 4, currentGrade: 8.2 },
        { attendances: 29, absences: 1, credits: 4, currentGrade: 9.0 },
        { attendances: 26, absences: 4, credits: 4, currentGrade: 7.8 },
      ];

      const rate = calculateOverallAttendance(subjects);
      // Total attended: 83, Total held: 90 -> 83 / 90 = 92.2%
      assert.equal(rate, 92.2);

      const ira = calculateIra(subjects);
      // (8.2*4 + 9.0*4 + 7.8*4) / 12 = 100 / 12 = 8.33
      assert.equal(ira, '8.33');
    });

    test('Preserves legitimate grade zero and excludes null grades in IRA', () => {
      const subjectsWithZero = [
        { credits: 4, currentGrade: 0.0 }, // legitimate grade zero
        { credits: 4, currentGrade: 10.0 },
        { credits: 4, currentGrade: null }, // no grade information yet
      ];

      // Only first two count: (0.0*4 + 10.0*4) / 8 = 40 / 8 = 5.00
      const ira = calculateIra(subjectsWithZero);
      assert.equal(ira, '5.00');
    });
  });

  describe('Agent Task Extraction and Validation (Issue 1)', () => {
    test('Extracts custom title from user prompt without hardcoding TCC', () => {
      const prompt1 = 'Criar tarefa: Implementar Árvores B+ em Rust';
      const extracted1 = extractTaskTitle(prompt1);
      assert.equal(extracted1, 'Implementar Árvores B+ em Rust');

      const prompt2 = 'adicionar tarefa de Estudo para Prova de Redes';
      const extracted2 = extractTaskTitle(prompt2);
      assert.equal(extracted2, 'Estudo para Prova de Redes');

      const prompt3 = 'checklist da Entrega de Banco de Dados';
      const extracted3 = extractTaskTitle(prompt3);
      assert.equal(extracted3, 'Entrega de Banco de Dados');
    });

    test('Requests missing title when user prompt lacks task name', async () => {
      const prompt = 'Quero criar uma tarefa';
      const response = await processAgentMessage(prompt, {
        tasks: [],
        subjects: [{ id: 's1', name: 'Banco de Dados II' }],
      });

      assert.equal(response.toolProposal, null);
      assert.ok(response.content.toLowerCase().includes('título não foi identificado'));
      assert.ok(response.content.toLowerCase().includes('informe o nome da tarefa'));
    });

    test('Associates matched subject without inventing deadlines or attachments', async () => {
      const prompt = 'Criar tarefa: Revisar Normalização em Banco de Dados II';
      const subjects = [
        { id: 'subj-1', name: 'Banco de Dados II', code: 'CC320' },
        { id: 'subj-2', name: 'Inteligência Artificial', code: 'CC510' },
      ];

      const response = await processAgentMessage(prompt, { tasks: [], subjects });

      assert.notEqual(response.toolProposal, null);
      assert.equal(response.toolProposal.name, 'createTask');
      assert.equal(response.toolProposal.params.title, 'Revisar Normalização em Banco de Dados II');
      assert.equal(response.toolProposal.params.subjectName, 'Banco de Dados II');
      // Must not fabricate a fake deadline
      assert.equal(response.toolProposal.params.dueDate, null);
      // Must not fabricate attachments
      assert.deepEqual(response.contextFactors, [{ text: 'Disciplina: Banco de Dados II', color: 'bg-primary' }]);
    });
  });

  describe('Real Production Execution Guards & Validation (Issue 2)', () => {
    test('Validates eligible proposed action on first execution', () => {
      const proposal = {
        id: 'prop-valid-1',
        name: 'createTask',
        executed: false,
        params: {
          title: 'Estudar Autômatos Finitos',
          subjectId: 'subj-1',
          subjectName: 'Teoria da Computação',
        },
      };

      const result = validateProposalExecution({ proposal, existingTasks: [] });
      assert.equal(result.valid, true);
    });

    test('Production guard rejects repeated execution (double confirmation prevention)', () => {
      const proposal = {
        id: 'prop-executed-1',
        name: 'createTask',
        executed: false,
        params: {
          title: 'Implementar Algoritmo Kruskal',
          subjectId: 'subj-1',
          subjectName: 'Grafos',
        },
      };

      // Mark executed using production helper
      markProposalExecuted(proposal);
      assert.equal(proposal.executed, true);
      assert.ok(proposal.executedAt);

      // Actual production guard check must reject
      const result = validateProposalExecution({ proposal, existingTasks: [] });
      assert.equal(result.valid, false);
      assert.equal(result.error, 'Esta ação já foi executada anteriormente.');
    });

    test('Production guard rejects unsupported tool actions safely', () => {
      const unsupportedProposal = {
        id: 'prop-unsupported',
        name: 'deleteDatabaseEntirely',
        executed: false,
        params: {},
      };

      const result = validateProposalExecution({ proposal: unsupportedProposal });
      assert.equal(result.valid, false);
      assert.equal(result.unsupported, true);
      assert.ok(result.error.includes('não suportada na Fase 1'));
    });

    test('Production guard prevents duplicate task creation within time window', () => {
      const recentTask = {
        id: 'task-1',
        title: 'Trabalho de Engenharia de Software',
        createdAt: new Date().toISOString(),
      };

      const duplicateProposal = {
        id: 'prop-dup',
        name: 'createTask',
        executed: false,
        params: {
          title: 'Trabalho de Engenharia de Software',
        },
      };

      const result = validateProposalExecution({
        proposal: duplicateProposal,
        existingTasks: [recentTask],
        duplicateThresholdMs: 30000,
      });

      assert.equal(result.valid, false);
      assert.equal(result.isDuplicate, true);
      assert.equal(result.error, 'Tarefa duplicada evitada.');
    });

    test('Production guard enforces title requirement for createTask', () => {
      const proposalWithoutTitle = {
        id: 'prop-no-title',
        name: 'createTask',
        executed: false,
        params: {
          title: '   ',
        },
      };

      const result = validateProposalExecution({ proposal: proposalWithoutTitle });
      assert.equal(result.valid, false);
      assert.equal(result.error, 'Título da tarefa não fornecido.');
    });

    test('prepareTaskFromProposal preserves null dueDate when omitted', () => {
      const proposalWithoutDeadline = {
        id: 'prop-no-deadline',
        name: 'createTask',
        params: {
          title: 'Revisar Artigo Científico',
          subjectId: 'subj-1',
          subjectName: 'Metodologia',
          dueDate: null, // explicit or omitted
        },
      };

      const prepared = prepareTaskFromProposal(proposalWithoutDeadline);
      assert.equal(prepared.title, 'Revisar Artigo Científico');
      assert.equal(prepared.dueDate, null);
      assert.equal(prepared.isAiPrioritized, true);
    });
  });
});
