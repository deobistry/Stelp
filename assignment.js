document.addEventListener('DOMContentLoaded', () => {
    // Assignment data structure (stored in localStorage for persistence)
    let assignments = JSON.parse(localStorage.getItem('assignments')) || [
        {
            id: '1',
            title: 'History Research Paper',
            course: 'World History 101',
            dueDate: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString().split('T')[0],
            dueTime: '23:59',
            priority: 'high',
            progress: 20,
            subtasks: [{ title: 'Research', completed: true }, { title: 'Write Draft', completed: false }],
            type: 'essay',
            reminders: [{ type: 'email', time: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(), triggered: false }]
        },
        {
            id: '2',
            title: 'Math Problem Set',
            course: 'Calculus II',
            dueDate: new Date(new Date().setDate(new Date().getDate() + 6)).toISOString().split('T')[0],
            dueTime: '15:00',
            priority: 'medium',
            progress: 50,
            subtasks: [{ title: 'Solve Problems', completed: true }, { title: 'Review Answers', completed: false }],
            type: 'homework',
            reminders: []
        }
    ];

    // Calendar state
    let currentDate = new Date(); // Use device date
    let currentView = 'calendar';
    let currentWeekStart = new Date(currentDate);
    currentWeekStart.setDate(currentDate.getDate() - currentDate.getDay());

    // Tutorial state
    let tutorialStep = 0;
    const tutorialSteps = [
        {
            element: '#add-assignment-btn',
            message: 'Click here to add a new assignment.',
            position: 'bottom'
        },
        {
            element: '.view-options',
            message: 'Switch between Calendar, List, and Timeline views to see your assignments differently.',
            position: 'bottom'
        },
        {
            element: '.filter-dropdown',
            message: 'Filter assignments by status or priority to focus on what matters.',
            position: 'bottom'
        },
        {
            element: '.stats-section',
            message: 'View statistics to track your progress and workload.',
            position: 'top'
        }
    ];

    // DOM elements
    const calendarGrid = document.querySelector('.calendar-grid');
    const listView = document.querySelector('.list-view');
    const timelineContainer = document.querySelector('.timeline-container');
    const modal = document.querySelector('#assignment-modal');
    const modalForm = document.querySelector('#assignment-form');
    const modalTitle = document.querySelector('#modal-title');
    const closeModalBtn = document.querySelector('#close-modal');
    const cancelModalBtn = document.querySelector('#cancel-modal');
    const addAssignmentBtn = document.querySelector('#add-assignment-btn');
    const viewToggles = document.querySelectorAll('.view-toggle');
    const filterDropdown = document.querySelector('#filter-dropdown');
    const sortDropdown = document.querySelector('#sort-dropdown');
    const searchInput = document.querySelector('#search-assignments');
    const prevMonthBtn = document.querySelector('#prev-month');
    const nextMonthBtn = document.querySelector('#next-month');
    const todayBtn = document.querySelector('#today-btn');
    const currentMonthEl = document.querySelector('#current-month');
    const themeToggle = document.querySelector('#theme-toggle');
    const onboardingOverlay = document.querySelector('#onboarding-overlay');
    const timelineDays = document.querySelector('#timeline-days');
    const timelineGrid = document.querySelector('#timeline-grid');
    const timelineWeek = document.querySelector('#timeline-week');
    const prevWeekBtn = document.querySelector('#prev-week');
    const nextWeekBtn = document.querySelector('#next-week');
    const thisWeekBtn = document.querySelector('#this-week');
    const timelineHourMarkers = document.querySelector('.timeline-hour-markers');
    const totalAssignmentsEl = document.querySelector('#total-assignments');
    const upcomingAssignmentsEl = document.querySelector('#upcoming-assignments');
    const highPriorityEl = document.querySelector('#high-priority');
    const completionRateEl = document.querySelector('#completion-rate');
    const helpBtn = document.querySelector('#help-btn');

    // Fix reminder-type select options
    document.querySelector('#reminder-type').innerHTML = `
        <option value="none">None</option>
        <option value="email">Email</option>
        <option value="push">Push Notification</option>
    `;

    // Helper functions
    const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year, month) => {
        return new Date(year, month, 1).getDay();
    };

    const calculatePriority = (dueDate, progress) => {
        const now = new Date();
        const due = new Date(dueDate);
        const daysLeft = (due - now) / (1000 * 60 * 60 * 24);
        if (daysLeft < 2 || progress < 20) return 'high';
        if (daysLeft < 5 || progress < 50) return 'medium';
        return 'low';
    };

    const saveAssignments = () => {
        localStorage.setItem('assignments', JSON.stringify(assignments));
        updateStats();
        updateFilterOptions();
    };

    const updateStats = () => {
        const now = new Date();
        totalAssignmentsEl.textContent = assignments.length;
        upcomingAssignmentsEl.textContent = assignments.filter(a => new Date(a.dueDate) > now).length;
        highPriorityEl.textContent = assignments.filter(a => a.priority === 'high').length;
        const avgCompletion = assignments.length ? (assignments.reduce((sum, a) => sum + a.progress, 0) / assignments.length).toFixed(0) : 0;
        completionRateEl.textContent = `${avgCompletion}%`;
    };

    const checkReminders = () => {
        const now = new Date();
        assignments.forEach(a => {
            a.reminders.forEach(r => {
                const reminderTime = new Date(r.time);
                if (reminderTime <= now && !r.triggered) {
                    alert(`Reminder: ${a.title} is due soon!`);
                    r.triggered = true;
                    saveAssignments();
                }
            });
        });
    };

    // Run reminder check every minute
    setInterval(checkReminders, 60 * 1000);

    // Update filter dropdown based on available assignments
    const updateFilterOptions = () => {
        const filters = [
            { value: 'all', label: 'All' },
            { value: 'upcoming', label: 'Upcoming', check: a => new Date(a.dueDate) > new Date() },
            { value: 'completed', label: 'Completed', check: a => a.progress === 100 },
            { value: 'high', label: 'High Priority', check: a => a.priority === 'high' },
            { value: 'medium', label: 'Medium Priority', check: a => a.priority === 'medium' },
            { value: 'low', label: 'Low Priority', check: a => a.priority === 'low' }
        ];
        filterDropdown.querySelector('.dropdown-content').innerHTML = filters.map(f => {
            const disabled = f.check && !assignments.some(f.check);
            return `<div class="dropdown-item ${f.value === 'all' ? 'active' : ''}" data-filter="${f.value}" ${disabled ? 'style="opacity: 0.5; cursor: not-allowed;"' : ''}>${f.label}</div>`;
        }).join('');
        // Reattach event listeners
        filterDropdown.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                if (item.style.cursor !== 'not-allowed') {
                    filterDropdown.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active'));
                    item.classList.add('active');
                    if (currentView === 'calendar') renderCalendar();
                    if (currentView === 'list') renderList();
                    if (currentView === 'timeline') renderTimeline();
                }
            });
        });
    };

    // Apply filters to assignments
    const applyFilters = (assignments) => {
        let filtered = [...assignments];
        const activeFilter = filterDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-filter') || 'all';
        if (activeFilter !== 'all') {
            filtered = filtered.filter(a => {
                if (activeFilter === 'upcoming') return new Date(a.dueDate) > new Date();
                if (activeFilter === 'completed') return a.progress === 100;
                return a.priority === activeFilter;
            });
        }

        // Apply search
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            filtered = filtered.filter(a => 
                a.title.toLowerCase().includes(searchTerm) || a.course.toLowerCase().includes(searchTerm)
            );
        }

        return filtered;
    };

    // Apply sorting to assignments
    const applySorting = (assignments) => {
        let sorted = [...assignments];
        const activeSort = sortDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-sort') || 'due-asc';
        sorted.sort((a, b) => {
            if (activeSort === 'due-asc') return new Date(`${a.dueDate}T${a.dueTime}`) - new Date(`${b.dueDate}T${b.dueTime}`);
            if (activeSort === 'due-desc') return new Date(`${b.dueDate}T${b.dueTime}`) - new Date(`${a.dueDate}T${a.dueTime}`);
            if (activeSort === 'priority-desc') return ['high', 'medium', 'low'].indexOf(b.priority) - ['high', 'medium', 'low'].indexOf(a.priority);
            if (activeSort === 'priority-asc') return ['high', 'medium', 'low'].indexOf(a.priority) - ['high', 'medium', 'low'].indexOf(b.priority);
            if (activeSort === 'progress-asc') return a.progress - b.progress;
            return b.progress - a.progress;
        });
        return sorted;
    };

    // Tutorial functions
    const startTutorialMode = () => {
        onboardingOverlay.innerHTML = `
            <div class="onboarding-content tutorial-content">
                <div class="tutorial-step" id="tutorial-step">
                    <h2 class="onboarding-title">Tutorial</h2>
                    <p id="tutorial-message"></p>
                </div>
                <div class="tutorial-actions">
                    <button class="tutorial-btn" id="prev-step">Previous</button>
                    <button class="tutorial-btn" id="next-step">Next</button>
                    <button class="tutorial-btn" id="skip-tutorial">Skip</button>
                </div>
            </div>
        `;
        onboardingOverlay.style.display = 'flex';

        const tutorialContent = document.querySelector('.tutorial-content');
        const tutorialMessage = document.querySelector('#tutorial-message');
        const prevStepBtn = document.querySelector('#prev-step');
        const nextStepBtn = document.querySelector('#next-step');
        const skipTutorialBtn = document.querySelector('#skip-tutorial');

        const updateTutorialStep = () => {
            const step = tutorialSteps[tutorialStep];
            tutorialMessage.textContent = step.message;
            prevStepBtn.disabled = tutorialStep === 0;
            nextStepBtn.textContent = tutorialStep === tutorialSteps.length - 1 ? 'Finish' : 'Next';

            const element = document.querySelector(step.element);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('tutorial-highlight');
                tutorialContent.style.position = 'absolute';
                const rect = element.getBoundingClientRect();
                if (step.position === 'bottom') {
                    tutorialContent.style.top = `${rect.bottom + window.scrollY + 10}px`;
                    tutorialContent.style.left = `${rect.left + rect.width / 2 - 300}px`;
                } else {
                    tutorialContent.style.top = `${rect.top + window.scrollY - 10 - tutorialContent.offsetHeight}px`;
                    tutorialContent.style.left = `${rect.left + rect.width / 2 - 300}px`;
                }
            }
        };

        const removeHighlight = () => {
            document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
        };

        prevStepBtn.addEventListener('click', () => {
            if (tutorialStep > 0) {
                removeHighlight();
                tutorialStep--;
                updateTutorialStep();
            }
        });

        nextStepBtn.addEventListener('click', () => {
            if (tutorialStep < tutorialSteps.length - 1) {
                removeHighlight();
                tutorialStep++;
                updateTutorialStep();
            } else {
                endTutorial();
            }
        });

        skipTutorialBtn.addEventListener('click', endTutorial);

        updateTutorialStep();
    };

    const endTutorial = () => {
        localStorage.setItem('tutorialCompleted', 'true');
        onboardingOverlay.style.display = 'none';
        document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
    };

    // Add tutorial highlight CSS
    const style = document.createElement('style');
    style.textContent = `
        .tutorial-highlight {
            position: relative;
            z-index: 3100;
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 10px rgba(0, 0, 0, 0.5);
            border-radius: 8px;
        }
        .tutorial-content {
            max-width: 600px;
            width: 90%;
            background: white;
            padding: 2rem;
            border-radius: 8px;
            text-align: center;
        }
        .tutorial-actions {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin-top: 1rem;
        }
        .tutorial-btn {
            padding: 0.8rem 1.5rem;
            border-radius: 8px;
            cursor: pointer;
            background: var(--primary-color);
            color: white;
            border: none;
        }
        .tutorial-btn:disabled {
            background: var(--light-gray);
            cursor: not-allowed;
        }
        .tutorial-btn#skip-tutorial {
            background: white;
            color: var(--dark-color);
            border: 1px solid var(--light-gray);
        }
    `;
    document.head.appendChild(style);

    // Check tutorial completion and set up initial overlay
    if (!localStorage.getItem('tutorialCompleted')) {
        onboardingOverlay.style.display = 'flex';
    } else {
        onboardingOverlay.style.display = 'none';
    }

    // Attach tutorial button listeners
    const setupTutorialButtons = () => {
        const skipOnboarding = document.querySelector('#skip-onboarding');
        const startTutorial = document.querySelector('#start-tutorial');
        if (skipOnboarding) {
            skipOnboarding.addEventListener('click', endTutorial);
        }
        if (startTutorial) {
            startTutorial.addEventListener('click', () => {
                tutorialStep = 0;
                startTutorialMode();
            });
        }
    };
    setupTutorialButtons();

    // Help button to restart tutorial
    helpBtn.addEventListener('click', () => {
        tutorialStep = 0;
        localStorage.removeItem('tutorialCompleted');
        startTutorialMode();
    });

    // Calendar rendering
    const renderCalendar = () => {
        calendarGrid.innerHTML = `
            <div class="calendar-day-header">Sun</div>
            <div class="calendar-day-header">Mon</div>
            <div class="calendar-day-header">Tue</div>
            <div class="calendar-day-header">Wed</div>
            <div class="calendar-day-header">Thu</div>
            <div class="calendar-day-header">Fri</div>
            <div class="calendar-day-header">Sat</div>
        `;
        currentMonthEl.textContent = formatDate(currentDate);
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const today = new Date();

        // Previous month's days
        const prevMonthDays = firstDay > 0 ? getDaysInMonth(year, month - 1) - firstDay + 1 : 0;
        for (let i = prevMonthDays; i <= getDaysInMonth(year, month - 1); i++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day other-month';
            dayEl.innerHTML = `<div class="day-number">${i}</div>`;
            calendarGrid.appendChild(dayEl);
        }

        // Current month's days
        let filteredAssignments = applyFilters(assignments);
        filteredAssignments = applySorting(filteredAssignments);

        for (let i = 1; i <= daysInMonth; i++) {
            const dayDate = new Date(year, month, i);
            const isToday = dayDate.toDateString() === today.toDateString();
            const dayEl = document.createElement('div');
            dayEl.className = `calendar-day ${isToday ? 'today' : ''}`;
            dayEl.setAttribute('data-date', dayDate.toISOString().split('T')[0]);
            dayEl.setAttribute('dropzone', 'move');
            dayEl.innerHTML = `
                <div class="day-number">${i}</div>
                <div class="day-assignments"></div>
                <button class="add-day-assignment" data-date="${dayDate.toISOString().split('T')[0]}">
                    <i class="fas fa-plus"></i>
                </button>
            `;
            calendarGrid.appendChild(dayEl);

            // Add assignments
            const dayAssignments = filteredAssignments.filter(a => a.dueDate === dayDate.toISOString().split('T')[0]);
            const assignmentsContainer = dayEl.querySelector('.day-assignments');
            dayAssignments.forEach(assignment => {
                const assignmentEl = document.createElement('div');
                assignmentEl.className = `day-assignment ${assignment.priority}`;
                assignmentEl.setAttribute('draggable', 'true');
                assignmentEl.setAttribute('data-id', assignment.id);
                assignmentEl.innerHTML = `
                    <span class="priority-indicator ${assignment.priority}"></span>
                    ${assignment.title}
                    <span class="assignment-time">${assignment.dueTime}</span>
                `;
                assignmentEl.addEventListener('click', () => {
                    modalTitle.textContent = 'Edit Assignment';
                    document.querySelector('#assignment-title').value = assignment.title;
                    document.querySelector('#assignment-course').value = assignment.course;
                    document.querySelector('#due-date').value = assignment.dueDate;
                    document.querySelector('#due-time').value = assignment.dueTime;
                    document.querySelector('#priority').value = assignment.priority;
                    document.querySelector('#progress').value = assignment.progress;
                    document.querySelector('#subtasks').value = assignment.subtasks.map(s => s.title).join(', ');
                    document.querySelector('#assignment-type').value = assignment.type;
                    document.querySelector('#reminder-type').value = assignment.reminders[0]?.type || 'none';
                    document.querySelector('#reminder-time').value = assignment.reminders[0]?.time || '';
                    modal.setAttribute('data-id', assignment.id);
                    modal.classList.add('show');
                });
                assignmentsContainer.appendChild(assignmentEl);
            });

            // Heat indicator
            if (dayAssignments.length > 0) {
                const heatClass = dayAssignments.length > 3 ? 'heat-high' : dayAssignments.length > 1 ? 'heat-medium' : 'heat-low';
                dayEl.innerHTML += `<div class="heat-indicator ${heatClass}"></div>`;
            }
        }

        // Next month's days
        const totalDays = firstDay + daysInMonth;
        const nextMonthDays = totalDays % 7 === 0 ? 0 : 7 - (totalDays % 7);
        for (let i = 1; i <= nextMonthDays; i++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day other-month';
            dayEl.innerHTML = `<div class="day-number">${i}</div>`;
            calendarGrid.appendChild(dayEl);
        }

        // Drag and drop events
        document.querySelectorAll('.day-assignment').forEach(item => {
            item.addEventListener('dragstart', e => {
                e.dataTransfer.setData('text/plain', item.getAttribute('data-id'));
            });
        });

        document.querySelectorAll('.calendar-day:not(.other-month)').forEach(day => {
            day.addEventListener('dragover', e => {
                e.preventDefault();
            });
            day.addEventListener('drop', e => {
                e.preventDefault();
                const assignmentId = e.dataTransfer.getData('text/plain');
                const newDate = day.getAttribute('data-date');
                const assignment = assignments.find(a => a.id === assignmentId);
                if (assignment && newDate) {
                    assignment.dueDate = newDate;
                    assignment.priority = calculatePriority(newDate, assignment.progress);
                    saveAssignments();
                    renderCalendar();
                    renderList();
                    renderTimeline();
                }
            });
        });

        // Add assignment from calendar
        document.querySelectorAll('.add-day-assignment').forEach(btn => {
            btn.addEventListener('click', () => {
                modalTitle.textContent = 'Add New Assignment';
                modalForm.reset();
                document.querySelector('#due-date').value = btn.getAttribute('data-date');
                modal.removeAttribute('data-id');
                modal.classList.add('show');
            });
        });
    };

    // List view rendering
    const renderList = () => {
        const assignmentList = document.querySelector('.assignment-list');
        assignmentList.innerHTML = `
            <div class="list-header">
                <div>Assignment</div>
                <div>Due Date</div>
                <div>Priority</div>
                <div>Progress</div>
                <div>Actions</div>
            </div>
        `;
        let filteredAssignments = applyFilters(assignments);
        filteredAssignments = applySorting(filteredAssignments);

        filteredAssignments.forEach(assignment => {
            const item = document.createElement('div');
            item.className = 'assignment-item';
            const daysLeft = Math.ceil((new Date(assignment.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
            const daysLeftClass = daysLeft < 2 ? 'urgent' : daysLeft < 5 ? 'warning' : 'good';
            item.innerHTML = `
                <div>
                    <div class="assignment-title">${assignment.title}</div>
                    <div class="assignment-course">${assignment.course}</div>
                    <span class="assignment-tag">${assignment.type}</span>
                </div>
                <div>${assignment.dueDate} ${assignment.dueTime}</div>
                <div><span class="assignment-priority ${assignment.priority}">${assignment.priority.charAt(0).toUpperCase() + assignment.priority.slice(1)}</span></div>
                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${assignment.progress}%"></div>
                    </div>
                    <div class="progress-text">${assignment.progress}%</div>
                </div>
                <div class="assignment-actions">
                    <button class="action-btn edit-btn" data-id="${assignment.id}"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" data-id="${assignment.id}"><i class="fas fa-trash"></i></button>
                </div>
            `;
            assignmentList.appendChild(item);
        });

        // Edit and delete actions
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const assignment = assignments.find(a => a.id === btn.getAttribute('data-id'));
                if (assignment) {
                    modalTitle.textContent = 'Edit Assignment';
                    document.querySelector('#assignment-title').value = assignment.title;
                    document.querySelector('#assignment-course').value = assignment.course;
                    document.querySelector('#due-date').value = assignment.dueDate;
                    document.querySelector('#due-time').value = assignment.dueTime;
                    document.querySelector('#priority').value = assignment.priority;
                    document.querySelector('#progress').value = assignment.progress;
                    document.querySelector('#subtasks').value = assignment.subtasks.map(s => s.title).join(', ');
                    document.querySelector('#assignment-type').value = assignment.type;
                    document.querySelector('#reminder-type').value = assignment.reminders[0]?.type || 'none';
                    document.querySelector('#reminder-time').value = assignment.reminders[0]?.time || '';
                    modal.setAttribute('data-id', assignment.id);
                    modal.classList.add('show');
                }
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const assignmentId = btn.getAttribute('data-id');
                const assignment = assignments.find(a => a.id === assignmentId);
                if (assignment && confirm(`Are you sure you want to delete "${assignment.title}"?`)) {
                    assignments = assignments.filter(a => a.id !== assignmentId);
                    saveAssignments();
                    renderCalendar();
                    renderList();
                    renderTimeline();
                }
            });
        });
    };

    // Timeline rendering
    const renderTimeline = () => {
        timelineWeek.textContent = `Week of ${currentWeekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
        timelineDays.innerHTML = '';
        timelineGrid.innerHTML = '';
        timelineHourMarkers.innerHTML = '';

        // Days
        for (let i = 0; i < 7; i++) {
            const day = new Date(currentWeekStart.getTime() + i * 24 * 60 * 60 * 1000);
            const isToday = day.toDateString() === new Date().toDateString();
            const dayEl = document.createElement('div');
            dayEl.innerHTML = `
                <div class="timeline-day">${day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div class="timeline-date ${isToday ? 'today' : ''}">${day.getDate()}</div>
            `;
            timelineDays.appendChild(dayEl);

            const column = document.createElement('div');
            column.className = 'timeline-column';
            column.setAttribute('data-date', day.toISOString().split('T')[0]);
            timelineGrid.appendChild(column);
        }

        // Hour markers
        for (let i = 0; i < 24; i++) {
            const marker = document.createElement('div');
            marker.className = 'hour-marker';
            marker.style.top = `${i * 30}px`;
            marker.textContent = `${i}:00`;
            timelineHourMarkers.appendChild(marker);
        }

        // Events
        let filteredAssignments = applyFilters(assignments);
        filteredAssignments = applySorting(filteredAssignments);
        filteredAssignments.forEach(assignment => {
            const dueDate = new Date(assignment.dueDate);
            if (dueDate >= currentWeekStart && dueDate <= new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000)) {
                const dayIndex = Math.floor((dueDate - currentWeekStart) / (24 * 60 * 60 * 1000));
                const column = timelineGrid.children[dayIndex];
                const [hours, minutes] = assignment.dueTime.split(':').map(Number);
                const top = (hours * 60 + minutes) / 2; // 30px per hour
                const event = document.createElement('div');
                event.className = `timeline-event ${assignment.priority}`;
                event.style.top = `${top}px`;
                event.style.height = '30px';
                event.innerHTML = assignment.title;
                event.addEventListener('click', () => {
                    modalTitle.textContent = 'Edit Assignment';
                    document.querySelector('#assignment-title').value = assignment.title;
                    document.querySelector('#assignment-course').value = assignment.course;
                    document.querySelector('#due-date').value = assignment.dueDate;
                    document.querySelector('#due-time').value = assignment.dueTime;
                    document.querySelector('#priority').value = assignment.priority;
                    document.querySelector('#progress').value = assignment.progress;
                    document.querySelector('#subtasks').value = assignment.subtasks.map(s => s.title).join(', ');
                    document.querySelector('#assignment-type').value = assignment.type;
                    document.querySelector('#reminder-type').value = assignment.reminders[0]?.type || 'none';
                    document.querySelector('#reminder-time').value = assignment.reminders[0]?.time || '';
                    modal.setAttribute('data-id', assignment.id);
                    modal.classList.add('show');
                });
                column.appendChild(event);
            }
        });
    };

    // View switching
    const switchView = (view) => {
        currentView = view;
        calendarGrid.parentElement.style.display = view === 'calendar' ? 'block' : 'none';
        listView.style.display = view === 'list' ? 'block' : 'none';
        timelineContainer.style.display = view === 'timeline' ? 'block' : 'none';
        viewToggles.forEach(toggle => toggle.classList.toggle('active', toggle.getAttribute('data-view') === view));
        if (view === 'calendar') renderCalendar();
        if (view === 'list') renderList();
        if (view === 'timeline') renderTimeline();
    };

    viewToggles.forEach(toggle => {
        toggle.addEventListener('click', () => switchView(toggle.getAttribute('data-view')));
    });

    // Modal handling
    addAssignmentBtn.addEventListener('click', () => {
        modalTitle.textContent = 'Add New Assignment';
        modalForm.reset();
        modal.removeAttribute('data-id');
        modal.classList.add('show');
    });

    closeModalBtn.addEventListener('click', () => modal.classList.remove('show'));
    cancelModalBtn.addEventListener('click', () => modal.classList.remove('show'));

    // Modal tab switching
    document.querySelectorAll('.modal-nav-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.modal-nav-item').forEach(i => i.classList.remove('active'));
            document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
            item.classList.add('active');
            document.querySelector(`.modal-tab[data-tab="${item.getAttribute('data-tab')}"]`).classList.add('active');
        });
    });

    modalForm.addEventListener('submit', e => {
        e.preventDefault();
        const id = modal.getAttribute('data-id') || generateUUID();
        const progress = parseInt(document.querySelector('#progress').value) || 0;
        if (progress < 0 || progress > 100) {
            alert('Progress must be between 0 and 100.');
            return;
        }
        const subtasksRaw = document.querySelector('#subtasks').value.split(',').map(s => s.trim()).filter(s => s);
        const assignment = {
            id,
            title: document.querySelector('#assignment-title').value,
            course: document.querySelector('#assignment-course').value,
            dueDate: document.querySelector('#due-date').value,
            dueTime: document.querySelector('#due-time').value,
            priority: document.querySelector('#priority').value,
            progress,
            subtasks: subtasksRaw.map(title => ({ title, completed: false })),
            type: document.querySelector('#assignment-type').value,
            reminders: []
        };
        const reminderType = document.querySelector('#reminder-type').value;
        const reminderTime = document.querySelector('#reminder-time').value;
        if (reminderType !== 'none' && reminderTime) {
            assignment.reminders.push({ type: reminderType, time: reminderTime, triggered: false });
        }
        if (modal.getAttribute('data-id')) {
            const index = assignments.findIndex(a => a.id === id);
            assignments[index] = assignment;
        } else {
            assignments.push(assignment);
        }
        saveAssignments();
        modal.classList.remove('show');
        renderCalendar();
        renderList();
        renderTimeline();
    });

    // Calendar navigation
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    todayBtn.addEventListener('click', () => {
        currentDate = new Date();
        renderCalendar();
    });

    // Timeline navigation
    prevWeekBtn.addEventListener('click', () => {
        currentWeekStart.setDate(currentWeekStart.getDate() - 7);
        renderTimeline();
    });

    nextWeekBtn.addEventListener('click', () => {
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        renderTimeline();
    });

    thisWeekBtn.addEventListener('click', () => {
        currentWeekStart = new Date();
        currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
        renderTimeline();
    });

    // Dropdown toggle
    const toggleDropdown = (dropdown) => {
        const content = dropdown.querySelector('.dropdown-content');
        const isOpen = content.classList.contains('show');
        document.querySelectorAll('.dropdown-content').forEach(c => c.classList.remove('show'));
        if (!isOpen) {
            content.classList.add('show');
        }
    };

    filterDropdown.parentElement.addEventListener('click', () => toggleDropdown(filterDropdown));
    sortDropdown.parentElement.addEventListener('click', () => toggleDropdown(sortDropdown));

    // Close dropdowns when clicking outside
    document.addEventListener('click', e => {
        if (!filterDropdown.contains(e.target) && !sortDropdown.contains(e.target)) {
            filterDropdown.querySelector('.dropdown-content').classList.remove('show');
            sortDropdown.querySelector('.dropdown-content').classList.remove('show');
        }
    });

    // Filter and sort
    filterDropdown.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
            if (item.style.cursor !== 'not-allowed') {
                filterDropdown.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                if (currentView === 'calendar') renderCalendar();
                if (currentView === 'list') renderList();
                if (currentView === 'timeline') renderTimeline();
            }
        });
    });

    sortDropdown.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
            sortDropdown.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            if (currentView === 'calendar') renderCalendar();
            if (currentView === 'list') renderList();
            if (currentView === 'timeline') renderTimeline();
        });
    });

    searchInput.addEventListener('input', () => {
        if (currentView === 'calendar') renderCalendar();
        if (currentView === 'list') renderList();
        if (currentView === 'timeline') renderTimeline();
    });

    // Dark mode toggle
    themeToggle.addEventListener('change', () => {
        document.body.classList.toggle('dark-mode');
        if (document.body.classList.contains('dark-mode')) {
            document.body.style.backgroundColor = '#212529';
            document.querySelectorAll('.calendar-day, .assignment-list, .timeline-container, .stat-card').forEach(el => {
                el.style.backgroundColor = '#343a40';
                el.style.color = '#f8f9fa';
            });
        } else {
            document.body.style.backgroundColor = '#f5f7fb';
            document.querySelectorAll('.calendar-day, .assignment-list, .timeline-container, .stat-card').forEach(el => {
                el.style.backgroundColor = 'white';
                el.style.color = '#212529';
            });
        }
    });

    // Initial render
    renderCalendar();
    updateStats();
    updateFilterOptions();
    checkReminders();
});