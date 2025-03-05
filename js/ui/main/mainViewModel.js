/*global $, Todoist, SelectViewState, ToastMessage, Log, MainState, ErrorState, EditTaskData, State, SAP, VIEW, MainMenuState, NavigationState, EditPageState, UpdateTaskCheckState*/

/*jshint unused: false*/

MainViewModel.COMPLETE_TASK_DELAY = 3000;

function MainViewModel(todoist, sap, settings) {
    var self = this;
    this._state = $.Deferred();
    this._sap = sap;
    this._settings = settings;
    this._isEditTask = false;
    this._checkTasksTimer = null;
    this._checkTasksList = [];
    this._editTaskData = null;
    this._taskMenuTaskId = null;
    this._lastSelectViewState = null;

    this._handleTodoistError = function (err) {
        switch (err) {
            case Todoist.ERRORS.AUTH_NEEDED:
                self._state.notify(new State(MainState.SHOW_CONNECT_TODOIST));
                break;
            case Todoist.ERRORS.OFFLINE:
                self.reloadView();
                break;
            default:
                Log.e(err);
                break;
        }
    };

    sap.onReceive = function (channelId, data) {
        switch (channelId) {
            case SAP.SERVICE_CHANNEL_ID:
                if (data === SAP.AUTH_NEEDED) {
                    self.client.accessToken = '';
                    self._state.notify(new State(MainState.SHOW_CONNECT_TODOIST));
                    return;
                }

                if (self.client.accessToken !== data) {
                    self.client.accessToken = data;
                    self.fullSync();
                }
                break;
        }
    };

    todoist.onerror = function (err) {
        if (err === Todoist.ERRORS.OFFLINE) {
            self._state.notify(new State(MainState.SHOW_NO_INTERNET));
        } else {
            self._state.notify(new State(ErrorState.ERROR, new ErrorState(err)));
        }
    };

    Object.defineProperties(this, {
        'client': {
            get: function () {
                return todoist;
            }
        },
        'state': {
            get: function () {
                return self._state.promise();
            }
        }
    });

}

MainViewModel.prototype._notify = function (id, data) {
    if (data instanceof SelectViewState) {
        this._lastSelectViewState = {id: id, data: data};
    }
    this._state.notify(new State(id, data));
};

MainViewModel.prototype.fullSync = function () {
    var self = this;

    this._notify(MainState.SHOW_FULL_SYNC);

    this.client.fullSync().then(function () {
        self.reloadView();
    }, function (err) {
        self._handleTodoistError(err);
    }, function () {
    });
};

MainViewModel.prototype.sync = function () {
    var self = this;

    this.client.sync().then(function () {
        self.reloadView();
    }, function (err) {
        self._handleTodoistError(err);
    }, function () {
    });
};

MainViewModel.prototype.onConnectTodoistConfirmed = function () {
    var self = this;
    this._sap.connectOnDeviceNotConnected = true;
    this._sap.sendData(SAP.SERVICE_CHANNEL_ID, SAP.AUTH_NEEDED).then(function () {
        self._sap.connectOnDeviceNotConnected = false;
    }, function (err) {
        Log.e('Send data back error: ' + err);
    });

};

MainViewModel.prototype.onConnectTodoistRejected = function () {
    this._notify(MainState.EXIT_APP);
};

MainViewModel.prototype._openProject = function (projectId) {
    var self = this;
    var prj;

    this._settings.selectedProjectId = projectId;
    this.client.getProjectById(projectId)
        .then(function (project) {
            if (!project) {
                self._showProjectsView();
                return;
            }
            prj = project;
            return self.client.getTasksByProjectId(project.id);
        }, function (err) {
            self._handleTodoistError(err);
        }, function () {
        })
        .then(function (tasks) {
            tasks.forEach(function (task) {
                task.project = prj;
            });
            self._notify(SelectViewState.SHOW_PROJECT_VIEW, new SelectViewState(tasks, [prj]));
        }, function (err) {
            self._handleTodoistError(err);
        }, function () {
        })
        ['catch'](
        function (err) {
            self._handleTodoistError(err);
        });
};

MainViewModel.prototype._openLabel = function (labelId) {
    var self = this;
    var lbl;

    this._settings.selectedLabelId = labelId;

    this.client.getLabelById(labelId)
        .then(function (label) {
            lbl = label;
            return self.client.getTasksByLabelId(label.name);
        }, function (err) {
            self._handleTodoistError(err);
        }, function () {
        })
        .then(function (tasks) {
            self._notify(SelectViewState.SHOW_LABEL_VIEW, new SelectViewState(tasks, [], [lbl]));
        }, function (err) {
            self._handleTodoistError(err);
        }, function () {
        })['catch'](
        function (err) {
            self._handleTodoistError(err);
        });
};

