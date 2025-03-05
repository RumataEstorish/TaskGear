/*global MainViewModel, SelectViewState, MainModule, Colors, MainState, ErrorState, NavigationState, EditPageState, MainMenuState, UpdateTaskCheckState, VIEW, Log, List, tau, $, GearHttp, Utils, Input, KeyboardModes, SAP, Todoist, ToastMessage, ActionMenu, LANG_JSON_DATA, EditTaskData, ContextMenu, SORT_ORDER, translateUI, tizen, Settings*/
/*jshint unused: false*/
/*jslint laxbreak: true*/
/*jshint loopfunc: true */

var SORT_CREATED_FIRST = 'SORT_CREATED_FIRST';
var sap = null;
var client = null;
var toastMessage = null;

var currentView = VIEW.TODAY;
var mainMenu = null;
var taskMenu = null;
var settings = null;
var list = null;
var pickProjectsList = null;
var viewModel = null;
var mainModule = null;


function changeTasksPage() {
    var d = $.Deferred();

    $('#transitionPage').one('pageshow', function () {
        tau.changePage('#tasksPage', {transition: 'none'});
    });

    $('#tasksPage').one('pageshow', function () {
        d.resolve();
    });

    tau.changePage('#transitionPage');

    return d.promise();
}

/**
 * Converts date to display
 *
 * @param due - task.due.date
 */
function dateToDisplay(due) {
    if (client.isToday(due)) {
        return LANG_JSON_DATA.TODAY;
    }
    if (client.isTomorrow(due)) {
        return LANG_JSON_DATA.TOMORROW;
    }

    return client.toDisplayDate(due);
}

function openMainMenuClick() {
    viewModel.onMainMenuClick();
}

function editTaskContentClick() {
    viewModel.onContentClicked();
}

function editTaskContent(text) {
    var input = new Input(mainModule.model);
    input.open(text, LANG_JSON_DATA.ENTER_TASK_CONTENT, KeyboardModes.SINGLE_LINE, function (txt) {
        viewModel.onContentTextChanged(txt);
    }, function () {
        viewModel.onContentTextChangeCancel();
    }, function (e) {
        viewModel.onContentTextChangeError(e);
    });
}

function editTaskConfirm() {
    viewModel.onEditTaskConfirm();
}


function getDateFromPage(val) {
    var date = tizen.time.getCurrentDateTime();
    switch (val) {
        case "TODAY":
            return date;
        case "TOMORROW":
            return date.addDuration(new tizen.TimeDuration(1, "DAYS"));
        case "NEXT_WEEK":
            return date.addDuration(new tizen.TimeDuration(7 - date.getDay() + 1, "DAYS"));
        case "REMOVE":
            return null;
    }
}

function confirmDate(val) {
    var date = getDateFromPage(val);
    viewModel.onTaskDateChanged(date);
    tau.changePage('#taskEditPage');
}

function pickDate() {
    var dateInput = $('#dateInput');
    dateInput.one("change", function () {
        viewModel.onTaskDateChanged(dateInput.val());
        tau.changePage('#taskEditPage');
    });
    // noinspection JSCheckFunctionSignatures
    dateInput.trigger("click");
}

function pickDatePostpone() {
    var dateInput = $('#dateInput');

    dateInput.one("change", function () {
        viewModel.onTaskPostpone($("#dateInput").val());
    });
    // noinspection JSCheckFunctionSignatures
    dateInput.trigger("click");
}

function postponeDate(val) {
    var date = getDateFromPage(val);
    viewModel.onTaskPostpone(date);
}

function confirmProject(id) {
    var inputs = $('#pickProjectsPage input');
    for (var i = 0; i < inputs.length; i++) {
        var input = inputs.eq(i);
        if (input.id !== id) {
            input.prop('checked', false);
        }
    }
    viewModel.onConfirmProject(id);

    tau.changePage('#taskEditPage');
}

function pickTaskProject() {
    viewModel.onPickTaskProjectsClick();
}

