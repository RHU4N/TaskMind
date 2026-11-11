# TaskMind — Academic Intelligence (Fase 1)

> Protótipo funcional de inteligência e produtividade acadêmica universitária, concebido a partir do design system do Google Stitch.

---

## 1. Descrição do Projeto

O **TaskMind** é uma aplicação web voltada para a gestão integrada de rotinas universitárias. O sistema consolida, em uma interface única e responsiva, o acompanhamento de entregas acadêmicas, disciplinas matriculadas, cálculo em tempo real de frequência e IRA (Índice de Rendimento Acadêmico), simulação preditiva de notas para aprovação e um assistente conversacional preparado para fluxos de agente inteligente.

Este repositório compreende a **Fase 1** (de um projeto acadêmico de três etapas), com foco na estruturação do frontend, arquitetura de componentes reutilizáveis, gerenciamento de estado centralizado, fórmulas matemáticas de domínio e interfaces para futura orquestração de IA.

---

## 2. O Problema

Estudantes do ensino superior enfrentam sobrecarga cognitiva decorrente da fragmentação de informações acadêmicas:
- Prazos dispersos entre múltiplos portais (SIGAA, Moodle, Classroom e calendários pessoais).
- Ausência de visibilidade preditiva de notas, dificultando saber qual pontuação exata é necessária nas provas finais para atingir a média de aprovação ou critérios de bolsas e intercâmbio.
- Dificuldade no controle preventivo de faltas para evitar reprovação pelo limite regulatório institucional (75% de presença mínima exigida pelo MEC).
- Inexistência de um fluxo estruturado que auxilie na decomposição de trabalhos complexos (seminários, projetos práticos e TCC) em microetapas acionáveis.

---

## 3. Objetivos

### Objetivo Geral
Desenvolver um protótipo navegável, determinístico e de alta fidelidade visual para suporte à produtividade acadêmica, preparando os contratos de interface e validação humana necessários para a integração de agentes autônomos baseados em LLM na Fase 2.

### Objetivos Específicos da Fase 1
1. Implementar as 6 telas centrais projetadas no Google Stitch em conformidade com as diretrizes de design (`DESIGN.md`).
2. Centralizar o gerenciamento de dados de tarefas, disciplinas, notas e histórico de chat via Context API e persistência em `localStorage`.
3. Desenvolver o **Simulador de Média & Aprovação**, baseado na fórmula de média ponderada oficial, com proteção contra dados vazios ou fabricados.
4. Estruturar o módulo `agentService.js` com extração dinâmica de títulos a partir da linguagem natural do usuário, sem criar dados fictícios e exigindo confirmação humana (*Human-in-the-Loop*) para execução de ferramentas.
5. Garantir a integridade da suíte de testes automatizados com funções puras de produção desacopladas em `academicCalculations.js`.

---

## 4. Stack Tecnológica

- **Linguagem:** JavaScript (ES6+), JSX puro (sem uso de TypeScript no código-fonte da aplicação).
- **Biblioteca de Interface:** React 19 (Functional Components, Hooks e Context API).
- **Roteamento SPA:** React Router (`react-router-dom` v7).
- **Estilização e Design System:** Tailwind CSS v4, Google Material Symbols Outlined e tipografia institucional (*Plus Jakarta Sans* e *Inter*).
- **Build & Dev Server:** Vite 8 com `@vitejs/plugin-react` e `@tailwindcss/vite`.
- **Testes Automatizados:** Test runner nativo do Node.js (`node:test` e `node:assert/strict`).
- **Persistência Temporária:** Browser `localStorage` (chaves isoladas `taskmind_v2_*`).

---

## 5. Arquitetura da Aplicação

A arquitetura do projeto segue separação de responsabilidades em camadas desacopladas:

