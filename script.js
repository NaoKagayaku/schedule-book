// --- 実施項目1-1: 現在時刻表示 ---
const clockElement = document.getElementById('clock');

function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    clockElement.textContent = `${hours}:${minutes}:${seconds}`;
}

setInterval(updateClock, 1000);
updateClock();

// --- 共通のDOM要素 & データ ---
const monthYearElement = document.getElementById('month-year');
const calendarGridElement = document.getElementById('calendar-grid');
const prevMonthButton = document.getElementById('prev-month');
const nextMonthButton = document.getElementById('next-month');
let currentDate = new Date();

// --- 予定機能 (実施項目 2 & 3) ---
const addEventButton = document.getElementById('add-event-button');
const eventModal = document.getElementById('event-modal');
const saveEventButton = document.getElementById('save-event-button');
const cancelEventButton = document.getElementById('cancel-event-button');
const eventTitleInput = document.getElementById('event-title');
const eventDateInput = document.getElementById('event-date');
const eventDetailsModal = document.getElementById('event-details-modal'); // ★ 3-2. 追加
const eventDetailsDate = document.getElementById('event-details-date');   // ★ 3-2. 追加
const eventDetailsList = document.getElementById('event-details-list');   // ★ 3-2. 追加
const closeDetailsButton = document.getElementById('close-details-button');
let events = JSON.parse(localStorage.getItem('events')) || {};
let currentEditingEvent = null; // ★ 4-2. 現在編集中の予定を保持する変数

// --- タスク機能 (実施項目 5, 6, 8) ---
const addTaskButton = document.getElementById('add-task-button');
const taskModal = document.getElementById('task-modal');
const saveTaskButton = document.getElementById('save-task-button');
const cancelTaskButton = document.getElementById('cancel-task-button');
const taskTitleInput = document.getElementById('task-title');
const taskDueDateInput = document.getElementById('task-due-date');
const taskPriorityInput = document.getElementById('task-priority');
const taskListContainer = document.getElementById('task-list-container');
const nextTaskNotification = document.getElementById('next-task-notification');
const nextTaskList = document.getElementById('next-task-list');
const taskDetailsModal = document.getElementById('task-details-modal'); // ★ 6-4. 追加
const taskDetailsContent = document.getElementById('task-details-content'); // ★ 6-4. 追加
const closeTaskDetailsButton = document.getElementById('close-task-details-button'); // ★ 6-4. 追加
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentEditingTaskId = null;
let notificationTimer = null; // ★ 8-2. 通知を管理するためのタイマー変数



/**
 * カレンダーを生成して表示する関数
 */
function generateCalendar() {
    calendarGridElement.innerHTML = ''; // グリッドをクリア
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

            // ★ 3-2. 予定がある日をクリックしたら詳細表示モーダルを開く
            dayElement.addEventListener('click', () => {
                showEventDetails(dateString);
            });
        }
        calendarGridElement.appendChild(dayElement);
    }
}

// --- 予定モーダルの制御 ---
/**
 * 4-2. 予定モーダルを開く関数（新規・変更兼用）
 * @param {object | null} event - 変更する予定オブジェクト。新規の場合はnull
 */
function openEventModal(event = null) {
    const modalTitle = eventModal.querySelector('h2');
    if (event) {
        // 変更モード
        modalTitle.textContent = '予定を変更';
        currentEditingEvent = event; // 編集中の予定情報をセット
        eventTitleInput.value = event.title;
        eventDateInput.value = event.date;
        eventDateInput.disabled = true; // 日付は変更不可とする
    } else {
        // 新規登録モード
        modalTitle.textContent = '予定を登録';
        currentEditingEvent = null;
        eventTitleInput.value = '';
        eventDateInput.value = new Date().toISOString().split('T')[0];
        eventDateInput.disabled = false;
    }
    eventModal.classList.remove('hidden');
}

function closeEventModal() {
    eventModal.classList.add('hidden');
}

