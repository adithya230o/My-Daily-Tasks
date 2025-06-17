document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const taskInput = document.getElementById('task-input');
  const addTaskBtn = document.getElementById('add-task-btn');
  const taskList = document.getElementById('task-list');
  const emptyImage = document.querySelector('.empty-image');
  const todosContainer = document.querySelector('.todos-container');
  const progressBar = document.getElementById('progress');
  const progressNumbers = document.getElementById('numbers');
  
  // Reminder elements
  const reminderModal = document.getElementById('reminder-modal');
  const reminderTimeInput = document.getElementById('reminder-time');
  const cancelReminderBtn = document.getElementById('cancel-reminder');
  const saveReminderBtn = document.getElementById('save-reminder');
  
  // State variables
  let currentTaskIdForReminder = null;
  const reminderCheckInterval = 60000; // Check every minute

  // Notification functions
  const showNotification = (message, duration = 3000) => {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');
    
    notificationText.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
      notification.classList.remove('show');
    }, duration);
  };

  // System notification (browser notification)
  const showSystemNotification = (title, body) => {
    if (!("Notification" in window)) {
      console.log("This browser does not support system notifications");
      return;
    }
    
    if (Notification.permission === "granted") {
      new Notification(title, { body });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          new Notification(title, { body });
        }
      });
    }
  };

  const toggleEmptyState = () => {
    emptyImage.style.display = taskList.children.length === 0 ? 'block' : 'none';
    todosContainer.style.width = taskList.children.length > 0 ? '100%' : '50%';
  };

  const updateProgress = (checkCompletion = true) => {
    const totalTasks = taskList.children.length;
    const completedTasks = taskList.querySelectorAll('.checkbox:checked').length;

    progressBar.style.width = totalTasks ? `${(completedTasks / totalTasks) * 100}%` : '0%';
    progressNumbers.textContent = `${completedTasks}/${totalTasks}`;
    
    if(checkCompletion && totalTasks > 0 && completedTasks === totalTasks) {
      triggerConfetti();
      showNotification("🎉 All tasks completed! Great job!", 5000);
    }
  };

  const saveTaskToLocalStorage = () => {
    const tasks = Array.from(taskList.querySelectorAll('li')).map(li => ({
      id: li.dataset.id,
      text: li.querySelector('span').textContent,
      completed: li.querySelector('.checkbox').checked,
      reminder: li.dataset.reminder || null
    }));
    localStorage.setItem('tasks', JSON.stringify(tasks));
  };

  const loadTasksFromLocalStorage = () => {
    const savedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    savedTasks.forEach(({ id, text, completed, reminder }) => {
      addTask(text, completed, id, reminder);
    });
    toggleEmptyState();
    updateProgress(false);
  };

  // Generate unique ID for tasks
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  // Format time for display
  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Add reminder button to task
  const addReminderButton = (li, hasReminder = false) => {
    const taskButtons = li.querySelector('.task-buttons');
    
    // Remove existing reminder button if any
    const existingReminderBtn = li.querySelector('.reminder-btn');
    if (existingReminderBtn) {
      existingReminderBtn.remove();
    }
    
    const reminderBtn = document.createElement('button');
    reminderBtn.className = 'reminder-btn';
    reminderBtn.innerHTML = `<i class="fa-solid ${hasReminder ? 'fa-bell' : 'fa-bell-slash'}"></i>`;
    reminderBtn.title = hasReminder ? `Reminder set for ${formatTime(li.dataset.reminder)}` : 'Set reminder';
    
    reminderBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      currentTaskIdForReminder = li.dataset.id;
      reminderTimeInput.value = li.dataset.reminder || '';
      reminderModal.classList.add('active');
    });
    
    taskButtons.prepend(reminderBtn);
  };

  const addTask = (text, isCompleted = false, id = null, reminder = null) => {
    const taskText = text || taskInput.value.trim();
    if (!taskText) return;

    if (!text) { // Only show for newly added tasks
      showNotification(`Task added: "${taskText}"`);
    }

    const li = document.createElement('li');
    const taskId = id || generateId();
    li.dataset.id = taskId;
    
    if (reminder) {
      li.dataset.reminder = reminder;
    }
    
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

    // Add reminder button
    addReminderButton(li, !!reminder);

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
      const taskText = taskSpan.textContent;
      
      li.classList.toggle('completed', isChecked);
      taskSpan.style.color = isChecked ? '#000' : '#fff';
      taskSpan.style.textDecoration = isChecked ? 'line-through' : 'none';
      editBtn.disabled = isChecked;
      editBtn.style.opacity = isChecked ? '0.5' : '1';
      editBtn.style.pointerEvents = isChecked ? 'none' : 'auto';
      
      if (isChecked) {
        showNotification(`Task completed: "${taskText}"`);
      } else {
        showNotification(`Task marked incomplete: "${taskText}"`);
      }
      
      updateProgress();
      saveTaskToLocalStorage();
    });

    editBtn.addEventListener('click', () => {
      if (!checkbox.checked) {
        taskInput.value = taskSpan.textContent;
        li.remove();
        updateProgress(false);
        toggleEmptyState();
        saveTaskToLocalStorage();
      }
    });

    li.querySelector('.delete-btn').addEventListener('click', () => {
      const taskText = li.querySelector('span').textContent;
      li.remove();
      updateProgress();
      toggleEmptyState();
      saveTaskToLocalStorage();
      showNotification(`Task removed: "${taskText}"`);
    });

    taskList.appendChild(li);
    taskInput.value = '';
    taskInput.focus();
    updateProgress();
    toggleEmptyState();
    saveTaskToLocalStorage();
  };

  // Reminder modal handlers
  cancelReminderBtn.addEventListener('click', () => {
    reminderModal.classList.remove('active');
    currentTaskIdForReminder = null;
  });

  saveReminderBtn.addEventListener('click', () => {
    const reminderTime = reminderTimeInput.value;
    if (!reminderTime) return;
    
    const taskElement = document.querySelector(`li[data-id="${currentTaskIdForReminder}"]`);
    if (taskElement) {
      if (reminderTime) {
        taskElement.dataset.reminder = reminderTime;
        showNotification(`Reminder set for ${formatTime(reminderTime)}`);
      } else {
        delete taskElement.dataset.reminder;
        showNotification('Reminder removed');
      }
      
      addReminderButton(taskElement, !!reminderTime);
      saveTaskToLocalStorage();
    }
    
    reminderModal.classList.remove('active');
    currentTaskIdForReminder = null;
  });

  // Check for due reminders
  const checkReminders = () => {
    const now = new Date();
    const currentHours = now.getHours().toString().padStart(2, '0');
    const currentMinutes = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${currentHours}:${currentMinutes}`;
    
    document.querySelectorAll('li[data-reminder]').forEach(li => {
      const reminderTime = li.dataset.reminder;
      const taskText = li.querySelector('span').textContent;
      
      if (reminderTime === currentTime && !li.classList.contains('completed')) {
        showSystemNotification('Task Reminder', `It's time to: ${taskText}`);
        showNotification(`⏰ Reminder: "${taskText}"`, 10000);
      }
    });
  };

  // Initialize reminder checking
  setInterval(checkReminders, reminderCheckInterval);
  checkReminders(); // Run immediately on load

  const handleSubmit = (e) => {
    e.preventDefault();
    addTask();
  };

  addTaskBtn.addEventListener('click', handleSubmit);
  taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  });

  // Request notification permission on first interaction
  document.body.addEventListener('click', () => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, { once: true });

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