MainViewModel.prototype.onMainMenuClick = function () {
    var view = this._settings.defaultView;
    this._notify(MainMenuState.OPEN_MAIN_MENU,
        new MainMenuState(
            view !== VIEW.TODAY,
            view !== VIEW.NEXT_WEEK,
            view !== VIEW.PROJECTS || view === VIEW.PROJECTS && this._settings.selectedProjectId,
            view !== VIEW.LABELS || view === VIEW.LABELS && this._settings.selectedLabelId
        ));
};

MainViewModel.prototype.onContentClicked = function () {
    this._notify(EditPageState.OPEN_EDIT_CONTENT, new EditPageState(this._isEditTask, this._editTaskData.content));
};

MainViewModel.prototype.onContentTextChanged = function (text) {
    this._editTaskData.content = text;
    this._notify(EditPageState.UPDATE_CONTENT, new EditPageState(this._isEditTask, text));
};

MainViewModel.prototype.onContentTextChangeCancel = function () {

};

MainViewModel.prototype.onContentTextChangeError = function (err) {
    switch (err) {
        case "Please, install TypeGear from store. It's free.":
            this._notify(ErrorState.TYPE_GEAR_ERROR, new ErrorState());
            break;
        default:
            this._notify(ErrorState.ERROR, new ErrorState(err));
            break;
    }
    this._notify(EditPageState.OPEN_EDIT_PAGE, new EditPageState());
};

MainViewModel.prototype.onEditTaskConfirm = function () {
    var self = this;

    if (!this._editTaskData.content || this._editTaskData.content === '') {
        this._notify(ErrorState.EMPTY_TASK_CONTENT, new ErrorState());
        setTimeout(function () {
            self.back();
        }, ToastMessage.CLOSE_DELAY);
        return;
    }

    if (this._taskMenuTaskId) {
        this.client.updateTask(this._editTaskData).then(function () {
            self.reloadView();
        }, function (err) {
            self._handleTodoistError(err);
        });
    } else {
        this._notify(MainState.SHOW_CREATE_TASK_LOAD, new MainState());

        this.client.createTask(this._editTaskData, function () {
            self.reloadView();
        })
            .then(function () {
                    self.reloadView();
                },
                function () {
                    self.reloadView();
                });
    }
};

MainViewModel.prototype.onCreateTaskClick = function () {

    var defaultProject;
    var self = this;

    this._isEditTask = false;
    this._taskMenuTaskId = null;

    if (this._settings.selectedProjectId && this._settings.defaultView === VIEW.PROJECTS) {
        defaultProject = this._settings.selectedProjectId;
    } else {
        defaultProject = this.client.inboxId;
    }


    this.client.getProjectById(defaultProject).then(function (project) {
        // noinspection JSCheckFunctionSignatures
        self._notify(EditPageState.OPEN_EDIT_PAGE, new EditPageState(self._isEditTask, '', new Date(), project));

        // noinspection JSCheckFunctionSignatures
        self._editTaskData = new EditTaskData(null, '', project.id, new Date(), self.client.timezone);
    });
};

MainViewModel.prototype.onEditTaskClick = function () {

    var self = this;

    this._isEditTask = true;

    this.client.getTaskById(this._taskMenuTaskId).then(function (task) {
        self.client.getProjectById(task.project_id).then(function (project) {
            var date;
            if (task.due && task.due.date) {
                date = task.due;
            }
            self._editTaskData = new EditTaskData(task.id, task.content, task.project_id, self.client.parseDate(task.due), self.client.timezone);

            self._notify(EditPageState.OPEN_EDIT_PAGE, new EditPageState(self._isEditTask, task.content, date, project));
        }, function (err) {
            self._handleTodoistError(err);
        }, function () {
        });
    }, function (err) {
        self._handleTodoistError(err);
    }, function () {
    });
};

MainViewModel.prototype.onDeleteTaskClick = function () {
    this._notify(MainState.SHOW_DELETE_CONFIRMATION, new MainState());
};

MainViewModel.prototype.onDeleteTaskConfirmed = function () {
    var self = this;
    this.client.deleteTask(this._taskMenuTaskId).then(function () {
        self.reloadView();
    });
};

