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
const uncheckAllTasks = document.getElementById('uncheckAllTasks'); // New button reference
const editModal = document.getElementById('editModal'); // Reference to the edit modal
const editModalTitle = document.getElementById('editModalTitle'); // Title input in the edit modal
const editModalEffort = document.getElementById('editModalEffort'); // Effort input in the edit modal
const confirmEdit = document.getElementById('confirmEdit'); // Confirm button in the edit modal
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

function saveTasks() {
  Object.keys(dayProgress).forEach(day => {
    const dayColumn = document.getElementById(day);
    const taskList = dayColumn.querySelector('.task-list');
    const tasks = Array.from(taskList.children);

    const taskData = tasks.map(task => {
      const title = task.querySelector('span').textContent;
      const Effort = Array.from(task.classList).find(cls => cls.startsWith('Effort-')).split('-')[1];
      const completed = task.classList.contains('completed');
      const id = task.dataset.id; // Get the task ID
      return { title, day, Effort, completed, id };
    });

    localStorage.setItem(day, JSON.stringify(taskData));
  });
}

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
    if (task.classList.contains('completed')) {
      completedWeight += EffortWeights[Effort];
    }
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

function updateWeeklyProgress() {
  const days = Object.keys(dayProgress);
  const totalProgress = days.reduce((sum, day) => sum + dayProgress[day], 0);
  weeklyProgress = totalProgress / days.length;
  progressPercentage.textContent = `${Math.round(weeklyProgress)}% Complete`;
  progressFill.style.width = `${weeklyProgress}%`;
}

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

function createTaskItem(title, day, Effort, completed, id = Date.now()) {
  const taskItem = document.createElement('li');
  taskItem.className = `task-item Effort-${Effort}`;
  if (completed) taskItem.classList.add('completed');

  taskItem.dataset.id = id; // Add ID to task item

  taskItem.innerHTML = `
    <input type="checkbox" class="select-task">
    <span>${title}</span>
    <div class="actions">
      <button class="complete"><i class="fas fa-check"></i></button>
      <button class="delete"><i class="fas fa-trash"></i></button>
      <button class="copy"><i class="fas fa-copy"></i></button>
      <button class="edit"><i class="fas fa-edit"></i></button> <!-- New Edit Button -->
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

  taskItem.querySelector('.copy').addEventListener('click', () => {
    openCopyModal([taskItem], day);
  });

  taskItem.querySelector('.edit').addEventListener('click', () => {
    openEditModal(taskItem, day);  // Trigger the edit modal when edit button is clicked
  });

  return taskItem;
}

function openEditModal(taskItem, day) {
  // Pre-fill the edit modal with the current task details
  const oldTitle = taskItem.querySelector('span').textContent;
  const oldEffort = Array.from(taskItem.classList).find(cls => cls.startsWith('Effort-')).split('-')[1];

  editModalTitle.value = oldTitle;
  editModalEffort.value = oldEffort;

  // Show the edit modal
  editModal.classList.add('active');

  // Handle the save button inside the modal
  confirmEdit.onclick = function() {
    const newTitle = editModalTitle.value.trim();
    const newEffort = editModalEffort.value;

    if (!newTitle) {
      alert('Task title cannot be empty.');
      return;
    }

    if (!EffortWeights[newEffort]) {
      alert('Invalid priority. Please enter low, medium, or high.');
      return;
    }

    // Remove the task from the current list
    taskItem.remove();

    // Add the task again with updated details
    const newTaskItem = createTaskItem(newTitle, day, newEffort, false);
    const dayColumn = document.getElementById(day);
    const taskList = dayColumn.querySelector('.task-list');
    taskList.appendChild(newTaskItem);

    // Close the edit modal
    editModal.classList.remove('active');

    // Update progress and save tasks
    updateDailyProgress(day);
    saveTasks();
  };
}

copySelectedTasks.addEventListener('click', handleMultipleTaskSelection);

function handleMultipleTaskSelection() {
  const selectedTasks = [];
  const taskItems = document.querySelectorAll('.task-item');
  
  taskItems.forEach(taskItem => {
    const checkbox = taskItem.querySelector('.select-task');
    if (checkbox && checkbox.checked) {
      selectedTasks.push(taskItem);
    }
  });
  
  if (selectedTasks.length > 0) {
    openCopyModal(selectedTasks);
  } else {
    alert('Please select at least one task to copy.');
  }
}

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

function closeCopyModal() {
  copyModal.classList.remove('active');
}

function copyTasksToOtherDay(tasks, targetDay) {
  const targetColumn = document.getElementById(targetDay);
  const targetList = targetColumn.querySelector('.task-list');

  tasks.forEach(task => {
    // Clone the task item
    const taskClone = task.cloneNode(true);
    
    // Uncheck the checkbox of the copied task
    taskClone.querySelector('.select-task').checked = false;

    // Add the copy button event listener ONLY ONCE to the cloned task
    taskClone.querySelector('.copy').addEventListener('click', () => {
      openCopyModal([taskClone]);
    });

    // Append the cloned task to the target list
    targetList.appendChild(taskClone);

    // Add event listeners for the copied task (complete, delete, etc.)
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

  // Save the tasks again after copying
  saveTasks();
}

// Event listener for adding new tasks
addTask.addEventListener('click', addNewTask);

// Initial load of tasks
loadTasks();

// Event listener for Enter key press to add task
taskTitle.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    addNewTask();  // Call the addNewTask function when Enter is pressed
  }
});

// Event listener for the 'Uncheck All Tasks' button
uncheckAllTasks.addEventListener('click', () => {
  const taskItems = document.querySelectorAll('.task-item');
  
  taskItems.forEach(taskItem => {
    // Uncheck the checkbox for each task
    const checkbox = taskItem.querySelector('.select-task');
    if (checkbox && checkbox.checked) {
      checkbox.checked = false;
    }
    
    // Remove the 'completed' class from each task
    taskItem.classList.remove('completed');
  });

  // Reset all daily progress and the overall weekly progress
  Object.keys(dayProgress).forEach(day => {
    dayProgress[day] = 0;
    updateDailyProgress(day);
  });

  updateWeeklyProgress(); // Update the overall weekly progress
  saveTasks(); // Save the updated task state
});

let isAscending = true;  // Track sorting order (true for low-to-high, false for high-to-low)

const sortTasksByEffortButton = document.getElementById('sortTasks');

sortTasksByEffortButton.addEventListener('click', () => {
  sortTasksByEffort();
  isAscending = !isAscending;  // Toggle the sorting order
});

function sortTasksByEffort() {
  Object.keys(dayProgress).forEach(day => {
    const dayColumn = document.getElementById(day);
    const taskList = dayColumn.querySelector('.task-list');
    const tasks = Array.from(taskList.children);

    // Sort the tasks based on the effort level (low, medium, high)
    tasks.sort((a, b) => {
      const effortA = a.classList.contains('Effort-low') ? 1 :
                      a.classList.contains('Effort-medium') ? 2 : 3;
      const effortB = b.classList.contains('Effort-low') ? 1 :
                      b.classList.contains('Effort-medium') ? 2 : 3;

      return isAscending ? effortA - effortB : effortB - effortA;  // Sort based on the current order
    });

    // Clear the current task list and append the sorted tasks
    taskList.innerHTML = '';
    tasks.forEach(task => {
      taskList.appendChild(task);
    });
  });

  saveTasks(); // Save the sorted tasks to local storage
}
