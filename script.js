


document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const taskInput = document.getElementById('task-input');
  const addTaskBtn = document.getElementById('add-task-btn');
  const taskList = document.getElementById('task-list');
  const emptyImage = document.querySelector('.empty-image');
  const todosContainer = document.querySelector('.todos-container');
  const progressBar = document.getElementById('progress');
  const progressNumbers = document.getElementById('numbers');

  const toggleEmptyState = () => {
    emptyImage.style.display = taskList.children.length === 0 ? 'block' : 'none';
    todosContainer.style.width = taskList.children.length > 0 ? '100%' : '50%';
  };

  const updateProgress = (checkCompletion = true) => {
    const totalTasks = taskList.children.length;
    const completedTasks = taskList.querySelectorAll('.checkbox:checked').length;

    progressBar.style.width = totalTasks ? `${(completedTasks / totalTasks) * 100}%` : '0%';
    progressNumbers.textContent = `${completedTasks}/${totalTasks}`;
    
    // Add confetti when all tasks are completed
    if(checkCompletion && totalTasks > 0 && completedTasks === totalTasks) {
       triggerConfetti();
    }
  };

  // NEW: Save tasks to localStorage
  const saveTaskToLocalStorage = () => {
    const tasks = Array.from(taskList.querySelectorAll('li')).map(li => ({
      text: li.querySelector('span').textContent,
      completed: li.querySelector('.checkbox').checked
    }));
    localStorage.setItem('tasks', JSON.stringify(tasks));
  };

  // NEW: Load tasks from localStorage
  const loadTasksFromLocalStorage = () => {
    const savedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    savedTasks.forEach(({ text, completed }) => {
      addTask(text, completed);
    });
    toggleEmptyState();
    updateProgress(false);
  };

  const addTask = (text, isCompleted = false) => {
    const taskText = text || taskInput.value.trim();
    if (!taskText) return;

    const li = document.createElement('li');
    
    li.innerHTML = `
      <input type="checkbox" class="checkbox" ${isCompleted ? 'checked' : ''}/>
      <span>${taskText}</span>
      <div class="task-buttons">
        <button class="edit-btn"><i class="fa-solid fa-pen"></i></button>
        <button class="delete-btn"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;

    const checkbox = li.querySelector('.checkbox');
    const editBtn = li.querySelector('.edit-btn');
    const taskSpan = li.querySelector('span');

    // Initialize completed state if needed
    if (isCompleted) {
      li.classList.add('completed');
      taskSpan.style.color = '#000';
      taskSpan.style.textDecoration = 'line-through';
      editBtn.disabled = true;
      editBtn.style.opacity = '0.5';
      editBtn.style.pointerEvents = 'none';
    }

    checkbox.addEventListener('change', () => {
      const isChecked = checkbox.checked;
      li.classList.toggle('completed', isChecked);
      taskSpan.style.color = isChecked ? '#000' : '#fff';
      taskSpan.style.textDecoration = isChecked ? 'line-through' : 'none';
      editBtn.disabled = isChecked;
      editBtn.style.opacity = isChecked ? '0.5' : '1';
      editBtn.style.pointerEvents = isChecked ? 'none' : 'auto';
      updateProgress();
      saveTaskToLocalStorage(); // NEW: Save on checkbox change
    });

    editBtn.addEventListener('click', () => {
      if (!checkbox.checked) {
        taskInput.value = taskSpan.textContent;
        li.remove();
        updateProgress(false);
        toggleEmptyState();
        saveTaskToLocalStorage(); // NEW: Save on edit/remove
      }
    });

    li.querySelector('.delete-btn').addEventListener('click', () => {
      li.remove();
      updateProgress();
      toggleEmptyState();
      saveTaskToLocalStorage(); // NEW: Save on delete
    });

    taskList.appendChild(li);
    taskInput.value = '';
    taskInput.focus();
    updateProgress();
    toggleEmptyState();
    saveTaskToLocalStorage(); // NEW: Save on new task
  };

  // Form submission handler
  const handleSubmit = (e) => {
    e.preventDefault();
    addTask();
  };

  // Event listeners
  addTaskBtn.addEventListener('click', handleSubmit);
  taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  });

  // NEW: Load saved tasks on startup
  loadTasksFromLocalStorage();
});

const triggerConfetti = () => {
    const count = 200;
    const defaults = { origin: { y: 0.6 } };

    function fire(particleRatio, opts) {
        confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio),
            colors: ['#ff6f91', '#ffbf00', '#4CAF50', '#ffffff']
        });
    }

    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleRatio = 0.7;
        fire(particleRatio, {
            spread: 60,
            startVelocity: 55,
            scalar: 1.2,
            origin: { x: Math.random(), y: Math.random() * 0.5 }
        });
        
        fire(particleRatio * 0.6, {
            spread: 120,
            startVelocity: 45,
            scalar: 0.8
        });
    }, 250);
};