```
/
├── src/
│   ├── components/         # Componentes modulares e reutilizáveis
│   │   ├── layout/         # Header global, Sidebar de navegação e rodapés
│   │   └── tasks/          # Modais de criação/edição e confirmação de exclusão
│   ├── context/            # Contexto centralizado (AcademicContext.jsx)
│   ├── pages/              # As 6 telas da aplicação
│   │   ├── DashboardPage.jsx   # Tela 1: Visão Geral e Indicadores do Semestre
│   │   ├── TasksPage.jsx       # Tela 2: Gestão de Tarefas (Tabela, Kanban, Lista)
│   │   ├── AssistantPage.jsx   # Tela 3: Assistente Acadêmico IA
│   │   ├── CalendarPage.jsx    # Tela 4: Calendário & Grade Mensal de Prazos
│   │   ├── SubjectsPage.jsx    # Tela 5: Disciplinas, Ementas e Frequência
│   │   └── SimulatorPage.jsx   # Tela 6: Simulador de Média e Aprovação
│   ├── services/           # Serviços de dados e agentes
│   │   ├── agentService.js     # Contratos de ferramentas e motor de regras locais
│   │   └── storageService.js   # Sementes e adaptadores de localStorage
│   ├── utils/              # Módulos puros de cálculo matemático
│   │   └── academicCalculations.js # Médias ponderadas, corte e frequência
│   ├── App.jsx             # Definição de rotas da aplicação
│   ├── index.css           # Tokens de design do Google Stitch e Tailwind CSS
│   └── main.jsx            # Ponto de entrada do React DOM
├── tests/
│   └── simulator.test.js   # Suíte de testes unitários automatizados
├── package.json            # Scripts de build, dev e test
└── vite.config.js          # Configuração do Vite em JavaScript puro
```

---

## 6. Etapas do Trabalho Acadêmico (Cronograma da Disciplina)

O desenvolvimento deste trabalho acadêmico está estruturado em três marcos avaliativos com datas formais de entrega:

- **Parte 1 (10 de novembro de 2026):** Definição do projeto, planejamento e desenvolvimento inicial. Compreende a concepção do escopo, estruturação da arquitetura em React/JavaScript, portabilidade fiel das 6 telas desenhadas no Google Stitch, criação do modelo de dados em memória e `localStorage`, definição das regras matemáticas de frequência/notas e implementação da base do assistente com contratos de ferramentas e verificação humana.
- **Parte 2 (17 de novembro de 2026):** Acompanhamento, conclusão e documentação. Foco na auditoria de dados, monitoramento das métricas em tempo real, prevenção de ações duplicadas, resolução de pendências de prazos e notas, estabilização de bugs e consolidação de toda a documentação técnica e testes automatizados.
- **Parte 3 (24 de novembro de 2026):** Apresentação final do projeto acadêmico. Demonstração funcional das telas, validação de usabilidade, explicação das decisões arquiteturais e defesa do protótipo perante a banca avaliadora.

---

## 7. Instruções de Instalação e Execução

### Pré-requisitos
- Node.js versão 20 ou superior.
- NPM versão 9 ou superior.

### Instalação de Dependências
```bash
npm install
```

### Execução em Modo de Desenvolvimento
```bash
npm run dev
```
O servidor de desenvolvimento será iniciado na porta 3000: `http://localhost:3000`.

### Execução da Suíte de Testes Automatizados
```bash
npm test
```
Executa a suíte de testes de regras de domínio, matemática do simulador e validações de duplo clique de propostas.

### Build de Produção
```bash
npm run build
```

---

## 8. Funcionalidades Concluídas na Fase 1

1. **Dashboard Acadêmico:**
   - Métricas em tempo real calculadas a partir do estado: tarefas ativas, concluídas, atrasadas e horas focadas.
   - Grade horizontal de prioridades da semana corrente com identificação da Prova P1.
2. **Gestão Completa de Tarefas (CRUD):**
   - Criação, leitura, atualização e remoção de tarefas com modal de confirmação obrigatória (`DeleteConfirmModal`).
   - Filtros dinâmicos por disciplina, prioridade, status e busca de texto.
   - Alternância entre visões Tabela, Kanban e Lista.
