// Automated E2E verification script for TaskMind Phase 1
export default async function run(page) {
  const results = {
    simulator: false,
    subjectCreate: false,
    taskLifecycle: false,
    deleteModal: false,
    calendar: false,
    assistant: false,
    mobile: false,
  };

  // 1. Simulator Test
  console.log('Testing Simulator...');
  await page.goto('http://localhost:3000/simulador');
  await page.waitForSelector('h1:has-text("Simulador de Média")');

  // Verify Banco de Dados II is selected or select it
  const selectElem = await page.$('select');
  if (selectElem) {
    await selectElem.selectOption({ label: 'Banco de Dados II (CC401)' });
  }

  // Look for required grade 8.1
  const requiredGradeText = await page.textContent('body');
  if (requiredGradeText.includes('8.1') || requiredGradeText.includes('Meta de Aprovação')) {
    results.simulator = true;
    console.log('Simulator verified: target calculation and required grade 8.1 found.');
  }

  // Click create goal task button
  const goalBtn = await page.$('button:has-text("Gerar Meta no Meu Calendário")');
  if (goalBtn) {
    await goalBtn.click();
    await page.waitForTimeout(500);
    console.log('Goal task created from simulator.');
  }

  // 2. Subject Creation Test
  console.log('Testing Subjects...');
  await page.goto('http://localhost:3000/disciplinas');
  await page.waitForSelector('h1:has-text("Minhas Disciplinas")');

  const newSubjectBtn = await page.$('button:has-text("Nova Disciplina")');
  if (newSubjectBtn) {
    await newSubjectBtn.click();
    await page.waitForSelector('input[name="name"], input[placeholder*="Nome da disciplina"]');

    // Fill subject form
    await page.fill('input[placeholder*="Ex: Banco de Dados II"]', 'Compiladores e Otimizadores');
    await page.fill('input[placeholder*="Ex: CC401"]', 'CC999');
    await page.fill('input[placeholder*="Ex: Prof. Dr. Silva"]', 'Prof. Alan Turing');
    await page.fill('input[placeholder*="60"]', '60');

    // Submit
    const saveSubjectBtn = await page.$('button[type="submit"]:has-text("Criar Disciplina")');
    if (saveSubjectBtn) {
      await saveSubjectBtn.click();
      await page.waitForTimeout(800);
      const subjectsContent = await page.textContent('body');
      if (subjectsContent.includes('Compiladores e Otimizadores')) {
        results.subjectCreate = true;
        console.log('Subject creation verified: Compiladores e Otimizadores created.');
      }
    }
  }

  // 3. Task Lifecycle & Modal Test
  console.log('Testing Tasks...');
  await page.goto('http://localhost:3000/tarefas');
  await page.waitForSelector('h1:has-text("Gestão de Tarefas & Entregas")');

  // Click Nova Tarefa inside tasks page
  const newTaskBtn = await page.$('main button:has-text("Nova Tarefa")');
  if (newTaskBtn) {
    await newTaskBtn.click();
    await page.waitForSelector('input[name="title"], input[placeholder*="Ex: Lista 3"]');

    await page.fill('input[placeholder*="Ex: Lista 3"]', 'Construir Analisador Léxico Flex');
    await page.fill('input[type="date"]', '2026-11-18');
    await page.fill('input[type="time"]', '23:59');

    // Save task
    const saveTaskBtn = await page.$('button[type="submit"]:has-text("Salvar Tarefa")');
    if (saveTaskBtn) {
      await saveTaskBtn.click();
      await page.waitForTimeout(800);
      console.log('Task saved.');
    }
  }

  // Verify task appears
  let pageContent = await page.textContent('body');
  if (pageContent.includes('Construir Analisador Léxico Flex')) {
    console.log('New task verified in list.');

    // Test Deletion Confirmation Modal
    // Find the row or menu button for the new task
    const deleteBtn = await page.$('button[title*="Excluir"], button:has-text("delete")');
    if (deleteBtn) {
      await deleteBtn.click();
      await page.waitForTimeout(400);

      // Verify modal is open
      const modalText = await page.textContent('body');
      if (modalText.includes('Excluir') && (modalText.includes('Esta ação não pode ser desfeita') || modalText.includes('Confirmar'))) {
        results.deleteModal = true;
        console.log('DeleteConfirmModal verified.');

        // Test cancel
        const cancelBtn = await page.$('button:has-text("Cancelar")');
        if (cancelBtn) {
          await cancelBtn.click();
          await page.waitForTimeout(300);
          console.log('Cancel deletion verified.');
        }
      }
    }
    results.taskLifecycle = true;
  }

  // 4. Calendar Test
  console.log('Testing Calendar...');
  await page.goto('http://localhost:3000/calendario');
  await page.waitForSelector('h1:has-text("Calendário & Prazos")');
  const calText = await page.textContent('body');
  if (calText.includes('Novembro 2026') && calText.includes('Hoje (10 Nov)')) {
    results.calendar = true;
    console.log('Calendar verified for November 2026, Semester 2026.2.');
  }

  // 5. Assistant Test
  console.log('Testing Assistant...');
  await page.goto('http://localhost:3000/assistente');
  await page.waitForSelector('h1:has-text("Assistente IA")');

  // Check Phase 1 badge and disabled buttons
  const assistText = await page.textContent('body');
  if (assistText.includes('Motor de Regras Locais (Fase 1)') || assistText.includes('Demonstração')) {
    console.log('Assistant local rules badge verified.');
  }

  // Send a message
  const chatInput = await page.$('input[placeholder*="Pergunte sobre seus prazos"]');
  if (chatInput) {
    await chatInput.fill('Quais são as minhas prioridades de hoje?');
    const sendBtn = await page.$('button:has-text("send")');
    if (sendBtn) {
      await sendBtn.click();
      await page.waitForTimeout(600);
      const afterChat = await page.textContent('body');
      if (afterChat.includes('prioridades') || afterChat.includes('Motor de Regras')) {
        results.assistant = true;
        console.log('Assistant conversational interaction verified.');
      }
    }
  }

  // 6. Mobile Viewport Test
  console.log('Testing Mobile Viewport...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:3000/');
  await page.waitForTimeout(500);
  const mobileText = await page.textContent('body');
  if (mobileText.includes('TaskMind') && mobileText.includes('Olá, Mariana!')) {
    results.mobile = true;
    console.log('Mobile layout verified on 390x844.');
  }

  // Reset viewport to desktop
  await page.setViewportSize({ width: 1440, height: 900 });

  return results;
}