function pickTaskProjectsPage(selectedProjectId, projects) {

    pickProjectsList.empty();


    var items = projects.map(function (project) {
        var item;
        if (selectedProjectId === project.id) {
            item = $('<li class="li-has-radio" onclick="confirmProject(\'' + project.id + '\')">' +
                '<label>' +
                parseProjectIndent(project.level) + ' ' + parseProjectName(project.name) +
                '<input type="radio" id="' + project.id + '" value="' + project.name + '" checked="checked"/>' +
                '</label>' +
                '</li>');
        } else {
            item = $('<li class="li-has-radio" onclick="confirmProject(\'' + project.id + '\')">' +
                '<label>' +
                parseProjectIndent(project.level) + ' ' + parseProjectName(project.name) +
                '<input type="radio" id="' + project.id + '" value="' + project.name + '"/>' +
                '</label>' +
                '</li>'
            );
        }
        item.css("padding-left", (project.level) * 20 + "px");
        return item;
    });

    $('#pickProjectsPage').one('pageshow', function () {
        items.forEach(function (item) {
            pickProjectsList.append(item);
        });
    });
    tau.changePage("#pickProjectsPage");
}

function pickTaskDate() {
    viewModel.onPickTaskDateClick();
}

function parseProjectName(name) {
    return name !== client.inboxName ? name : LANG_JSON_DATA.INBOX;
}

// noinspection JSUnusedLocalSymbols
function showLoad(message) {
    tau.changePage('#smallProcessingPage');
}

function hideLoad() {
    if (tau.support.shape.circle) {
        $('#taskProcessing').hide();
    } else {
        tau.changePage('#tasksPage');
    }
}

function postponeTask() {
    tau.changePage("#postponePage");
}

function getPriorityImage(task) {
    switch (task.priority) {
        case 2:
            switch (task.checked) {
                case 1:
                    return '../../../images/checkmarks/checked_p2.png';
                case 0:
                    return '../../../images/checkmarks/unchecked_p2.png';
            }
            break;
        case 3:
            switch (task.checked) {
                case 1:
                    return '../../../images/checkmarks/checked_p3.png';
                case 0:
                    return '../../../images/checkmarks/unchecked_p3.png';
            }
            break;
        case 4:
            switch (task.checked) {
                case 1:
                    return '../../../images/checkmarks/checked_p4.png';
                case 0:
                    return '../../../images/checkmarks/unchecked_p4.png';
            }
            break;
        default:
            switch (task.checked) {
                case 1:
                    return '../../../images/checkmarks/checked_p1.png';
                case 0:
                    return '../../../images/checkmarks/unchecked_p1.png';
            }
            break;
    }
}

var taskChecked = false;

function checkTask(taskId) {
    taskChecked = true;
    viewModel.onChangeChecked(taskId);
}

function clickTask(taskId) {
    if (taskChecked) {
        taskChecked = false;
        return;
    }
    viewModel.onTaskClick(taskId);
}

