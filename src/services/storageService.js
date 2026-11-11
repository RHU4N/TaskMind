/**
 * @file storageService.js
 * Centralized service for localStorage persistence in TaskMind (Phase 1 prototype).
 * Reference Academic Date: 10 de Novembro de 2026 (Semestre Vigente: 2026.2).
 * Clearly distinguishes demonstration data (`isDemo: true`) from real user-created items.
 */

const STORAGE_KEYS = {
  TASKS: 'taskmind_v2_tasks',
  SUBJECTS: 'taskmind_v2_subjects',
  SETTINGS: 'taskmind_v2_settings',
  CHAT_MESSAGES: 'taskmind_v2_chat_messages',
  AI_ACTION_PLAN: 'taskmind_v2_ai_action_plan',
};

// Initial Subjects matching Google Stitch design (Semestre 2026.2)
export const INITIAL_SUBJECTS = [
  {
    id: 'subj-1',
    code: 'CC320',
    name: 'Banco de Dados II',
    professor: 'Prof. Carlos Eduardo (DComp)',
    credits: 4,
    workload: 60,
    room: 'Lab 04 Bloco B',
    color: '#3B82F6', // Blue
    category: 'Exatas & Comp',
    totalClasses: 30,
    attendances: 28,
    absences: 2,
    maxAbsences: 15,
    currentGrade: 8.2,
    isDemo: true,
    assessments: [
      { id: 'ass-1', name: 'TP1: Modelagem Normalizada', weight: 0.25, grade: 8.8, status: 'completed' },
      { id: 'ass-2', name: 'Exercícios Contínuos', weight: 0.15, grade: 9.5, status: 'completed' },
      { id: 'ass-3', name: 'P1: Modelo Relacional & SQL', weight: 0.40, grade: null, date: '2026-11-13', status: 'pending' },
      { id: 'ass-4', name: 'P2: Otimização & NoSQL', weight: 0.20, grade: null, status: 'upcoming' },
    ],
    syllabus: [
      'Álgebra Relacional',
      'Subqueries & Joins Avançados',
      'Índices B+ e Árvores Hash',
      'Transações ACID e Concorrência',
    ],
    aiInsight: 'A prova P1 vale 40% da nota final. Recomendado revisar o módulo de Índices B+ e Otimização antes de 13/11.',
  },
  {
    id: 'subj-2',
    code: 'CC510',
    name: 'Inteligência Artificial',
    professor: 'Prof. Marcos Vinicius',
    credits: 4,
    workload: 60,
    room: 'Auditório Computação',
    color: '#7C3AED', // Violet
    category: 'Exatas & Comp',
    totalClasses: 30,
    attendances: 29,
    absences: 1,
    maxAbsences: 15,
    currentGrade: 9.0,
    isDemo: true,
    assessments: [
      { id: 'ass-5', name: 'Lista de Exercícios 1 & 2', weight: 0.25, grade: 9.8, status: 'completed' },
      { id: 'ass-6', name: 'Projeto: Algoritmo A* em Rust', weight: 0.40, grade: 9.2, status: 'completed' },
      { id: 'ass-7', name: 'P1: Busca Heurística & Agentes', weight: 0.35, grade: null, date: '2026-11-25', status: 'upcoming' },
    ],
    syllabus: [
      'Agentes Inteligentes',
      'Busca Não-Informada e A*',
      'Algoritmos Genéticos',
      'Redes Neurais & LLMs',
    ],
    aiInsight: 'Prontidão de conteúdo avaliada em 78%. Seu código do algoritmo A* recebeu pontuação máxima de complexidade assintótica.',
  },
  {
    id: 'subj-3',
    code: 'CC440',
    name: 'Sistemas Distribuídos',
    professor: 'Profª. Dra. Helena Siqueira',
    credits: 4,
    workload: 60,
    room: 'Lab 02 Redes',
    color: '#F59E0B', // Amber
    category: 'Exatas & Comp',
    totalClasses: 30,
    attendances: 26,
    absences: 4,
    maxAbsences: 15,
    currentGrade: 7.8,
    isDemo: true,
    assessments: [
      { id: 'ass-8', name: 'Lab Sockets & gRPC', weight: 0.35, grade: 7.5, status: 'completed' },
      { id: 'ass-9', name: 'Relatório Cluster Raft', weight: 0.35, grade: null, date: '2026-11-12', status: 'pending' },
      { id: 'ass-10', name: 'P1: Consenso & Tolerância a Falhas', weight: 0.30, grade: null, date: '2026-11-27', status: 'upcoming' },
    ],
    syllabus: [
      'Modelos de Comunicação RPC/gRPC',
      'Consenso Distribuído (Paxos e Raft)',
      'Relógios Lógicos de Lamport',
      'Sistemas de Arquivos Distribuídos',
    ],
    aiInsight: 'Margem de faltas reduzida (restam 11). Evite faltar às quintas-feiras de laboratório para não comprometer presença mínima.',
  },
  {
    id: 'subj-4',
    code: 'ES301',
    name: 'Engenharia de Software II',
    professor: 'Prof. Roberto Mendes',
    credits: 4,
    workload: 60,
    room: 'Sala 304',
    color: '#10B981', // Emerald
    category: 'Exatas & Comp',
    totalClasses: 30,
    attendances: 30,
    absences: 0,
    maxAbsences: 15,
    currentGrade: 9.4,
    isDemo: true,
    assessments: [
      { id: 'ass-11', name: 'Sprint 1 (Scrum & Req)', weight: 0.20, grade: 9.5, status: 'completed' },
      { id: 'ass-12', name: 'Sprint 2 (Hexagonal & CI/CD)', weight: 0.25, grade: 9.8, status: 'completed' },
      { id: 'ass-13', name: 'Sprint 3 (Testes & QA)', weight: 0.25, grade: 9.0, status: 'completed' },
      { id: 'ass-14', name: 'Avaliação de Arquitetura', weight: 0.30, grade: null, date: '2026-11-28', status: 'upcoming' },
    ],
    syllabus: [
      'Metodologias Ágeis',
      'Arquiteturas Limpas & DDD',
      'Test-Driven Development (TDD)',
      'DevOps & CI/CD Pipelines',
    ],
    aiInsight: 'Excelente consistência. Seu pipeline no repositório de QA cobriu 94% dos cenários de testes unitários.',
  },
  {
    id: 'subj-5',
    code: 'MAT204',
    name: 'Cálculo Numérico',
    professor: 'Prof. André Valente',
    credits: 4,
    workload: 60,
    room: 'Anfiteatro B',
    color: '#06B6D4', // Cyan
    category: 'Exatas & Comp',
    totalClasses: 30,
    attendances: 27,
    absences: 3,
    maxAbsences: 15,
    currentGrade: 8.5,
    isDemo: true,
    assessments: [
      { id: 'ass-15', name: 'Prova 1: Zeros de Funções', weight: 0.40, grade: 8.2, status: 'completed' },
      { id: 'ass-16', name: 'Lista 4: Interpolação Polinomial', weight: 0.20, grade: null, date: '2026-11-10', status: 'pending' },
      { id: 'ass-17', name: 'Prova 2: Sistemas Lineares', weight: 0.40, grade: null, date: '2026-11-26', status: 'upcoming' },
    ],
    syllabus: [
      'Métodos de Bisseção & Newton',
      'Fatoração LU & Gauss',
      'Interpolação Lagrange',
      'Integração Numérica',
    ],
    aiInsight: 'A Lista de Exercícios 4 encerra hoje às 23:59. Faltam 2 exercícios sobre polinômios interpoladores para envio.',
  },
];

