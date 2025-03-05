/*global Todoist, Utils, Dexie, $, Tree, SORT_ORDER*/
/*jslint laxbreak: true*/
Todoist.prototype.getTasks = function (sync) {
    var self = this, d = $.Deferred();

    self.db.tasks.count(function (count) {
        if (count > 0 && !sync) {
            self.db.tasks.where('checked').notEqual(1).toArray(function (tasks) {
                d.resolve(self.tasksFromTree(tasks));
            });
            return;
        }
        self.request("[\"items\"]", self.syncToken).then(function (response) {
            // noinspection JSUnresolvedVariable
            self.syncToken = response.sync_token;
            self.setTasks(response.items).then(function (tasks) {
                d.resolve(self.tasksFromTree(tasks));
            }, function (err) {
                d.reject(err);
            });
        }, function (err) {
            d.reject(err);
        });
    });
    return d.promise();
};

Todoist.prototype.prepareTask = function (task) {
    if (task.due && task.due.date) {
        var date = Date.parseWithTimeZone(task.due.date);
        if (task.due.date.indexOf('T') !== 0) {
            date.setHours(0);
            date.setMinutes(0);
            date.setSeconds(0);
        }
        task.due_date_parsed = date.getTime();
        task.haveTime = task.due.date.indexOf('T') >= 0;
    } else {
        task.haveTime = false;
        task.due_date_parsed = 0;
    }
    task.isOverdue = false;

    if (task.checked === true) {
        task.checked = 1;
    }
    if (task.checked === false) {
        task.checked = 0;
    }

    if (task.is_deleted === true) {
        task.is_deleted = 1;
    }
    if (task.is_deleted === false) {
        task.is_deleted = 0;
    }

    // noinspection JSUnresolvedVariable
    if (task.added_at) {
        task.date_added_parsed = new Date.parseWithTimeZone(task.added_at).getTime();
    }
};

Todoist.prototype.setTask = function (task) {
    var self = this, d = $.Deferred();

    if (!task) {
        d.reject('Task not set');
        return d.promise();
    }

    this.prepareTask(task);
    self.db.tasks.put(task).then(function () {
        self.filterTasks().then(function (task) {
            d.resolve(task);
        });
    })['catch'](Dexie.Error, function (err) {
        d.reject(err);
    });
    return d.promise();
};

Todoist.prototype.setTasks = function (tasks) {
    var self = this, d = $.Deferred();

    if (!tasks) {
        d.resolve();
        return d.promise();
    }

    if (!Array.isArray(tasks)) {
        tasks = [tasks];
    }

    tasks.forEach(function (task) {
        try {
            self.prepareTask(task);
        } catch (e) {
            d.reject(e);
        }
    });

    self.db.tasks.bulkPut(tasks).then(function () {
        self.filterTasks().then(function () {
            d.resolve(tasks);
        }, function (err) {
            d.reject(err);
        });
    })['catch'](Dexie.BulkError, function (err) {
        d.reject(err);
    });
    return d.promise();

};

Todoist.prototype._appendProjectsToTasks = function (tasks, projects) {
    tasks.forEach(function (task) {
        for (var i = 0; i < projects.length; i++) {
            if (projects[i].id === task.project_id) {
                task.project = projects[i];
                break;
            }
        }
    });
};

Todoist.prototype.getTodayTasks = function () {
    var tasks = [], self = this, today = this.today, tomorrow = this.tomorrow, d = $.Deferred();

    self.db.tasks
        .filter(function (task) {
            // noinspection JSUnresolvedVariable
            return task.due && task.due.date && (!task.responsible_uid || task.responsible_uid === self.user.id) && task.checked !== 1;
        })
        .each(function (task) {

            var date = self.parseDate(task.due);

            if (date.equalsTo(today) || (date.laterThan(today) && date.earlierThan(tomorrow))) {
                task.isOverdue = false;
                tasks.push(task);
                return;
            }

            if (date.earlierThan(today)) {
                task.isOverdue = true;
                tasks.push(task);
            }
        })
        .then(function () {
            return self.getProjectsForTasks(tasks);
        })
        .then(function (projects) {
                self._appendProjectsToTasks(tasks, projects);
                d.resolve(self.dayOrderTasksFromTree(tasks));
            }, function (err) {
                d.reject(err);
            }
        );
    return d.promise();
};