function getTaskListItem(task, project) {

    var taskId = "'" + task.id + "'";
    var itemCheck = '<img alt="complete task" onclick="checkTask(' + taskId + ')" class="ui-li-thumb-left" src="' + getPriorityImage(task) + '"/>';
    var item;
    var content = client.getTaskContent(task);
    var dateSpan = '';
    var projectSpan = '';
    var timeSpan = '';


    if (task.parent_id) {
        content = parseProjectIndent(task.level) + ' ' + content;
    }

    if (task.isOverdue) {
        dateSpan = '<span style="color: red" class="ui-li-sub-text li-text-sub task-item">' + client.toDisplayDate(task.due) + '</span>';
    }

    if (!task.isOverdue) {
        if (task.due && task.due.date && currentView !== VIEW.TODAY) {
            var date = dateToDisplay(task.due);
            dateSpan = '<span class="ui-li-sub-text li-text-sub task-item">' + date + '</span>';
        }
        if (task.due && task.due.date && task.due.date.indexOf('T') !== -1) {
            timeSpan = '<span class="ui-li-sub-text li-text-sub task-item">' + client.toDisplayTime(task.due) + '</span>';
        }
    }

    var labels = '';

    if (task.labels) {
        labels = task.labels.map(function (label) {
            return '@' + label;
        });
    }

    if (project && currentView !== VIEW.PROJECTS) {
        if (!task.labels || task.labels.length === 0 || currentView === VIEW.LABELS) {
            projectSpan = '<span class="ui-li-sub-text li-text-sub task-item">' + parseProjectName(project.name) + '</span>';
        } else if (currentView !== VIEW.LABELS) {
            projectSpan = '<span class="ui-li-sub-text li-text-sub task-item">' + parseProjectName(project.name) + ' / ' + labels + '</span>';
        }
    } else {
        if (task.labels && task.labels.length > 0 && currentView !== VIEW.LABELS) {
            projectSpan = '<span class="ui-li-sub-text li-text-sub task-item">' + labels + '</span>';
        }
    }

    var multilineCount = 0;
    if (dateSpan !== '') {
        multilineCount++;
    }
    if (timeSpan !== '') {
        multilineCount++;
    }
    if (projectSpan !== '') {
        multilineCount++;
    }

    if (multilineCount === 0) {
        item = $('<li onclick="clickTask(' + taskId + ')" class="li-has-thumb-left" id="' + taskId + '">' +
            '<a>' +
            content +
            itemCheck +
            '</a>' +
            '</li>');
    } else {
        item = $('<li class="li-has-thumb-left" onclick="clickTask(' + taskId + ')" id="' + taskId + '">' +
            content +
            dateSpan +
            timeSpan +
            projectSpan +
            itemCheck +
            '</li>');

        item.addClass('li-has-multiline');
    }

    switch (multilineCount) {
        case 2:
            item.addClass('li-has-2line-sub');
            break;
        case 3:
            item.addClass('li-has-3line-sub');
            break;
    }

    return item;
}

function fillTasks(tasks) {
    var item = null;

    list.empty();
    tasks.forEach(
        function (task) {

            item = getTaskListItem(task, task.project);

            list.append(item);
        });
}

function openProject(id) {
    viewModel.onOpenProjectClick(id);
}

function showProject(project, tasks) {
    $("#tasksPage h2").html(parseProjectName(project.name));
    changeTasksPage()
        .then(function () {
            fillTasks(tasks);
        });
}

function showLabel(label, tasks) {
    $("#tasksPage h2").html(label.name);

    changeTasksPage()
        .then(function () {
            fillTasks(tasks);
        });
}

function openLabel(id) {
    viewModel.onOpenLabelClick(id);
}

function parseProjectIndent(ident) {
    switch (parseInt(ident, 0)) {
        case 1:
            return '╺';
        case 2:
            return '╺╺';
        case 3:
            return '╺╺╺';
        case 4:
            return '╺╺╺╺';
        default:
            return '';
    }
}

function showProjects(projects) {
    var colors = new Colors();
    $('#tasksPage h2').html(LANG_JSON_DATA.PROJECTS);

    changeTasksPage()
        .then(function () {

            list.empty();

            projects.forEach(function (result) {
                var item = $('<li class="li-has-multiline li-has-thumb-left" id="' + result.project.id + '" onclick="openProject(this.id, true)">' +
                    '<a>' +
                    parseProjectIndent(result.project.level) + ' ' + parseProjectName(result.project.name) +
                    '<span class="ui-li-sub-text li-text-sub">' + LANG_JSON_DATA.TASKS + ': ' + result.count + '</span>' +
                    '<img alt="project" src="' + colors.getProjectImage(result.project) + '" class="ui-li-thumb-left"/>' +
                    '</a>' +
                    '</li>');
                item.css("padding-left", (result.project.level) * 20 + "px");
                list.add(item);
            });
        });
}

function showLabels(labels) {
    var colors = new Colors();
    $('#tasksPage h2').html(LANG_JSON_DATA.LABELS);

    changeTasksPage()
        .then(function () {
            list.empty();

            labels.forEach(function (result) {
                var item = $('<li class="li-has-multiline li-has-thumb-left" id="' + result.label.id + '" onclick="openLabel(this.id, true)">' +
                    '<a>' + result.label.name +
                    '<span class="ui-li-sub-text li-text-sub">' + LANG_JSON_DATA.TASKS + ': ' + result.count + '</span>' +
                    '<img alt="label" src="' + colors.getLabelColor(result.label) + '" class="ui-li-thumb-left"/>' +
                    '</a>' +
                    '</li>');
                list.add(item);
            });
        });
}