/**
 * 4-4. 予定を保存または更新する関数
 */
function saveEvent() {
    const title = eventTitleInput.value.trim();
    const date = eventDateInput.value;

    if (!title || !date) {
        alert('タイトルと日付を入力してください。');
        return;
    }

    if (currentEditingEvent) {
        // 更新処理
        // 元のタイトルに一致するものを探して更新
        const eventsOnDate = events[currentEditingEvent.date];
        const eventToUpdate = eventsOnDate.find(e => e.title === currentEditingEvent.title);
        if (eventToUpdate) {
            eventToUpdate.title = title;
        }
    } else {
        // 新規保存処理
        if (!events[date]) events[date] = [];
        // idの代わりにタイトルをキーとする（簡易的な実装）
        events[date].push({ title: title });
    }

    localStorage.setItem('events', JSON.stringify(events));
    closeEventModal();
    generateCalendar();

    // 詳細モーダルが開いていれば、そちらも更新する
    if (!eventDetailsModal.classList.contains('hidden')) {
        const modalDate = eventDetailsDate.textContent;
        showEventDetails(modalDate);
    }
}


/**
 * 4-4. 予定を削除する関数
 * @param {string} dateString - 予定の日付 (YYYY-MM-DD)
 * @param {string} eventTitle - 削除する予定のタイトル
 */
function deleteEvent(dateString, eventTitle) {
    if (confirm(`予定「${eventTitle}」を削除しますか？`)) {
        // 指定された日付の予定リストから、該当タイトル以外のものだけを残す
        events[dateString] = events[dateString].filter(e => e.title !== eventTitle);

        // もしその日の予定が全てなくなったら、その日付自体のキーを削除
        if (events[dateString].length === 0) {
            delete events[dateString];
        }

        localStorage.setItem('events', JSON.stringify(events));

        // カレンダーと詳細モーダルを更新
        generateCalendar();
        showEventDetails(dateString);
    }
}


// --- 予定詳細モーダルの制御 ---
function showEventDetails(dateString) {
    const eventsForDate = events[dateString];
    // ★ 予定が削除されて空になった場合を考慮
    if (!eventsForDate || eventsForDate.length === 0) {
        closeEventDetailsModal(); // 表示する予定がなければモーダルを閉じる
        return;
    }

    eventDetailsDate.textContent = dateString;
    eventDetailsList.innerHTML = '';
    const ul = document.createElement('ul');

    eventsForDate.forEach(event => {
        const li = document.createElement('li');

        const eventTitleSpan = document.createElement('span');
        eventTitleSpan.textContent = event.title;

        // ★ 4-1. 変更・削除ボタン用のコンテナ
        const actionsDiv = document.createElement('div');
        actionsDiv.classList.add('event-actions');

        // 変更ボタン
        const editBtn = document.createElement('button');
        editBtn.textContent = '変更';
        editBtn.classList.add('event-btn', 'edit-event-btn');
        editBtn.onclick = () => {
            // 変更のために、日付と元のタイトルを渡す
            openEventModal({ title: event.title, date: dateString });
        };

        // 削除ボタン
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '削除';
        deleteBtn.classList.add('event-btn', 'delete-event-btn');
        deleteBtn.onclick = () => {
            deleteEvent(dateString, event.title);
        };

        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);

        li.appendChild(eventTitleSpan);
        li.appendChild(actionsDiv);
        ul.appendChild(li);
    });
    eventDetailsList.appendChild(ul);
    eventDetailsModal.classList.remove('hidden');
}

/**
 * 予定詳細モーダルを閉じる関数
 */
function closeEventDetailsModal() {
    eventDetailsModal.classList.add('hidden');
}