// Initial Tasks matching Google Stitch design (Updated to November 10, 2026)
export const INITIAL_TASKS = [
  {
    id: 'task-1',
    title: 'Entregar Lista de Exercícios 4 - Interpolação Polinomial',
    subjectId: 'subj-5',
    subjectName: 'Cálculo Numérico',
    dueDate: '2026-11-10T23:59:00',
    priority: 'alta',
    status: 'pending',
    estimatedTime: '1h 30m',
    description: 'Resolução via método de Newton com script Python anexado.',
    isAiPrioritized: false,
    hasAiBadge: false,
    isDemo: true,
    subtasks: [
      { id: 'st-1', text: 'Calcular tabela de diferenças divididas', completed: true },
      { id: 'st-2', text: 'Plotar gráfico de convergência do erro', completed: false },
      { id: 'st-3', text: 'Gerar PDF com script Python', completed: false },
    ],
  },
  {
    id: 'task-2',
    title: 'Revisar Artigo de Redes Neurais para Seminário',
    subjectId: 'subj-2',
    subjectName: 'Inteligência Artificial',
    dueDate: '2026-11-10T16:00:00',
    priority: 'alta',
    status: 'pending',
    estimatedTime: '45m',
    description: 'Foco na seção de Transformers e Mecanismos de Atenção Flash.',
    isAiPrioritized: true,
    hasAiBadge: true,
    aiBadgeText: 'Resumo Gerado',
    isDemo: true,
    subtasks: [
      { id: 'st-4', text: 'Ler introdução e formulação matemática', completed: true },
      { id: 'st-5', text: 'Sintetizar benchmarks de inferência', completed: false },
    ],
  },
  {
    id: 'task-3',
    title: 'Enviar proposta de tema e justificativa para Orientador',
    subjectId: 'subj-4',
    subjectName: 'Engenharia de Software II',
    dueDate: '2026-11-10T18:00:00',
    priority: 'media',
    status: 'pending',
    estimatedTime: '30m',
    description: 'Prof. Dr. Ricardo Medeiros (Departamento de Informática).',
    isAiPrioritized: false,
    hasAiBadge: false,
    isDemo: true,
    subtasks: [],
  },
  {
    id: 'task-4',
    title: 'Leitura Cap. 5 - Árvores B+ e Indexação em Memória Secundária',
    subjectId: 'subj-1',
    subjectName: 'Banco de Dados II',
    dueDate: '2026-11-10T21:00:00',
    priority: 'media',
    status: 'pending',
    estimatedTime: '1h 00m',
    description: 'Preparatório para a maratona prática de programação de amanhã.',
    isAiPrioritized: false,
    hasAiBadge: false,
    isDemo: true,
    subtasks: [
      { id: 'st-6', text: 'Revisar divisão e fusão de nós B+', completed: false },
      { id: 'st-7', text: 'Simular busca de chave em 3 níveis', completed: false },
    ],
  },
  {
    id: 'task-5',
    title: 'Implementar Algoritmo de Dijkstra em Rust',
    subjectId: 'subj-2',
    subjectName: 'Inteligência Artificial',
    dueDate: '2026-11-11T23:59:00',
    priority: 'alta',
    status: 'in_progress',
    estimatedTime: '2h 15m',
    description: 'Heap binário, alocação segura de memória e benchmark com grafos esparsos.',
    isAiPrioritized: true,
    hasAiBadge: true,
    aiBadgeText: 'IA Sugestão',
    isDemo: true,
    subtasks: [
      { id: 'st-8', text: 'Definir estrutura do grafo e classes de nós', completed: true },
      { id: 'st-9', text: 'Implementar fila de prioridade com Heurística Euclidiana', completed: false },
      { id: 'st-10', text: 'Validar resultados e gerar gráficos de convergência', completed: false },
    ],
  },
  {
    id: 'task-6',
    title: 'PROVA P1: Banco de Dados II: Modelagem & SQL Avançado',
    subjectId: 'subj-1',
    subjectName: 'Banco de Dados II',
    dueDate: '2026-11-13T14:00:00',
    priority: 'urgente',
    status: 'pending',
    estimatedTime: '2h 00m',
    description: 'Sala 304 • Bloco B (Campus Central). Peso na Média: 40%.',
    isAiPrioritized: true,
    hasAiBadge: true,
    aiBadgeText: 'Prova P1',
    isDemo: true,
    subtasks: [
      { id: 'st-11', text: 'Revisar Álgebra Relacional e Formas Normais', completed: true },
      { id: 'st-12', text: 'Praticar consultas com window functions e CTE', completed: true },
      { id: 'st-13', text: 'Simular plano de execução EXPLAIN ANALYZE', completed: false },
    ],
  },
  {
    id: 'task-7',
    title: 'Relatório do Projeto: Sistema Distribuído de Microserviços',
    subjectId: 'subj-3',
    subjectName: 'Sistemas Distribuídos',
    dueDate: '2026-11-12T23:59:00',
    priority: 'alta',
    status: 'pending',
    estimatedTime: '3h 00m',
    description: 'Engenharia de Software • Entrega do repositório Git e documentação OpenAPI.',
    isAiPrioritized: true,
    hasAiBadge: true,
    aiBadgeText: 'Equipe Raft',
    isDemo: true,
    subtasks: [
      { id: 'st-14', text: 'Revisão da Arquitetura do Cluster Raft', completed: true },
      { id: 'st-15', text: 'Documentar Benchmark de Latência e Falhas', completed: true },
      { id: 'st-16', text: 'Implementar Resiliência com Circuit Breaker', completed: false },
      { id: 'st-17', text: 'Revisão Final do Artigo e Diagramas OpenAPI', completed: false },
    ],
  },
  {
    id: 'task-8',
    title: 'Relatório de Laboratório 3: Circuitos Digitais',
    subjectId: 'subj-4',
    subjectName: 'Engenharia de Software II',
    dueDate: '2026-11-05T14:00:00',
    priority: 'media',
    status: 'completed',
    estimatedTime: '1h 30m',
    description: 'Simulação de flip-flops JK e registradores de deslocamento no Logisim.',
    isAiPrioritized: false,
    hasAiBadge: false,
    isDemo: true,
    subtasks: [],
  },
  {
    id: 'task-9',
    title: 'Apresentação: Interação Humano-Computador',
    subjectId: 'subj-4',
    subjectName: 'Engenharia de Software II',
    dueDate: '2026-11-14T19:00:00',
    priority: 'media',
    status: 'pending',
    estimatedTime: '1h 00m',
    description: 'Defesa dos testes de usabilidade com protótipo em alta fidelidade no Lab de Mídia.',
    isAiPrioritized: false,
    hasAiBadge: false,
    isDemo: true,
    subtasks: [],
  },
];