function showTodayView(tasks) {
    $('#tasksPage h2').html(LANG_JSON_DATA.TODAY);
    changeTasksPage().then(
        function () {
            fillTasks(tasks);
        });
}

function showNextWeekView(tasks) {
    $('#tasksPage h2').html(LANG_JSON_DATA.NEXT_7_DAYS);
    changeTasksPage()
        .then(function () {
            fillTasks(tasks);
        });
}

function exitApp() {
    sap.close();
    tizen.application.getCurrentApplication().exit();
}

function initMainMenu() {
    mainMenu = new ActionMenu('mainMenuPage', 'mainMenu', [
        {
            name: 'createTaskMenu',
            title: LANG_JSON_DATA.CREATE_TASK,
            image: '/images/add.png',
            navigateTo: 'smallProcessingPage',
            onclick: function () {
                viewModel.onCreateTaskClick();
            }
        },
        {
            name: 'todayViewMenu',
            title: LANG_JSON_DATA.TODAY,
            image: '/images/today.png',
            navigateTo: 'smallProcessingPage',
            onclick: function () {
                $('#tasksPage h2').html(LANG_JSON_DATA.TODAY);
                viewModel.onTodayViewClick();
            }
        },
        {
            name: 'nextWeekViewMenu',
            title: LANG_JSON_DATA.NEXT_7_DAYS,
            image: '/images/next.png',
            navigateTo: 'smallProcessingPage',
            onclick: function () {
                $('#tasksPage h2').html(LANG_JSON_DATA.NEXT_7_DAYS);
                viewModel.onNextWeekViewClick();
            }
        },
        {
            name: 'projectsViewMenu',
            title: LANG_JSON_DATA.PROJECTS,
            image: '/images/projects.png',
            navigateTo: 'smallProcessingPage',
            onclick: function () {
                $('#tasksPage h2').html(LANG_JSON_DATA.PROJECTS);
                viewModel.onProjectsViewClick();
            }
        },
        {
            name: 'labelsViewMenu',
            title: LANG_JSON_DATA.LABELS,
            image: '/images/tag.png',
            navigateTo: 'smallProcessingPage',
            onclick: function () {
                $('#tasksPage h2').html(LANG_JSON_DATA.LABELS);
                viewModel.onLabelsViewClick();
            }
        },
        {
            name: 'syncMenu',
            title: LANG_JSON_DATA.SYNC,
            image: 'images/sync.png',
            navigateTo: 'smallProcessingPage',
            onclick: function () {
                viewModel.sync();
            }
        },
        {
            name: 'settingsMenu',
            title: LANG_JSON_DATA.SETTINGS,
            image: '/images/settings.png',
            onclick: function () {
                viewModel.onSettingsClick();
            }
        }
    ]);
}

function initTaskMenu() {
    taskMenu = new ActionMenu('taskMenuPage', 'taskMenu', [
        {
            name: 'postponeTaskMenu',
            title: LANG_JSON_DATA.POSTPONE,
            image: '/images/postpone.png',
            onclick: postponeTask
        },
        {
            name: 'editTaskMenu',
            title: LANG_JSON_DATA.EDIT,
            image: '/images/edit.png',
            onclick: function () {
                viewModel.onEditTaskClick();
            }
        },
        {
            name: 'deleteTaskMenu',
            title: LANG_JSON_DATA.DELETE,
            image: '/images/delete.png',
            onclick: function () {
                viewModel.onDeleteTaskClick();
            }
        }
    ]);

}

function handleMainState(state) {
    switch (state.id) {
        case MainState.EXIT_APP:
            exitApp();
            break;
        case MainState.SHOW_TASK_MENU:
            taskMenu.show();
            break;
        case MainState.SHOW_CONNECT_TODOIST:
            if (!confirm(LANG_JSON_DATA.CONNECT_TODOIST)) {
                viewModel.onConnectTodoistRejected();
            } else {
                viewModel.onConnectTodoistConfirmed();
            }
            break;
        case MainState.SHOW_CREATE_TASK_LOAD:
            showLoad(LANG_JSON_DATA.CREATING_TASK + '...');
            break;
        case MainState.SHOW_FULL_SYNC:
            showLoad(LANG_JSON_DATA.SYNCHRONIZATION);
            break;
        case MainState.SHOW_NO_INTERNET:
            break;
        case MainState.SHOW_LOAD:
            showLoad();
            break;
        case MainState.HIDE_LOAD:
            hideLoad();
            break;
        case MainState.SHOW_DELETE_CONFIRMATION:
            if (confirm(LANG_JSON_DATA.DELETE_TASK_CONFIRM)) {
                viewModel.onDeleteTaskConfirmed();
            } else {
                viewModel.onDeleteTaskCancel();
            }
            break;
    }
}