3. **Controle de Disciplinas e Frequência:**
   - Gestão de matérias matriculadas, docentes e salas de aula.
   - Cálculo estrito da taxa de frequência (aulas assistidas / total) com destaque de zona de risco (< 75% MEC).
4. **Simulador de Média e Aprovação:**
   - Cálculo dinâmico da média ponderada: $\text{Média} = \frac{\sum (\text{Nota}_i \times \text{Peso}_i)}{\sum \text{Peso}_i}$.
   - Nota mínima necessária nas avaliações restantes: $\text{Nota Restante} = \frac{\text{Meta} \times \sum \text{Peso} - \text{Pontos Obtidos}}{\text{Peso Pendente}}$.
   - Estado vazio (*empty state*) sem dados fictícios quando a disciplina não possui avaliações.
   - Botão para converter metas acadêmicas em tarefas diretamente no calendário.
5. **Calendário Acadêmico:**
   - Visualização mensal com navegação e destaque para provas e entregas.
   - Botão **Hoje** que navega dinamicamente para a data real atual do sistema.
   - Botão de atalho para retorno ao período letivo de demonstração (Novembro de 2026).
6. **Assistente Acadêmico (Motor de Regras Locais):**
   - Extração do título da tarefa a partir da mensagem do discente sem impor propostas genéricas.
   - Solicitação de informações faltantes caso o discente não informe o nome da tarefa.
   - Proteção de confirmação humana: uma proposta executada é marcada como concluída e seu botão de confirmação é desativado, prevenindo criação acidental de tarefas duplicadas.
   - Sinalização transparente de execução via regras determinísticas locais.

---

## 9. Limitações Conhecidas da Fase 1

- **Processamento de Linguagem Natural Heurístico:** O assistente utiliza classificação local baseada em padrões de texto e regras determinísticas. Não consome tokens de LLM nem realiza inferência generativa nesta fase.
- **Botões Multimodais Desabilitados:** O botão de captura por voz (microfone) e upload de arquivos (anexo de PDF) estão desativados com aviso informativo, uma vez que o pipeline multimodal requer o backend da Fase 2.
- **Sincronizações Institucionais Simuladas:** As conexões exibidas na interface para SIGAA, Moodle e Reserva de Salas na Biblioteca são componentes demonstrativos sem integração de rede ativa.
- **Dados Demonstrativos Fictícios:** O conjunto semente de dados acadêmicos (estudante Mariana Silva, disciplinas CC320, CC510, CC440, ES301, MAT204 e tarefas associadas) é estritamente fictício, servindo para demonstrar a reatividade das telas.

---

## 10. Roadmap de Evolução do Produto de Software (Pós-Fase 1)

As funcionalidades futuras do produto de software estão planejadas para versões posteriores e são mantidas formalmente separadas das entregas do cronograma da disciplina acadêmica:

1. **Proxy Seguro no Backend (Node.js):** Configurar endpoints REST intermediários em Node.js (`server.js`) para mediar a comunicação entre o cliente e o SDK `@google/genai` utilizando a chave injetada via `GEMINI_API_KEY`, sem expor credenciais ao navegador.
2. **Ativação de Tool Calling com o Gemini:** Conectar os esquemas formais declarados em `AGENT_TOOLS_DEFINITIONS` (`createTask`, `listTasks`, `updateTask`, `suggestStudyPlan`) às chamadas reais do modelo LLM com preservação do fluxo de aprovação humana prévia.
3. **RAG e Leitura Multimodal de PDFs:** Habilitar a extração automatizada de tópicos de provas, prazos e critérios de avaliação a partir do upload de arquivos de ementas pedagógicas.
4. **Persistência Centralizada em Nuvem:** Transição do `localStorage` para banco de dados relacional (PostgreSQL/Supabase) e introdução de autenticação discente.

---

## 11. Declaração de Integridade Acadêmica

O projeto foi construído respeitando as restrições estipuladas para a Fase 1: ausência de TypeScript em arquivos de produção, ausência de chamadas fictícias a modelos externos e rotulagem explícita de todos os dados e fluxos de demonstração.