MainViewModel.prototype.onDeleteTaskCancel = function () {
    var self = this;
    setTimeout(function () {
        self.back();
    }, ToastMessage.CLOSE_DELAY);
};

MainViewModel.prototype.onSettingsClick = function () {
    this._notify(NavigationState.OPEN_SETTINGS_PAGE, new NavigationState());
};

MainViewModel.prototype.onTaskDateChanged = function (date) {
    this._notify(EditPageState.UPDATE_DATE, new EditPageState(this._isEditTask, null, date));
    this._editTaskData.dueDate = date;
};

MainViewModel.prototype.onTaskPostpone = function (date) {
    var task;
    var self = this;

    this.client.getTaskById(this._taskMenuTaskId).then(function (t) {
        task = t;
        return self.client.getProjectById(task.project_id);
    })
        .then(function () {
            self._editTaskData = new EditTaskData(task.id, task.content, task.project_id, date, self.client.timezone);
            self.client.updateTask(self._editTaskData)
                .then(function () {
                    self.reloadView();
                }, function (err) {
                    self._handleTodoistError(err);
                }, function () {
                });
        }, function (err) {
            self._handleTodoistError(err);
        }, function () {
        });
};

MainViewModel.prototype.onConfirmProject = function (id) {

    var self = this;

    this._settings.selectedProjectId = id;
    this._editTaskData.newProjectId = id;
    this.client.getProjectById(id).then(function (project) {
        self._notify(EditPageState.UPDATE_PROJECT, new EditPageState(self._isEditTask, null, null, project));
    }, function (err) {
        self._handleTodoistError(err);
    }, function () {
    });
};

MainViewModel.prototype.onPickTaskDateClick = function () {
    this._notify(NavigationState.PICK_TASK_DATE_PAGE, new NavigationState());
};

MainViewModel.prototype.onPickTaskProjectsClick = function () {

    var self = this;

    this.client.getProjects()
        .then(function (projects) {
            if (self._taskMenuTaskId !== null) {
                self.client.getTaskById(self._taskMenuTaskId).then(function (task) {
                    self._editTaskData.newProjectId = task.project_id;
                    self._notify(NavigationState.PICK_PROJECTS_PAGE, new NavigationState(task.projectId, projects));
                });
            } else {
                if (projects) {
                    self._notify(NavigationState.PICK_PROJECTS_PAGE, new NavigationState(self.client.inboxId, projects));
                }
            }
        });
};

MainViewModel.prototype._completeTasks = function () {
    var self = this;
    var dfd = $.Deferred();

    var defers = this._checkTasksList.map(function (taskId) {
        return self._completeTask(taskId);
    });

    $.when.apply($, defers)
        .done(function () {
            self.reloadView();
        });

    dfd.resolve();
};

MainViewModel.prototype._completeTask = function (taskId) {
    var self = this;
    var d = $.Deferred();


    this.client.checkTask(taskId, function (err) {
        self._handleTodoistError(err);
    }).then(function () {
        d.resolve();
    }, function (err) {
        self._handleTodoistError(err);
    });

    d.resolve();
    return d.promise();
};

MainViewModel.prototype.onChangeChecked = function (taskId) {
    var self = this;
    var d = $.Deferred();

    this.client.getTaskById(taskId)
        .then(function (task) {

            switch (task.checked) {
                case 1:
                    task.checked = 0;

                    self.client.setTask(task)
                        .then(function () {
                            for (var i = 0; i < self._checkTasksList.length; i++) {
                                if (self._checkTasksList[i] === taskId.toString()) {
                                    self._checkTasksList.splice(i, 1);
                                    break;
                                }
                            }
                            if (self._checkTasksList.length === 0) {
                                if (self._checkTasksTimer) {
                                    clearTimeout(self._checkTasksTimer);
                                }
                            } else {
                                self._setCompleteTimer();
                            }
                            d.resolve();
                            self._notify(UpdateTaskCheckState.TASK_UNCHECK, new UpdateTaskCheckState(task));
                        });
                    break;
                case 0:
                    task.checked = 1;

                    self.client.setTask(task).then(function () {
                        self._checkTasksList.push(task.id);
                        self._setCompleteTimer();
                        d.resolve();
                        self._notify(UpdateTaskCheckState.TASK_CHECK, new UpdateTaskCheckState(task));
                    });
                    break;
            }
        });

    return d.promise();
};