// Initial Chat History matching Stitch screen 3 (Updated to November 10, 2026)
export const INITIAL_CHAT = [
  {
    id: 'msg-1',
    sender: 'user',
    authorName: 'Mariana Silva',
    timestamp: '14:28',
    content:
      'Tenho que entregar o relatório do projeto de Sistemas Distribuídos na próxima quinta-feira, mas estou perdida em como organizar o trabalho com as outras provas. Pode criar um plano de estudo e quebrar em tarefas para mim?',
  },
  {
    id: 'msg-2',
    sender: 'assistant',
    authorName: 'TaskMind AI',
    timestamp: '14:29',
    badge: 'Cross-Schedule v2 (Regras Locais)',
    content:
      'Com certeza, Mariana! Analisei seu calendário e notei que você também tem a prova de Banco de Dados na sexta-feira (13/11). Para você não se sobrecarregar nem acumular noites em claro, dividi seu relatório em 4 blocos diários de 1h30 a 2h cada, priorizando a arquitetura do Cluster Raft antes de partir para a documentação e benchmarks.',
    highlightBox: {
      title: 'Veja o plano de ação detalhado gerado ao lado! 👉',
      meta: '4 Tarefas • 6h Totais',
    },
    contextFactors: [
      { text: 'Sist. Distribuídos (Quinta 23:59)', color: 'bg-blue-500' },
      { text: 'P1 Banco de Dados (Sexta 14:00)', color: 'bg-amber-500' },
      { text: 'Ritmo Circadiano: Tarde/Noite', color: 'bg-emerald-500' },
    ],
    notice: 'Resposta gerada por regras locais de demonstração (Motor Gemini API não conectado na Fase 1).',
  },
];