Todoist.prototype.getNextTasks = function () {
    var tasks = [], self = this, today = this.today, tomorrow = this.tomorrow,

        week = today.addDuration(new tizen.TimeDuration(7, "DAYS")), d = $.Deferred();

    self.db.tasks.filter(function (task) {
        // noinspection JSUnresolvedVariable
        return task.due && task.due.date && (!task.responsible_uid || task.responsible_uid === self.user.id) && task.checked !== 1;
    }).each(function (task) {

        var date = self.parseDate(task.due);

        if (date.earlierThan(today)) {
            task.isOverdue = true;
            tasks.push(task);
            return;
        }

        if (date.equalsTo(today) || (date.laterThan(today) && date.earlierThan(tomorrow))) {
            task.isOverdue = false;
            tasks.push(task);
            return;
        }

        if (date.earlierThan(week) && date.laterThan(today)) {
            task.isOverdue = false;
            tasks.push(task);
        }

    }).then(function () {
        return self.getProjectsForTasks(tasks);
    })
        .then(function (projects) {
                self._appendProjectsToTasks(tasks, projects);
                d.resolve(self.dayOrderTasksFromTree(tasks));
            }, function (err) {
                d.reject(err);
            }
        );
    return d.promise();

};


Todoist.prototype.checkTask = function (id, sendErrorCallback) {
    var self = this, d = $.Deferred();

    self.getTaskById(id).then(function (task) {
        task.checked = 1;
        if (task && task.syncStatus !== Todoist.SYNC_STATUS.CREATE) {
            task.syncStatus = Todoist.SYNC_STATUS.CHECK;
        }
        self.setTask(task).then(function () {
            d.resolve();
            self.checkTasks(task)
                .then(function () {
                }, function (err) {
                    if (sendErrorCallback) {
                        sendErrorCallback(err);
                    }
                });
        }, function (err) {
            d.reject(err);
        });
    }, function (err) {
        d.reject(err);
    });
    return d.promise();
};

Todoist.prototype.checkTasks = function (tasks) {

    var cmd = [], self = this, d = $.Deferred();

    if (!tasks || tasks.length === 0) {
        d.resolve();
        return d.promise();
    }

    if (!Array.isArray(tasks)) {
        tasks = [tasks];
    }

    tasks.forEach(function (task) {
        cmd.push({
            type: 'item_close',
            uuid: Utils.generateUUID(),
            args: {
                id: task.id
            }
        });
    });

    // noinspection DuplicatedCode
    this.command(JSON.stringify(cmd)).then(function () {
        tasks.forEach(function (task) {
            task.syncStatus = Todoist.SYNC_STATUS.OK;
            task.checked = 1;
        });

        self.setTasks(tasks).then(function (tasks) {
            d.resolve(tasks);
        }, function (err) {
            d.reject(err);
        });
    }, function (err) {
        d.reject(err);
    });

    return d.promise();
};

Todoist.prototype.createTask = function (editTask, onsync) {

    var self = this, task = {
        id: Utils.generateUUID(),
        content: editTask.content,
        checked: 0,
        project_id: editTask.newProjectId ? editTask.newProjectId : editTask.projectId,
        syncStatus: Todoist.SYNC_STATUS.CREATE
    }, d = $.Deferred();

    if (editTask.dateString) {
        task.due = {
            date: this.parseDate({
                date: editTask.dateString
            }).toYYYYMMDD()
        };
    }

    self.setTask(task).then(function () {
        d.resolve();
        self.createTasks([task]).then(function () {
            if (onsync){
                onsync();
            }
        });
    }, function (err) {
        d.reject(err);
    });

    return d.promise();
};

Todoist.prototype.createTasks = function (tasks) {
    var d = $.Deferred(), cmd = [], self = this;

    if (!tasks || tasks.length === 0) {
        d.resolve();
        return d.promise();
    }

    if (!Array.isArray(tasks)) {
        tasks = [tasks];
    }

    tasks.forEach(function (task) {
        cmd.push({
            type: 'item_add',
            temp_id: task.id,
            uuid: Utils.generateUUID(),
            args: {
                content: task.content,
                project_id: task.project_id,
                due: task.due
            }
        });
    });

    self.command(JSON.stringify(cmd)).then(function (tasks) {
        tasks.forEach(function (t) {
            t.syncStatus = Todoist.SYNC_STATUS.OK;
        });
        self.setTasks(tasks).then(function (tasks) {
            d.resolve(tasks);
        }, function (err) {
            d.reject(err);
        });
    }, function (err) {
        d.reject(err);
    });

    return d.promise();
};

Todoist.prototype.filterTasks = function () {
    return this.db.tasks.where('is_deleted').equals(1)['delete']();
};