MainViewModel.prototype._setCompleteTimer = function () {
    var self = this;

    if (this._checkTasksTimer) {
        clearTimeout(this._checkTasksTimer);
    }

    this._checkTasksTimer = setTimeout(function () {
        self._completeTasks();
    }, MainViewModel.COMPLETE_TASK_DELAY);

};

MainViewModel.prototype._showTodayView = function () {
    var self = this;

    this._settings.selectedProjectId = null;
    this._settings.selectedLabelId = null;
    this._settings.defaultView = VIEW.TODAY;

    this.client
        .getTodayTasks()
        .then(function (tasks) {
            self._notify(SelectViewState.SHOW_TODAY_VIEW, new SelectViewState(tasks));
            self._notify(MainState.HIDE_LOAD, new MainState());
        }, function (err) {
            self._handleTodoistError(err);
        }, function () {
        });
};

MainViewModel.prototype._showNextWeekView = function () {
    var self = this;

    this._settings.selectedProjectId = null;
    this._settings.selectedLabelId = null;
    this._settings.defaultView = VIEW.NEXT_WEEK;

    this.client
        .getNextTasks()
        .then(function (tasks) {
            self._notify(SelectViewState.SHOW_NEXT_VIEW, new SelectViewState(tasks));
            self._notify(MainState.HIDE_LOAD, new MainState());
        }, function (err) {
            self._handleTodoistError(err);
        }, function () {
        });
};

MainViewModel.prototype._showProjectsView = function () {
    var self = this;

    this._settings.defaultView = VIEW.PROJECTS;
    this._settings.selectedProjectId = null;

    this.client.getProjectsWithTaskCount()
        .then(function (projects) {
            self._notify(SelectViewState.SHOW_PROJECTS_VIEW, new SelectViewState([], projects, []));
            self._notify(MainState.HIDE_LOAD, new MainState());
        }, function (err) {
            self._handleTodoistError(err);
        }, function () {
        });
};

MainViewModel.prototype._showLabelsView = function () {

    var self = this;

    this._settings.selectedLabelId = null;
    this._settings.defaultView = VIEW.LABELS;

    this.client.getLabelsWithTaskCount().then(function (labels) {
        self._notify(SelectViewState.SHOW_LABELS_VIEW, new SelectViewState([], [], labels));
        self._notify(MainState.HIDE_LOAD, new MainState());
    }, function (err) {
        self._handleTodoistError(err);
    }, function () {
    });
};

MainViewModel.prototype.onTodayViewClick = function () {
    this._notify(MainState.SHOW_LOAD, new MainState());
    this._showTodayView();
};

MainViewModel.prototype.onNextWeekViewClick = function () {
    this._notify(MainState.SHOW_LOAD, new MainState());
    this._showNextWeekView();
};

MainViewModel.prototype.onProjectsViewClick = function () {
    this._settings.selectedProjectId = null;
    this._notify(MainState.SHOW_LOAD, new MainState());
    this._showProjectsView();
};

MainViewModel.prototype.onLabelsViewClick = function () {
    this._settings.selectedLabelId = null;
    this._notify(MainState.SHOW_LOAD, new MainState());
    this._showLabelsView();
};

MainViewModel.prototype.onOpenProjectClick = function (id) {
    this._settings.selectedProjectId = id;
    this._notify(MainState.SHOW_LOAD, new MainState());
    this._openProject(id);
};

MainViewModel.prototype.onOpenLabelClick = function (id) {
    this._settings.selectedLabelId = id;
    this._notify(MainState.SHOW_LOAD, new MainState());
    this._openLabel(id);
};

MainViewModel.prototype.reloadView = function () {
    switch (this._settings.defaultView) {
        case VIEW.TODAY:
            this._showTodayView();
            break;
        case VIEW.NEXT_WEEK:
            this._showNextWeekView();
            break;
        case VIEW.PROJECTS:
            if (this._settings.selectedProjectId) {
                this.onOpenProjectClick(this._settings.selectedProjectId);
            } else {
                this._showProjectsView();
            }
            break;
        case VIEW.LABELS:
            if (this._settings.selectedLabelId) {
                this.onOpenLabelClick(this._settings.selectedLabelId);
            } else {
                this._showLabelsView();
            }
            break;
    }
};

MainViewModel.prototype.onTaskClick = function (taskId) {
    this._taskMenuTaskId = taskId;
    this._notify(MainState.SHOW_TASK_MENU, new MainState());
};

MainViewModel.prototype.back = function () {
    this._notify(this._lastSelectViewState.id, this._lastSelectViewState.data);
};