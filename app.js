// DOM Element References
const taskTitle = document.getElementById('taskTitle');
const taskDay = document.getElementById('taskDay');
const taskEffort = document.getElementById('taskEffort');
const addTask = document.getElementById('addTask');
const progressPercentage = document.getElementById('progressPercentage');
const progressFill = document.getElementById('progressFill');
const copyModal = document.getElementById('copyModal');
const copyDestination = document.getElementById('copyDestination');
const confirmCopy = document.getElementById('confirmCopy');
const copySelectedTasks = document.getElementById('copySelectedTasks');
const uncheckAllTasks = document.getElementById('uncheckAllTasks');  // New button reference

// Global Variables
let weeklyProgress = 0;

const EffortWeights = {
  low: 10,
  medium: 30,
  high: 60,
};

const dayProgress = {
  monday: 100,
  tuesday: 100,
  wednesday: 100,
  thursday: 100,
  friday: 100,
  saturday: 100,
  sunday: 100,
};

// Event Listeners
addTask.addEventListener('click', addNewTask);
taskTitle.addEventListener('keypress', handleEnterKeyPress);
copySelectedTasks.addEventListener('click', handleMultipleTaskSelection);
uncheckAllTasks.addEventListener('click', handleUncheckAllTasks);

// Functions

// Load Tasks from Local Storage
function loadTasks() {
  Object.keys(dayProgress).forEach(day => {
    const dayColumn = document.getElementById(day);
    const taskList = dayColumn.querySelector('.task-list');
    const savedTasks = JSON.parse(localStorage.getItem(day)) || [];

    savedTasks.forEach(taskData => {
      const taskItem = createTaskItem(taskData.title, taskData.day, taskData.Effort, taskData.completed, taskData.id);
      taskList.appendChild(taskItem);
    });
    updateDailyProgress(day);
  });
}

// Save Tasks to Local Storage
function saveTasks() {
  Object.keys(dayProgress).forEach(day => {
    const dayColumn = document.getElementById(day);
    const taskList = dayColumn.querySelector('.task-list');
    const tasks = Array.from(taskList.children);

    const taskData = tasks.map(task => {
      const title = task.querySelector('span').textContent;
      const Effort = Array.from(task.classList).find(cls => cls.startsWith('Effort-')).split('-')[1];
      const completed = task.classList.contains('completed');
      const id = task.dataset.id;
      return { title, day, Effort, completed, id };
    });

    localStorage.setItem(day, JSON.stringify(taskData));
  });
}

// Update Daily Progress
function updateDailyProgress(day) {
  const dayColumn = document.getElementById(day);
  const taskList = dayColumn.querySelector('.task-list');
  const tasks = Array.from(taskList.children);

  if (tasks.length === 0) {
    dayProgress[day] = 100;
    document.getElementById(`${day}-progress`).textContent = 'Progress: 100%';
    updateWeeklyProgress();
    return;
  }

  let EffortCounts = { low: 0, medium: 0, high: 0 };
  let totalWeight = 0;
  let completedWeight = 0;

  tasks.forEach(task => {
    const Effort = Array.from(task.classList).find(cls => cls.startsWith('Effort-')).split('-')[1];
    EffortCounts[Effort]++;
    if (task.classList.contains('completed')) completedWeight += EffortWeights[Effort];
  });

  const totalTasks = EffortCounts.low + EffortCounts.medium + EffortCounts.high;
  if (totalTasks > 0) {
    const lowWeight = EffortCounts.low * EffortWeights.low;
    const mediumWeight = EffortCounts.medium * EffortWeights.medium;
    const highWeight = EffortCounts.high * EffortWeights.high;
    totalWeight = lowWeight + mediumWeight + highWeight;
  }

  dayProgress[day] = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;
  document.getElementById(`${day}-progress`).textContent = `Progress: ${Math.round(dayProgress[day])}%`;
  updateWeeklyProgress();
}

// Update Weekly Progress
function updateWeeklyProgress() {
  const totalProgress = Object.keys(dayProgress).reduce((sum, day) => sum + dayProgress[day], 0);
  weeklyProgress = totalProgress / Object.keys(dayProgress).length;
  progressPercentage.textContent = `${Math.round(weeklyProgress)}% Complete`;
  progressFill.style.width = `${weeklyProgress}%`;
}

// Add New Task
function addNewTask() {
  const title = taskTitle.value.trim();
  const day = taskDay.value;
  const Effort = taskEffort.value;

  if (!title) {
    alert('Please enter a task title.');
    return;
  }

  const taskItem = createTaskItem(title, day, Effort, false);
  const dayColumn = document.getElementById(day);
  const taskList = dayColumn.querySelector('.task-list');
  taskList.appendChild(taskItem);
  taskTitle.value = '';
  updateDailyProgress(day);
  saveTasks();
}