function handleSelectViewState(state) {
    switch (state.id) {
        case SelectViewState.SHOW_TODAY_VIEW:
            currentView = VIEW.TODAY;
            showTodayView(state.data.tasks);
            break;

        case SelectViewState.SHOW_NEXT_VIEW:
            currentView = VIEW.NEXT_WEEK;
            showNextWeekView(state.data.tasks);
            break;

        case SelectViewState.SHOW_PROJECT_VIEW:
            currentView = VIEW.PROJECTS;
            showProject(state.data.projects[0], state.data.tasks);
            break;

        case SelectViewState.SHOW_LABEL_VIEW:
            currentView = VIEW.LABELS;
            showLabel(state.data.labels[0], state.data.tasks);
            break;

        case SelectViewState.SHOW_LABELS_VIEW:
            currentView = VIEW.LABELS;
            showLabels(state.data.labels);
            break;

        case SelectViewState.SHOW_PROJECTS_VIEW:
            currentView = VIEW.PROJECTS;
            showProjects(state.data.projects);
            break;
    }
}

function handleErrorState(state) {
    switch (state.id) {
        case ErrorState.ERROR:
            toastMessage.show(state.data.error);
            break;
        case ErrorState.TYPE_GEAR_ERROR:
            toastMessage.show(LANG_JSON_DATA.NO_TYPEGEAR);
            break;
        case ErrorState.EMPTY_TASK_CONTENT:
            toastMessage.show(LANG_JSON_DATA.EMPTY_CONTENT);
            break;
    }
}

function handleMainMenuState(state) {
    switch (state.id) {
        case MainMenuState.OPEN_MAIN_MENU:
            mainMenu.setMenuItemVisibility('todayViewMenu', state.data.isTodayVisible);
            mainMenu.setMenuItemVisibility('nextWeekViewMenu', state.data.isNextWeekVisible);
            mainMenu.setMenuItemVisibility('projectsViewMenu', state.data.isProjectsVisible);
            mainMenu.setMenuItemVisibility('labelsViewMenu', state.data.isLabelsVisible);

            mainMenu.show();
            break;
    }
}

function handleNavigationState(state) {
    switch (state.id) {
        case NavigationState.OPEN_SETTINGS_PAGE:
            tau.changePage("#settingsPage");
            break;

        case NavigationState.PICK_TASK_DATE_PAGE:
            tau.changePage("#dueDatePage");
            break;

        case NavigationState.PICK_PROJECTS_PAGE:
            pickTaskProjectsPage(state.data.selectedProjectId, state.data.projects);
            break;
    }
}

function handleEditPageState(state) {
    switch (state.id) {
        case EditPageState.OPEN_EDIT_PAGE:
            if (state.data.isEdit === true) {
                $('#taskEditPage h2').html(LANG_JSON_DATA.EDIT);
            } else {
                $('#taskEditPage h2').html(LANG_JSON_DATA.CREATE_TASK);
            }
            if (state.data.content) {
                $("#taskContent span").html(state.data.content);
            }
            if (state.data.project) {
                $("#taskProject span").html(parseProjectName(state.data.project.name));
            }
            if (state.data.date) {
                $("#taskDate span").html(dateToDisplay(state.data.date));
            }
            $('#taskEditPage').one('pageshow', function () {
                editTaskContent(state.data.content);
            });
            tau.changePage('#taskEditPage');
            break;
        case EditPageState.OPEN_EDIT_CONTENT:
            editTaskContent(state.data.content);
            break;
        case EditPageState.UPDATE_CONTENT:
            $('#taskContent span').html(state.data.content);
            break;
        case EditPageState.UPDATE_DATE:
            $('#taskDate span').html(dateToDisplay(state.data.date));
            break;
        case EditPageState.UPDATE_PROJECT:
            $('#taskProject span').html(parseProjectName(state.data.project.name));
            break;
    }
}

