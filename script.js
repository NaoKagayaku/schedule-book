document.addEventListener('DOMContentLoaded', () => {

    // --- グローバル変数・DOM取得 ---
    let currentDate = new Date();
    let events = JSON.parse(localStorage.getItem('events')) || {};
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentSelectedTaskId = null; // 左サイドバーで選択中のタスクID

    // 基本 (1-1)
    const clockElement = document.getElementById('clock');

    // 予定関連 (2, 3, 4)
    const monthYearElement = document.getElementById('month-year');
    const calendarGridElement = document.getElementById('calendar-grid');
    const prevMonthButton = document.getElementById('prev-month');
    const nextMonthButton = document.getElementById('next-month');
    const addEventButton = document.getElementById('add-event-button');
    const eventModal = document.getElementById('event-modal');
    const eventModalTitle = document.getElementById('event-modal-title');
    const saveEventButton = document.getElementById('save-event-button');
    const cancelEventButton = document.getElementById('cancel-event-button');
    const eventTitleInput = document.getElementById('event-title');
    const eventDateInput = document.getElementById('event-date');
    const eventDetailsModal = document.getElementById('event-details-modal');
    const eventDetailsDate = document.getElementById('event-details-date');
    const eventDetailsList = document.getElementById('event-details-list');
    const closeDetailsButton = document.getElementById('close-details-button');
    let currentEditingEvent = null;

    // タスク関連 (5, 6, 7, 8, 9, 10)
    const taskListContainer = document.getElementById('task-list-container');
    const todayTaskSection = document.getElementById('today-task-section');
    const todayTaskCard = document.getElementById('today-task-card');
    const noTasksMessage = document.getElementById('no-tasks-message');
    const newTaskForm = document.getElementById('new-task-form');
    const newTaskDueDateInput = document.getElementById('new-task-due-date'); // ★ 要求3用

    // 通知 (8-2)
    const nextTaskNotification = document.getElementById('next-task-notification');
    const nextTaskList = document.getElementById('next-task-list');
    let notificationTimer = null;

    // ★ 要求1: スライダー関連
    const prioritySlider = document.getElementById('new-task-priority');
    const priorityValueLabel = document.getElementById('priority-value-label');
    // 5段階の優先度ラベル
    const priorityLabels = {
        1: "できるときにやる",
        2: "時間があればやりたい",
        3: "いつまでにやろうか",
        4: "早めにやるべき",
        5: "絶対にやらなきゃいけない"
    };

    // ★ 要求3: グラフコンテナ
    const chartWrapper = document.querySelector('#priority-chart-container .chart-wrapper');

    // --- 0. ヘルパー関数 (新規追加) ---

    /**
     * ★ (新規) 期限までの残り日数を計算する
     * @param {string} dueDateString (YYYY-MM-DD)
     * @returns {number} 残り日数 (今日なら0, 昨日なら-1)
     */
    function getDaysUntilDue(dueDateString) {
        if (!dueDateString) return Infinity;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(dueDateString);
        dueDate.setHours(0, 0, 0, 0);

        const diffTime = dueDate.getTime() - today.getTime();
        return Math.round(diffTime / (1000 * 60 * 60 * 24));
    }

    // --- 1. 基本機能 (1-1) ---
    function updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        clockElement.textContent = `${hours}:${minutes}:${seconds}`;
    }

    // --- 2. 予定管理 (2, 3, 4) ---
    function renderCalendar() {
        calendarGridElement.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        monthYearElement.textContent = `${year}年 ${month + 1}月`;
        const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
        dayNames.forEach(day => {
            const dayNameElement = document.createElement('div');
            dayNameElement.classList.add('day-name');
            dayNameElement.textContent = day;
            calendarGridElement.appendChild(dayNameElement);
        });
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const startDayOfWeek = firstDayOfMonth.getDay();
        for (let i = 0; i < startDayOfWeek; i++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('day', 'other-month');
            calendarGridElement.appendChild(dayElement);
        }
        for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('day');
            dayElement.textContent = day;
            const today = new Date();
            if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
                dayElement.classList.add('current-day');
            }
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            if (events[dateString] && events[dateString].length > 0) {
                dayElement.classList.add('event-day');
                dayElement.addEventListener('click', () => showEventDetails(dateString));
            }
            calendarGridElement.appendChild(dayElement);
        }
    }

    function openEventModal(event = null) {
        if (event) {
            eventModalTitle.textContent = '予定を変更';
            currentEditingEvent = event;
            eventTitleInput.value = event.title;
            eventDateInput.value = event.date;
            eventDateInput.disabled = true;
        } else {
            eventModalTitle.textContent = '予定を登録';
            currentEditingEvent = null;
            eventTitleInput.value = '';
            eventDateInput.value = new Date().toISOString().split('T')[0];
            eventDateInput.disabled = false;
        }
        eventModal.classList.remove('hidden');
    }
    function closeEventModal() { eventModal.classList.add('hidden'); }

    function saveEvent() {
        const title = eventTitleInput.value.trim();
        const date = eventDateInput.value;
        if (!title || !date) { alert('タイトルと日付を入力してください。'); return; }
        if (currentEditingEvent) {
            const eventsOnDate = events[currentEditingEvent.date];
            const eventToUpdate = eventsOnDate.find(e => e.title === currentEditingEvent.title);
            if (eventToUpdate) eventToUpdate.title = title;
        } else {
            if (!events[date]) events[date] = [];
            events[date].push({ title: title });
        }
        localStorage.setItem('events', JSON.stringify(events));
        closeEventModal();
        renderCalendar();
        if (!eventDetailsModal.classList.contains('hidden')) {
            showEventDetails(eventDetailsDate.textContent);
        }
    }

    function deleteEvent(dateString, eventTitle) {
        if (confirm(`予定「${eventTitle}」を削除しますか？`)) {
            events[dateString] = events[dateString].filter(e => e.title !== eventTitle);
            if (events[dateString].length === 0) delete events[dateString];
            localStorage.setItem('events', JSON.stringify(events));
            renderCalendar();
            showEventDetails(dateString);
        }
    }

    function showEventDetails(dateString) {
        const eventsForDate = events[dateString];
        if (!eventsForDate || eventsForDate.length === 0) {
            closeEventDetailsModal(); return;
        }
        eventDetailsDate.textContent = dateString;
        eventDetailsList.innerHTML = '';
        const ul = document.createElement('ul');
        eventsForDate.forEach(event => {
            const li = document.createElement('li');
            const eventTitleSpan = document.createElement('span');
            eventTitleSpan.textContent = event.title;
            const actionsDiv = document.createElement('div');
            actionsDiv.classList.add('event-actions');
            const editBtn = document.createElement('button');
            editBtn.textContent = '変更';
            editBtn.classList.add('event-btn', 'edit-event-btn');
            editBtn.onclick = () => openEventModal({ title: event.title, date: dateString });
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '削除';
            deleteBtn.classList.add('event-btn', 'delete-event-btn');
            deleteBtn.onclick = () => deleteEvent(dateString, event.title);
            actionsDiv.appendChild(editBtn); actionsDiv.appendChild(deleteBtn);
            li.appendChild(eventTitleSpan); li.appendChild(actionsDiv);
            ul.appendChild(li);
        });
        eventDetailsList.appendChild(ul);
        eventDetailsModal.classList.remove('hidden');
    }
    function closeEventDetailsModal() { eventDetailsModal.classList.add('hidden'); }


    // --- 3. タスク管理 (5, 6, 7, 8, 9, 10) ---

    /**
     * ★ 10-1 & 要求2. 重要度スコア計算 (5段階優先度に対応)
     */
    function calculateImportanceScore(task) {
        // スライダーの値 (1-5) をそのままスコアとして使用
        const priorityScore = parseInt(task.priority, 10) || 1;
        // 重みを調整 (優先度の影響を5段階スケールに合わせる)
        const PRIORITY_WEIGHT = 4;
        const DEADLINE_WEIGHT = 5;
        const OVERDUE_DEADLINE_SCORE = 3.0;
        const dueDate = new Date(task.dueDate); dueDate.setHours(0, 0, 0, 0);
        const diffInDays = getDaysUntilDue(task.dueDate);
        let deadlineScore;
        if (diffInDays < 0) { deadlineScore = OVERDUE_DEADLINE_SCORE; }
        else { deadlineScore = 1 / (diffInDays + 1); }

        return (PRIORITY_WEIGHT * priorityScore) + (DEADLINE_WEIGHT * deadlineScore);
    }

    /**
     * 10-1. タスクソート
     */
    function sortTasks(tasksArray) {
        const incompleteTasks = tasksArray.filter(t => !t.completed);
        const completedTasks = tasksArray.filter(t => t.completed);
        incompleteTasks.sort((a, b) => calculateImportanceScore(b) - calculateImportanceScore(a));
        completedTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        return [...incompleteTasks, ...completedTasks];
    }

    /**
     * (新) 左サイドバーのタスク一覧を描画
     */
    /**
     * ★ (修正) 左サイドバーのタスク一覧を描画 (要求1.2)
     */
    function renderTaskList() {
        taskListContainer.innerHTML = '';
        const sortedTasks = sortTasks(tasks);

        if (sortedTasks.length === 0) {
            taskListContainer.innerHTML = '<p>タスクはありません。</p>';
            return;
        }

        sortedTasks.forEach(task => {
            const taskItem = document.createElement('div');
            taskItem.classList.add('task-item');
            taskItem.dataset.taskId = task.id;

            const diffInDays = getDaysUntilDue(task.dueDate);

            // ★ 要求1: 5段階の優先度クラスを付与
            taskItem.classList.add(`priority-${task.priority}`);

            if (!task.completed && diffInDays < 0) {
                taskItem.classList.add('overdue');
            }

            if (task.completed) taskItem.classList.add('completed');
            if (task.id === currentSelectedTaskId) taskItem.classList.add('selected');

            // ★ 要求1: アイコンの変更 (5段階対応)
            const icon = document.createElement('span');
            icon.classList.add('task-icon');
            if (!task.completed) {
                if (task.priority == 5) {
                    icon.textContent = '🔥'; // 絶対に
                } else if (diffInDays < 0) {
                    icon.textContent = '🚨'; // 期限切れ (優先度5以外)
                } else if (diffInDays <= 3) {
                    icon.textContent = '⏳'; // 期限間近
                } else if (task.priority == 4) {
                    icon.textContent = '⭐'; // 早めに
                } else if (task.priority == 1) {
                    icon.textContent = '🍃'; // できるときに
                }
            }
            taskItem.appendChild(icon);

            // タイトル
            const title = document.createElement('div');
            title.classList.add('task-title');
            title.textContent = task.title;

            // 期限
            const dueDateEl = document.createElement('div');
            dueDateEl.classList.add('task-due-date');
            dueDateEl.textContent = `期限: ${task.dueDate}`;

            taskItem.appendChild(title);
            taskItem.appendChild(dueDateEl);

            // ★ 要求1: 残り日数の表示
            if (!task.completed) {
                const deadlineInfo = document.createElement('div');
                deadlineInfo.classList.add('task-deadline-info');
                if (diffInDays < 0) {
                    deadlineInfo.textContent = `期限切れ (${Math.abs(diffInDays)}日超過)`;
                } else if (diffInDays === 0) {
                    deadlineInfo.textContent = '今日が期限です！';
                } else if (diffInDays <= 7) {
                    deadlineInfo.textContent = `残り ${diffInDays} 日`;
                }
                // 7日より多い場合は表示しない
                taskItem.appendChild(deadlineInfo);
            }

            // 進捗バー (ダミー)
            const progressBar = document.createElement('div');
            progressBar.classList.add('progress-bar');
            const progressInner = document.createElement('div');
            progressInner.classList.add('progress-bar-inner');
            progressInner.style.width = task.completed ? '100%' : '10%';
            progressBar.appendChild(progressInner);
            taskItem.appendChild(progressBar);

            taskItem.addEventListener('click', () => {
                showTaskInMainArea(task.id);
            });

            taskListContainer.appendChild(taskItem);
        });
    }

    /**
     * ★ (修正) 中央エリアにタスク詳細を表示 (要求2)
     */
    function showTaskInMainArea(taskId) {
        currentSelectedTaskId = taskId;
        renderTaskList(); // サイドバーの選択ハイライトを更新

        const task = tasks.find(t => t.id === taskId);
        if (!task) {
            todayTaskCard.classList.add('hidden');
            noTasksMessage.classList.remove('hidden');
            return;
        }

        // ★ 5段階の優先度マップを使用
        const priorityMap = priorityLabels;
        const diffInDays = getDaysUntilDue(task.dueDate);

        // ★ 要求2: 選定理由の判定 (5段階対応)
        let reason = '';
        if (task.priority == 5) {
            reason = '理由: 「絶対にやらなきゃいけない」タスクです';
        } else if (diffInDays < 0) {
            reason = '理由: 期限が過ぎています！';
        } else if (diffInDays === 0) {
            reason = '理由: 今日が期限です！';
        } else if (task.priority == 4) {
            reason = '理由: 「早めにやるべき」タスクです';
        } else if (diffInDays <= 3) {
            reason = `理由: 期限が迫っています (残り${diffInDays}日)`;
        } else {
            reason = '理由: 次に取り組むタスクです';
        }

        todayTaskCard.innerHTML = `
            <h3>${task.title}</h3>
            <p><strong>期限:</strong> ${task.dueDate}</p>
            <p><strong>優先度:</strong> ${priorityMap[task.priority]}</p>
            <p><strong>タグ:</strong> ${task.tag || 'なし'}</p>
            <p><strong>状態:</strong> ${task.completed ? '完了' : '未完了'}</p>

            <p class="task-reason">${reason}</p>

            <div class="task-actions">
                <button class="task-btn complete-btn" data-id="${task.id}">
                    ${task.completed ? '未完了に戻す' : '完了する'}
                </button>
                <button class="task-btn delete-btn" data-id="${task.id}">削除</button>
            </div>
        `;

        // ボタンにイベントリスナーを再付与
        todayTaskCard.querySelector('.complete-btn').addEventListener('click', () => {
            toggleTaskComplete(task.id);
        });
        todayTaskCard.querySelector('.delete-btn').addEventListener('click', () => {
            deleteTask(task.id);
        });

        todayTaskCard.classList.remove('hidden');
        noTasksMessage.classList.add('hidden');
    }

    /**
     * (新) 「次にやるべきタスク」を自動表示・更新
     */
    function updateTodayTask() {
        const sortedTasks = sortTasks(tasks);
        const nextTask = sortedTasks.find(t => !t.completed); // 最初の未完了タスク

        if (nextTask) {
            showTaskInMainArea(nextTask.id);
        } else {
            // 未完了タスクが0の場合
            currentSelectedTaskId = null;
            todayTaskCard.classList.add('hidden');
            noTasksMessage.classList.remove('hidden');
        }
    }

    /**
     * (新) ★ 要求3: 優先度グラフを描画
     */
    function renderPriorityChart() {
        chartWrapper.innerHTML = ''; // グラフをクリア

        // 未完了タスクのみを対象にカウント
        const incompleteTasks = tasks.filter(t => !t.completed);
        const countMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let maxCount = 0; // 最大件数 (高さの正規化のため)

        incompleteTasks.forEach(task => {
            const p = task.priority || 1;
            if (countMap.hasOwnProperty(p)) {
                countMap[p]++;
                if (countMap[p] > maxCount) {
                    maxCount = countMap[p];
                }
            }
        });

        if (maxCount === 0) maxCount = 1; // 0除算を避ける

        // グラフのラベル (簡潔版)
        const chartLabels = { 1: '低', 2: '↓', 3: '中', 4: '↑', 5: '高' };

        // 棒グラフを生成
        for (let i = 1; i <= 5; i++) {
            const bar = document.createElement('div');
            bar.classList.add('chart-bar');
            bar.dataset.priority = i; // 色分け用

            // 件数をパーセンテージで高さに反映
            const heightPercent = (countMap[i] / maxCount) * 100;
            bar.style.height = `${heightPercent}%`;
            bar.title = `${priorityLabels[i]}: ${countMap[i]}件`; // ホバーで詳細表示

            // ラベルを追加
            const label = document.createElement('span');
            label.classList.add('chart-bar-label');
            label.textContent = chartLabels[i];
            bar.appendChild(label);

            chartWrapper.appendChild(bar);
        }
    }

    /**
     * (新) 右サイドバーのフォームでタスクを保存 (5-3)
     */
    function handleTaskFormSubmit(e) {
        e.preventDefault();

        const title = document.getElementById('new-task-title').value.trim();
        const dueDate = document.getElementById('new-task-due-date').value;
        const priority = prioritySlider.value; // ★ スライダーから値を取得
        const tag = document.getElementById('new-task-tag').value;

        if (!title || !dueDate) {
            alert('タスク名と期限を入力してください。');
            return;
        }

        const newTask = {
            id: Date.now(),
            title: title,
            dueDate: dueDate,
            priority: priority,
            tag: tag,
            completed: false
        };

        tasks.push(newTask);
        localStorage.setItem('tasks', JSON.stringify(tasks));

        newTaskForm.reset();
        prioritySlider.value = 3; // スライダーをデフォルトに
        priorityValueLabel.textContent = priorityLabels[3]; // ラベルをデフォルトに
        document.getElementById('new-task-due-date').value = '';

        // UIを更新
        renderTaskList();
        updateTodayTask();
        updateTheme();
        renderPriorityChart(); // ★ グラフを更新
    }

    /**
     * 8-1. タスク完了
     */
    function toggleTaskComplete(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            const wasIncomplete = !task.completed;
            task.completed = !task.completed;
            if (wasIncomplete && task.completed) {
                showNextTasksNotification(); // 8-2
            }
            localStorage.setItem('tasks', JSON.stringify(tasks));

            // UI更新
            renderTaskList();
            updateTodayTask(); // 次のタスクを表示
            updateTheme(); // 9-1
            renderPriorityChart(); // ★ グラフを更新
        }
    }

    /**
     * 7-4. タスク削除
     */
    function deleteTask(taskId) {
        if (confirm('このタスクを本当に削除しますか？')) {
            tasks = tasks.filter(t => t.id !== taskId);
            localStorage.setItem('tasks', JSON.stringify(tasks));

            // UI更新
            renderTaskList();
            updateTodayTask(); // 次のタスクを表示
            updateTheme(); // 9-1
            renderPriorityChart(); // ★ グラフを更新
        }
    }

    /**
     * 8-2. タスク完了通知
     */
    function showNextTasksNotification() {
        if (notificationTimer) clearTimeout(notificationTimer);
        const upcomingTasks = sortTasks(tasks.filter(t => !t.completed));
        if (upcomingTasks.length === 0) return;
        const tasksToShow = upcomingTasks.slice(0, 3);
        nextTaskList.innerHTML = '';
        tasksToShow.forEach(task => {
            const li = document.createElement('li');
            li.textContent = task.title;
            nextTaskList.appendChild(li);
        });
        nextTaskNotification.classList.remove('hidden');
        setTimeout(() => nextTaskNotification.classList.add('visible'), 10);
        notificationTimer = setTimeout(() => {
            nextTaskNotification.classList.remove('visible');
            setTimeout(() => nextTaskNotification.classList.add('hidden'), 500);
        }, 5000);
    }

    /**
     * 9-1. テーマ更新
     */
    function updateTheme() {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const overdueTasksCount = tasks.filter(task => {
            const dueDate = new Date(task.dueDate);
            return !task.completed && dueDate < today;
        }).length;
        const body = document.body;

        // ★ CSSクラスではなく、直接スタイルを変更
        if (overdueTasksCount > 3) {
            body.style.backgroundColor = '#fff5f5'; // 危険
        } else if (overdueTasksCount > 0) {
            body.style.backgroundColor = '#fffbe6'; // 警告
        } else {
            body.style.backgroundColor = '#f0f2f5'; // デフォルト
        }
    }


    // --- 4. イベントリスナー初期設定 ---

    // 基本
    setInterval(updateClock, 1000);

    // 予定関連
    prevMonthButton.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    nextMonthButton.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    addEventButton.addEventListener('click', () => openEventModal());
    cancelEventButton.addEventListener('click', closeEventModal);
    saveEventButton.addEventListener('click', saveEvent);
    eventModal.addEventListener('click', (e) => {
        if (e.target === eventModal) closeEventModal();
    });
    closeDetailsButton.addEventListener('click', closeEventDetailsModal);
    eventDetailsModal.addEventListener('click', (e) => {
        if (e.target === eventDetailsModal) closeEventDetailsModal();
    });

    // タスク関連
    newTaskForm.addEventListener('submit', handleTaskFormSubmit);

    // ★ 要求1: スライダーの値に応じてラベルを更新
    prioritySlider.addEventListener('input', (e) => {
        const value = e.target.value;
        priorityValueLabel.textContent = priorityLabels[value];
        // 動的にラベルの色を変更（オプション）
        const colors = {1: '#28a745', 2: '#17a2b8', 3: '#007bff', 4: '#ffc107', 5: '#dc3545'};
        priorityValueLabel.style.color = colors[value];
        priorityValueLabel.style.borderColor = colors[value];
        priorityValueLabel.style.background = `${colors[value]}20`; // 薄い色
    });

    // ★ 要求3: タスク入力時のアシスト
    // newTaskDueDateInput.addEventListener('change', () => {
    //     if (!newTaskDueDateInput.value) return; // 日付がクリアされた場合は何もしない

    //     const diffInDays = getDaysUntilDue(newTaskDueDateInput.value);

    //     // 期限が未来かつ7日以内 (0 <= diff <= 7) の場合に通知
    //     if (diffInDays >= 0 && diffInDays <= 7) {
    //         // alertはUXが良くないので、console.logに変更（または簡易なメッセージ要素をHTMLに追加）
    //         console.log('入力アシスト: このタスクは緊急性が高いと判断されます。');

    //         // alertを使用する場合:
    //         // alert('このタスクは緊急性が高いと判断されます。\n（期限が1週間以内に設定されました）');
    //     }
    // });

    // --- 5. 初期表示実行 ---
    updateClock();
    renderCalendar();
    renderTaskList();
    updateTodayTask();
    updateTheme();
    renderPriorityChart(); // ★ グラフを初期描画

});