// --- タスクモーダルの制御 ---
function openTaskModal() {
    taskTitleInput.value = '';
    taskDueDateInput.value = new Date().toISOString().split('T')[0];
    taskPriorityInput.value = 'medium'; // デフォルトは'中'
    taskModal.classList.remove('hidden');
}
function closeTaskModal() {
    taskModal.classList.add('hidden');
}
function saveTask() {
    const title = taskTitleInput.value.trim();
    const dueDate = taskDueDateInput.value;
    const priority = taskPriorityInput.value;

    if (!title || !dueDate) {
        alert('タスク名と期限を入力してください。');
        return;
    }

    const newTask = {
        id: Date.now(), // ユニークなIDとしてタイムスタンプを使用
        title: title,
        dueDate: dueDate,
        priority: priority,
        completed: false
    };

    tasks.push(newTask);
    localStorage.setItem('tasks', JSON.stringify(tasks));

    alert('タスクを保存しました。'); // 保存完了を通知
    closeTaskModal();
    // 現状タスクはカレンダーに表示しないため、カレンダーの再描画は不要
}

// ★ 6-4. タスク詳細モーダルの制御
/**
 * 特定のタスクの詳細を表示する関数
 * @param {number} taskId - 表示するタスクのID
 */
function showTaskDetails(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const priorityMap = { high: '高', medium: '中', low: '低' };

    // 詳細情報をHTMLとして生成
    taskDetailsContent.innerHTML = `
        <p><strong>タスク名:</strong> ${task.title}</p>
        <p><strong>期　限:</strong> ${task.dueDate}</p>
        <p><strong>優先度:</strong> ${priorityMap[task.priority]}</p>
        <p><strong>状　態:</strong> ${task.completed ? '完了' : '未完了'}</p>
    `;

    // モーダルを表示
    taskDetailsModal.classList.remove('hidden');
}

/**
 * タスク詳細モーダルを閉じる関数
 */
function closeTaskDetailsModal() {
    taskDetailsModal.classList.add('hidden');
}

/**
 * 8-1. タスクの完了状態を考慮してソートする関数
 * @param {Array} tasksArray - ソート対象のタスク配列
 * @returns {Array} ソート済みのタスク配列
 */
function sortTasks(tasksArray) {
    const priorityMap = { high: 1, medium: 2, low: 3 };

    return tasksArray.sort((a, b) => {
        // 完了状態を比較 (未完了が先)
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }

        // --- 以下は未完了タスク同士、または完了タスク同士の比較 ---
        // 期限日で比較
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;

        // 期限日が同じ場合は優先度で比較
        const priorityA = priorityMap[a.priority];
        const priorityB = priorityMap[b.priority];
        if (priorityA < priorityB) return -1;
        if (priorityA > priorityB) return 1;

        return 0;
    });
}

/**
 * ★ 8-2. 次のタスクを通知する関数
 */
function showNextTasksNotification() {
    // 既存のタイマーがあればクリア（連続で完了した場合に対応）
    if (notificationTimer) {
        clearTimeout(notificationTimer);
    }

    // 未完了タスクをフィルタリングしてソート
    const upcomingTasks = sortTasks(tasks.filter(t => !t.completed));

    // 表示するタスクがなければ何もしない
    if (upcomingTasks.length === 0) {
        return;
    }

    // 次のタスクを最大3件取得
    const tasksToShow = upcomingTasks.slice(0, 3);

    // リストを生成
    nextTaskList.innerHTML = '';
    tasksToShow.forEach(task => {
        const li = document.createElement('li');
        li.textContent = task.title;
        nextTaskList.appendChild(li);
    });

    // 通知を表示
    nextTaskNotification.classList.remove('hidden');
    // 少し遅延させてからvisibleクラスを追加し、CSSアニメーションをトリガー
    setTimeout(() => {
        nextTaskNotification.classList.add('visible');
    }, 10);

    // 5秒後に通知を非表示にする
    notificationTimer = setTimeout(() => {
        nextTaskNotification.classList.remove('visible');
        // アニメーションが終わるのを待ってからhiddenクラスを追加
        setTimeout(() => {
            nextTaskNotification.classList.add('hidden');
        }, 500); // CSSのtransition時間と合わせる
    }, 5000);
}