// Initial Action Plan matching Stitch screen 3
export const INITIAL_ACTION_PLAN = {
  title: 'Plano de Ação: Relatório de Sistemas Distribuídos',
  description: 'Estruturado em blocos para evitar sobrecarga com a prova de Banco de Dados.',
  stats: {
    steps: 4,
    totalTime: '6h 00m',
    efficiency: '+15%',
  },
  steps: [
    {
      id: 'step-1',
      title: 'Revisão da Arquitetura do Cluster Raft',
      period: 'Etapa 1 • Terça (10/11)',
      duration: '1h 30m',
      description: 'Diagramar o mecanismo de eleição de líderes e replicação de log no Draw.io.',
      subject: 'Sistemas Distribuídos',
      priority: 'Prioridade Alta',
      completed: true,
    },
    {
      id: 'step-2',
      title: 'Documentar Benchmark de Latência e Falhas',
      period: 'Etapa 2 • Quarta (11/11)',
      duration: '1h 30m',
      description: 'Organizar tabelas de stress-test do nó zookeeper e gráficos de throughput.',
      subject: 'Sistemas Distribuídos',
      priority: 'Prioridade Alta',
      completed: true,
    },
    {
      id: 'step-3',
      title: 'Implementar Resiliência com Circuit Breaker',
      period: 'Etapa 3 • Quinta (12/11)',
      duration: '1h 45m',
      description: 'Configurar timeout adaptativo e fallback resiliente nas rotas do gateway.',
      subject: 'Sistemas Distribuídos',
      priority: 'Prioridade Média',
      completed: false,
    },
    {
      id: 'step-4',
      title: 'Revisão Final do Artigo e Diagramas OpenAPI',
      period: 'Etapa 4 • Sexta (13/11)',
      duration: '1h 15m',
      description: 'Formatação final ABNT, conferência das referências e commit no GitHub.',
      subject: 'Sistemas Distribuídos',
      priority: 'Prioridade Média',
      completed: false,
    },
  ],
};