// Create Task Item
function createTaskItem(title, day, Effort, completed, id = Date.now()) {
  const taskItem = document.createElement('li');
  taskItem.className = `task-item Effort-${Effort}`;
  if (completed) taskItem.classList.add('completed');
  taskItem.dataset.id = id;

  taskItem.innerHTML = `
    <input type="checkbox" class="select-task">
    <span>${title}</span>
    <div class="actions">
      <button class="complete" data-tooltip="Complete Task"><i class="fas fa-check"></i></button>
      <button class="delete" data-tooltip="Delete Task"><i class="fas fa-trash"></i></button>
      <button class="copy" data-tooltip="Copy Task"><i class="fas fa-copy"></i></button>
    </div>
  `;

  taskItem.querySelector('.complete').addEventListener('click', () => {
    taskItem.classList.toggle('completed');
    updateDailyProgress(day);
    saveTasks();
  });

  taskItem.querySelector('.delete').addEventListener('click', () => {
    taskItem.remove();
    updateDailyProgress(day);
    saveTasks();
  });

  taskItem.querySelector('.copy').addEventListener('click', () => openCopyModal([taskItem], day));

  return taskItem;
}


// Handle Multiple Task Selection for Copy
function handleMultipleTaskSelection() {
  const selectedTasks = [];
  const taskItems = document.querySelectorAll('.task-item');
  taskItems.forEach(taskItem => {
    const checkbox = taskItem.querySelector('.select-task');
    if (checkbox && checkbox.checked) selectedTasks.push(taskItem);
  });

  if (selectedTasks.length > 0) openCopyModal(selectedTasks);
  else alert('Please select at least one task to copy.');
}

// Open Copy Modal
function openCopyModal(tasks, day = '') {
  copyModal.classList.add('active');
  const onConfirmCopy = () => {
    const targetDay = copyDestination.value;
    copyTasksToOtherDay(tasks, targetDay);
    closeCopyModal();
    confirmCopy.removeEventListener('click', onConfirmCopy); // Remove event listener to avoid multiple attachments
  };
  confirmCopy.addEventListener('click', onConfirmCopy);
}

// Close Copy Modal
function closeCopyModal() {
  copyModal.classList.remove('active');
}

// Copy Tasks to Other Day
function copyTasksToOtherDay(tasks, targetDay) {
  const targetColumn = document.getElementById(targetDay);
  const targetList = targetColumn.querySelector('.task-list');
  tasks.forEach(task => {
    const taskClone = task.cloneNode(true);
    taskClone.querySelector('.select-task').checked = false;

    taskClone.querySelector('.copy').addEventListener('click', () => openCopyModal([taskClone]));
    targetList.appendChild(taskClone);

    taskClone.querySelector('.complete').addEventListener('click', () => {
      taskClone.classList.toggle('completed');
      const targetDay = taskClone.closest('.day-column').id;
      updateDailyProgress(targetDay);
      saveTasks();
    });

    taskClone.querySelector('.delete').addEventListener('click', () => {
      taskClone.remove();
      const targetDay = taskClone.closest('.day-column').id;
      updateDailyProgress(targetDay);
      saveTasks();
    });
  });

  saveTasks(); // Save after copying
}

// Handle Enter Key Press for Adding Tasks
function handleEnterKeyPress(e) {
  if (e.key === 'Enter') addNewTask(); // Call addNewTask function when Enter is pressed
}

// Uncheck All Tasks
function handleUncheckAllTasks() {
  const taskItems = document.querySelectorAll('.task-item');
  taskItems.forEach(taskItem => {
    const checkbox = taskItem.querySelector('.select-task');
    if (checkbox && checkbox.checked) checkbox.checked = false;
    taskItem.classList.remove('completed');
  });

  Object.keys(dayProgress).forEach(day => {
    dayProgress[day] = 0;
    updateDailyProgress(day);
  });
  updateWeeklyProgress();
  saveTasks();
}

// Handle Sorting Tasks by Effort
function handleSortTasksByEffort() {
  Object.keys(dayProgress).forEach(day => {
    const dayColumn = document.getElementById(day);
    const taskList = dayColumn.querySelector('.task-list');
    const tasks = Array.from(taskList.children);

    tasks.sort((a, b) => {
      const effortA = a.classList.contains('Effort-low') ? 1 :
                      a.classList.contains('Effort-medium') ? 2 : 3;
      const effortB = b.classList.contains('Effort-low') ? 1 :
                      b.classList.contains('Effort-medium') ? 2 : 3;

      return isAscending ? effortA - effortB : effortB - effortA;
    });

    taskList.innerHTML = ''; // Clear the current task list
    tasks.forEach(task => taskList.appendChild(task));
  });

  saveTasks(); // Save after sorting
  isAscending = !isAscending; // Toggle sorting order
}

// Initial Tasks Load
loadTasks();