/**
 * 9-1. 期限切れタスクの数に応じてテーマを更新する関数
 */
function updateTheme() {
    const today = new Date();
    // 時刻情報をリセットして、日付のみで比較できるようにする
    today.setHours(0, 0, 0, 0);

    // 未完了かつ期限切れのタスクをカウント
    const overdueTasksCount = tasks.filter(task => {
        const dueDate = new Date(task.dueDate);
        return !task.completed && dueDate < today;
    }).length;

    const body = document.body;

    // 既存のテーマクラスを全て削除
    body.classList.remove('theme-warning', 'theme-alert');

    // 期限切れタスクの数に応じて新しいクラスを追加
    if (overdueTasksCount > 3) { // 4件以上で危険
        body.classList.add('theme-alert');
    } else if (overdueTasksCount > 0) { // 1件以上で警告
        body.classList.add('theme-warning');
    }
    // 0件の場合はクラスなし（デフォルトテーマ）
}

/**
 * タスクの完了状態を切り替える関数
 */
function toggleTaskComplete(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        const wasIncomplete = !task.completed;
        task.completed = !task.completed;

        if (wasIncomplete && task.completed) {
            showNextTasksNotification();
        }

        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks();
        updateTheme(); // ★ 9-1. テーマを更新
    }
}

/**
 * タスクを削除する関数
 */
function deleteTask(taskId) {
    if (confirm('このタスクを本当に削除しますか？')) {
        tasks = tasks.filter(t => t.id !== taskId);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks();
        updateTheme(); // ★ 9-1. テーマを更新
    }
}


/**
 * タスクリストを画面に表示する関数
 */
function renderTasks() {
    taskListContainer.innerHTML = '';
    const sortedTasks = sortTasks(tasks);

    if (sortedTasks.length === 0) {
        taskListContainer.innerHTML = '<p>登録されているタスクはありません。</p>';
        return;
    }

    const topPriorityTask = sortedTasks.find(task => !task.completed);

    sortedTasks.forEach(task => {
        const taskItem = document.createElement('div');
        taskItem.classList.add('task-item', `priority-${task.priority}`);
        if (task.completed) taskItem.classList.add('task-completed');
        if (topPriorityTask && task.id === topPriorityTask.id) {
            taskItem.classList.add('top-priority-task');
        }

        const taskDetails = document.createElement('div');
        taskDetails.classList.add('task-details');
		// ★ 6-4. タスク詳細部分にクリックイベントを追加
        taskDetails.addEventListener('click', () => showTaskDetails(task.id));

        const taskTitle = document.createElement('div');
        taskTitle.classList.add('task-title');
        taskTitle.textContent = task.title;
        const taskDueDate = document.createElement('div');
        taskDueDate.classList.add('task-due-date');
        taskDueDate.textContent = `期限: ${task.dueDate}`;
        taskDetails.appendChild(taskTitle);
        taskDetails.appendChild(taskDueDate);

        // ★ 7-1. ボタンをまとめるコンテナ
        const taskActions = document.createElement('div');
        taskActions.classList.add('task-actions');

        // 完了ボタン
        const completeButton = document.createElement('button');
        completeButton.classList.add('task-btn', 'complete-btn');
        completeButton.textContent = task.completed ? '戻す' : '完了';
        completeButton.addEventListener('click', () => toggleTaskComplete(task.id));

        // ★ 7-1. 変更ボタン
        const editButton = document.createElement('button');
        editButton.classList.add('task-btn', 'edit-btn');
        editButton.textContent = '変更';
        editButton.addEventListener('click', () => openTaskModal(task)); // ★ 7-2. 変更モードでモーダルを開く

        // ★ 7-1. 削除ボタン
        const deleteButton = document.createElement('button');
        deleteButton.classList.add('task-btn', 'delete-btn');
        deleteButton.textContent = '削除';
        deleteButton.addEventListener('click', () => deleteTask(task.id));

        // コンテナにボタンを追加
        taskActions.appendChild(completeButton);
        taskActions.appendChild(editButton);
        taskActions.appendChild(deleteButton);

        // 組み立て
        taskItem.appendChild(taskDetails);
        taskItem.appendChild(taskActions);
        taskListContainer.appendChild(taskItem);
    });
}