// Initial User Profile & Settings (Current Reference Date: November 10, 2026)
export const INITIAL_SETTINGS = {
  user: {
    name: 'Mariana Silva',
    course: 'Eng. de Software',
    institution: 'UFSCar',
    semester: '2026.2', // Current semester for November 2026
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBtpY6lyXcYJa5d4GdtYugyp36tKBpmibILjqM05LXN_vj6kzucxmxyLHGPuov37c2zJZsQwY4aEcnVWAtMW0gok7UpyxXMn9o1UhjtsV_0T3PKHqgNONpnMa2qkmRNfdnInXGVfb0n3GUfXZE921YfqbvWKBN_NDDD7NC44FGW7jeQtcaL7hkOHidBJky237zD5fBftBgr4q3Hd0-aHG_juKtC_N8Diqdv16LS20o',
    ira: 8.74,
    daysRemaining: 38,
    semesterProgressPercent: 74,
  },
  simulatorDefaults: {
    passingThreshold: 7.0,
    honorsThreshold: 8.5,
  },
};

/**
 * Helper to safely read from localStorage with fallback
 */
export function loadFromStorage(key, fallback) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (err) {
    console.error(`Erro ao carregar chave ${key} do localStorage:`, err);
    return fallback;
  }
}

/**
 * Helper to safely write to localStorage
 */
export function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Erro ao salvar chave ${key} no localStorage:`, err);
  }
}

export { STORAGE_KEYS };