Todoist.prototype.updateTask = function (task) {
    var self = this, uuid = Utils.generateUUID(), updatedTask = null, cmd = {
        type: "item_update",
        uuid: uuid,
        args: {
            id: task.id,
            content: task.content,
            due: task.dateString ? {
                date: this.parseDate({
                    date: task.dateString
                }).toYYYYMMDD()
            } : null
        }
    }, d = $.Deferred();

    self.getTaskById(task.id).then(function (t) {
        updatedTask = t;
        return self.moveTask(t, task.newProjectId);
    }).then(function (updatedTask) {
        if (updatedTask.syncStatus !== Todoist.SYNC_STATUS.CREATE) {
            updatedTask.syncStatus = Todoist.SYNC_STATUS.UPDATE;
        }
        updatedTask.content = task.content;
        updatedTask.due = cmd.args.due;
        return self.setTask(updatedTask);
    }, function (err) {
        d.reject(err);
    }).then(function () {
        d.resolve();
        self.updateTasks([updatedTask]);
    }, function (err) {
        d.reject(err);
    });
    return d.promise();

};

Todoist.prototype.updateTasks = function (tasks) {
    var d = $.Deferred(), cmd = [], self = this;

    if (!tasks || tasks.length === 0) {
        d.resolve();
        return d.promise();
    }

    if (!Array.isArray(tasks)) {
        tasks = [tasks];
    }

    tasks.forEach(function (task) {
        cmd.push({
            type: 'item_update',
            uuid: Utils.generateUUID(),
            args: {
                id: task.id,
                content: task.content,
                due: task.due
            }
        });
    });

    self.command(JSON.stringify(cmd))
        .then(function () {
            tasks.forEach(function (task) {
                task.syncStatus = Todoist.SYNC_STATUS.OK;
            });
            self.setTasks(tasks).then(function (tasks) {
                d.resolve(tasks);
            }, function (err) {
                d.reject(err);
            });
        }, function (err) {
            d.reject(err);
        });

    return d.promise();
};

Todoist.prototype.moveTask = function (task, newProjectId) {
    var self = this, d = $.Deferred();

    if (newProjectId === task.project_id || !newProjectId) {
        d.resolve(task);
        return d.promise();
    }

    task.project_id = newProjectId;
    task.newProjectId = newProjectId;
    if (task.syncStatus !== Todoist.SYNC_STATUS.CREATE) {
        task.syncStatus = Todoist.SYNC_STATUS.MOVE;
    }

    this.setTask(task).then(function () {
        d.resolve(task);
        self.moveTasks([task]);
    }, function (err) {
        d.reject(err);
    });

    return d.promise();
};

Todoist.prototype.moveTasks = function (tasks) {
    var self = this, d = $.Deferred(), cmd = [];

    if (!tasks || tasks.length === 0) {
        d.resolve();
        return d.promise();
    }

    if (!Array.isArray(tasks)) {
        tasks = [tasks];
    }

    tasks.forEach(function (task) {
        cmd.push({
            type: 'item_move',
            uuid: Utils.generateUUID(),
            args: {
                id: task.id,
                project_id: task.project_id
            }
        });
    });

    self.command(JSON.stringify(cmd)).then(function () {
        tasks.forEach(function (task) {
            task.syncStatus = Todoist.SYNC_STATUS.OK;
            task.newProjectId = null;
        });

        self.setTasks(tasks).then(function (tasks) {
            d.resolve(tasks);
        });
    }, function (err) {
        d.reject(err);
    });

    return d.promise();
};


Todoist.prototype.deleteTask = function(id) {
	var self = this, uuid = Utils.generateUUID(), cmd = {
		type : "item_delete",
		uuid : uuid,
		args : {
			"id" : id
		}
	}, d = $.Deferred();

	self.db.tasks.where('id').equals(id)['delete']().then(function() {
		d.resolve();
		self.command(JSON.stringify(new Array(cmd))).fail(function(err) {
			d.reject(err);
		});
	});
	return d.promise();
};

Todoist.prototype.getTasksByLabelId = function (labelName) {
    var results = [], self = this, d = $.Deferred();

    if (!labelName) {
        d.reject('Label id not set');
    }

    self.db.tasks.each(function (task) {
        if (task.labels && task.labels.indexOf(labelName) !== -1 && task.checked !== 1) {
            results.push(task);
        }
    })
        .then(function () {
            return self.getProjectsForTasks(results);
        })
        .then(function (projects) {
            self._appendProjectsToTasks(results, projects);
            d.resolve(self.tasksFromTree(results));
        }, function (err) {
            d.reject(err);
        });
    return d.promise();
};

Todoist.prototype.getTasksByProjectId = function (projectId) {
    var self = this, d = $.Deferred();

    self.db.tasks.filter(function (task) {
        return task.project_id === projectId && task.checked !== 1;
    }).toArray(function (arr) {
        d.resolve(self.tasksFromTree(arr));
    });

    return d.promise();
};