/**
 * 7-2. タスクモーダルを開く関数（新規・変更兼用）
 * @param {object | null} task - 変更するタスクのオブジェクト。新規の場合はnull
 */
function openTaskModal(task = null) {
    const modalTitle = taskModal.querySelector('h2');

    if (task) {
        // 変更モード
        modalTitle.textContent = 'タスクを変更';
        currentEditingTaskId = task.id; // 編集中のIDをセット
        taskTitleInput.value = task.title;
        taskDueDateInput.value = task.dueDate;
        taskPriorityInput.value = task.priority;
    } else {
        // 新規登録モード
        modalTitle.textContent = 'タスクを登録';
        currentEditingTaskId = null; // 編集中のIDをクリア
        taskTitleInput.value = '';
        taskDueDateInput.value = new Date().toISOString().split('T')[0];
        taskPriorityInput.value = 'medium';
    }
    taskModal.classList.remove('hidden');
}

function closeTaskModal() {
    taskModal.classList.add('hidden');
    currentEditingTaskId = null; // 閉じるときは必ず編集IDをクリア
}

/**
 * 7-4. タスクを保存または更新する関数
 */
function saveTask() {
    const title = taskTitleInput.value.trim();
    const dueDate = taskDueDateInput.value;
    const priority = taskPriorityInput.value;

    if (!title || !dueDate) {
        alert('タスク名と期限を入力してください。');
        return;
    }

    if (currentEditingTaskId) {
        // 更新処理
        const task = tasks.find(t => t.id === currentEditingTaskId);
        if (task) {
            task.title = title;
            task.dueDate = dueDate;
            task.priority = priority;
        }
    } else {
        // 新規保存処理
        const newTask = {
            id: Date.now(),
            title: title,
            dueDate: dueDate,
            priority: priority,
            completed: false
        };
        tasks.push(newTask);
    }

    localStorage.setItem('tasks', JSON.stringify(tasks));
    closeTaskModal();
    renderTasks();
    updateTheme(); // ★ 9-1. テーマを更新
}


// --- イベントリスナーの設定 ---
prevMonthButton.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    generateCalendar();
});
nextMonthButton.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    generateCalendar();
});

// 予定関連
addEventButton.addEventListener('click', () => openEventModal()); // ★引数なしで呼び出し
cancelEventButton.addEventListener('click', closeEventModal); // ★cancelButtonから名称変更
saveEventButton.addEventListener('click', saveEvent);
eventModal.addEventListener('click', (e) => {
    if (e.target === eventModal) closeEventModal();
});

// ★ 3-2. 予定詳細モーダルを閉じるイベントリスナー
closeDetailsButton.addEventListener('click', closeEventDetailsModal);
eventDetailsModal.addEventListener('click', (e) => {
    if (e.target === eventDetailsModal) {
        closeEventDetailsModal();
    }
});

// タスク関連
addTaskButton.addEventListener('click', () => openTaskModal());
cancelTaskButton.addEventListener('click', closeTaskModal);
saveTaskButton.addEventListener('click', saveTask);
taskModal.addEventListener('click', (e) => {
    if (e.target === taskModal) closeTaskModal();
});

// ★ 6-4. タスク詳細モーダルを閉じるイベントリスナー
closeTaskDetailsButton.addEventListener('click', closeTaskDetailsModal);
taskDetailsModal.addEventListener('click', (e) => {
    if (e.target === taskDetailsModal) {
        closeTaskDetailsModal();
    }
});

// --- 初期表示 ---
generateCalendar();
renderTasks(); // ★ページ読み込み時にタスクリストを初期表示
updateTheme(); // ★ 9-1. ページ読み込み時にテーマを初期設定