function handleUpdateTaskCheckState(state) {
    //var content = list.getRootItemById(id);
    if (state.id === UpdateTaskCheckState.TASK_CHECK || state.id === UpdateTaskCheckState.TASK_UNCHECK) {
        var check = list.getImageByRootId(state.data.task.id);
        check.prop('src', getPriorityImage(state.data.task));
    }
}

window.onload = function () {

    Log.DEBUG = false;

    var tasksPage = $('#tasksPage');

    list = new List(tasksPage);
    pickProjectsList = new List($('#pickProjectsPage'));

    try {
        var settingsPage = $('#settingsPage');

        toastMessage = new ToastMessage("#popupToast", "#popupToastContent");

        initMainMenu();

        initTaskMenu();

        translateUI();


        settingsPage.on('pagebeforeshow', function () {
            $('#sortCreated span').html(client.sortCreated === SORT_ORDER.ASCENDING ? LANG_JSON_DATA.ASCENDING : LANG_JSON_DATA.DESCENDING);
        });

        $('#sortCreated').parent().on('click', function () {
            if (client.sortCreated === SORT_ORDER.ASCENDING) {
                client.sortCreated = SORT_ORDER.DESCENDING;
            } else {
                client.sortCreated = SORT_ORDER.ASCENDING;
            }
            $('#sortCreated span').html(client.sortCreated === SORT_ORDER.ASCENDING ? LANG_JSON_DATA.ASCENDING : LANG_JSON_DATA.DESCENDING);
        });


        settingsPage.on('pagebeforehide', function () {
            client.sortCreatedFirst = $('#sortCreatedFirst input').prop('checked');
        });

        $('#fullSync').on('click', function () {
            viewModel.fullSync();
        });

        tasksPage.on("pagebeforeshow", function () {
            $('#taskProcessing').hide();
        });

        settings = new Settings(function () {

            mainModule = new MainModule().then(function (module) {
                viewModel = new MainViewModel(module.todoist, module.sap, settings);
                client = module.todoist;
                sap = module.sap;

                $('#sortCreatedFirst input').prop('checked', client.sortCreatedFirst);

                // Fixed inital settings state
                $('#sortCreated span').html(client.sortCreated === SORT_ORDER.ASCENDING ? LANG_JSON_DATA.ASCENDING : LANG_JSON_DATA.DESCENDING);

                client.onerror = function (err) {
                    if (err === Todoist.ERRORS.OFFLINE) {
                        toastMessage.show(LANG_JSON_DATA.NO_INTERNET);
                    }
                    toastMessage.show(err);
                };

                viewModel.state.progress(function (state) {
                    handleMainState(state);
                    handleSelectViewState(state);
                    handleErrorState(state);
                    handleMainMenuState(state);
                    handleNavigationState(state);
                    handleEditPageState(state);
                    handleUpdateTaskCheckState(state);
                });

                viewModel.sync();
            });

        });


        // add eventListener for tizenhwkey
        document.addEventListener('tizenhwkey', function (e) {
            if (mainMenu.isOpened === true) {
                mainMenu.close(null, 'smallProcessingPage');
                viewModel.back();
                return;
            }
            if (taskMenu.isOpened === true) {
                taskMenu.close(null, 'smallProcessingPage');
                viewModel.back();
                return;
            }
            if (e.keyName === "back") {
                switch (Utils.getActivePage()) {
                    case "postponePage":
                        tau.changePage("#tasksPage");
                        break;
                    case "pickProjectsPage":
                    case "dueDatePage":
                        tau.changePage("#taskEditPage");
                        break;
                    case "tasksPage":
                        exitApp();
                        break;
                    case "taskEditPage":
                        viewModel.reloadView();
                        break;
                    case "settingsPage":
                        viewModel.reloadView();
                        break;
                    case "smallProcessingPage":
                        exitApp();
                        break;
                }
            }
        });
    } catch
        (e) {
        Log.e(e);
    }
};