Todoist.prototype.getTaskById = function (id) {
    var d = $.Deferred();

    this.db.tasks
        .where('id')
        .equals(id.toString())
        .first(function (task) {
            d.resolve(task);
        });

    return d.promise();
};


Todoist.prototype.getTasksById = function (ids) {
    var d = $.Deferred();

    this.db.tasks
        .where('id')
        .anyOf(ids)
        .toArray(function (tasks) {
            d.resolve(tasks);
        });

    return d.promise();
};

Todoist.prototype.dayOrderTasksFromTree = function (tasks) {
    var dateAdded = this.sortCreated === SORT_ORDER.ASCENDING ? 'date_added_parsed' : '-date_added_parsed',
        sorting = null;

    if (this.sortCreatedFirst) {
        sorting = Utils.dynamicSortMultiple(dateAdded, '-isOverdue', '-haveTime', 'due_date_parsed', '-priority', 'day_order', 'child_order');
    } else {
        sorting = Utils.dynamicSortMultiple('-isOverdue', '-haveTime', 'due_date_parsed', '-priority', 'day_order', 'child_order', dateAdded);
    }

    return new Tree().createFlatTree(tasks, function (arr) {
        arr.sort(sorting);
    });

};


/*
    private val itemComparator = compareBy<Node<ItemFull>>(
            { it.item.childOrder },
            { !it.item.item.haveTime },
            { it.item.item.dueDateParsed != null },
            { it.item.item.dueDateParsed },
            { -it.item.item.priority },
            { it.item.item.dateAddedParsed },
            { it.item.id },
 */

Todoist.prototype.tasksFromTree = function (tasks) {
    var dateAdded = this.sortCreated === SORT_ORDER.ASCENDING ? 'date_added_parsed' : '-date_added_parsed',
        sorting = null;
    if (this.sortCreatedFirst) {
        sorting = Utils.dynamicSortMultiple(dateAdded, '-isOverdue', 'child_order', '-haveTime', 'due_date_parsed', '-priority', 'day_order', 'id');
    } else {
        sorting = Utils.dynamicSortMultiple('-isOverdue', 'child_order', '-haveTime', 'due_date_parsed', '-priority', 'day_order', 'child_order', 'id');
    }
    return new Tree().createFlatTree(tasks, function (arr) {
        arr.sort(sorting);

        /*Log.w('===================================================');
        arr.forEach(function(item) {
            if (!item.isOverdue && item.isOverdue !== false) {
                Log.w(item.content);
            }

            Log.w('Overdue: ' + item.isOverdue + ' DueDateParsed: ' + item.due_date_parsed + ' HaveTime: ' + item.haveTime + ' priority: ' + item.priority + ' day_order: ' + item.day_order + ' childOrder: ' + item.child_order
                    + ' date_added_parsed: ' + item.date_added_parsed);
        });*/

    });
};

Todoist.prototype.getTaskContent = function (task) {
    var content = Todoist.replaceSymbolPairs(task.content, /\*\*/g, '<b>', '</b>');
    content = Todoist.replaceSymbolPairs(content, /\*/g, '<i>', '</i>');
    content = Todoist.formatLinks(content);
    content = Todoist.replaceOutlook(content);

    return content;
};


Todoist.prototype.sendNotSynchedTasks = function () {
    var d = $.Deferred(), self = this;

    this.db.tasks.where('syncStatus').notEqual(Todoist.SYNC_STATUS.OK).toArray(function (tasks) {

        var createTasks = [], updateTasks = [], checkTasks = [], moveTasks = [];

        if (tasks.length === 0) {
            d.resolve();
            return;
        }

        tasks.forEach(function (task) {
            switch (task.syncStatus) {
                case Todoist.SYNC_STATUS.CHECK:
                    checkTasks.push(task);
                    break;
                case Todoist.SYNC_STATUS.UPDATE:
                    if (task.newProjectId) {
                        moveTasks.push(task);
                    }
                    updateTasks.push(task);
                    break;
                case Todoist.SYNC_STATUS.CREATE:
                    createTasks.push(task);
                    break;
                case Todoist.SYNC_STATUS.MOVE:
                    moveTasks.push(task);
                    break;
            }
        });

        self.createTasks(createTasks).always(function () {
            self.updateTasks(updateTasks).always(function () {
                self.checkTasks(checkTasks).always(function () {
                    self.moveTasks(moveTasks).always(function () {
                        d.resolve();
                    });
                });
            });
        });

    })['catch'](function (err) {
        d.reject(err);
    });

    return d.promise();
};