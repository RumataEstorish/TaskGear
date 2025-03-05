/*global Todoist, Dexie, Utils, Tree, $*/
Todoist.prototype.getProjects = function () {
    var self = this, d = $.Deferred();

    try {
        self.db.projects.count(function (count) {
            if (count > 0) {
                self.db.projects.toArray().then(function (projects) {
                    d.resolve(new Tree().createFlatTree(projects, function (arr) {
                        arr.sort(Utils.dynamicSortMultiple('child_order'));
                    }));
                });
            } else {
                self.request("[\"projects\"]", self.syncToken).then(function (response) {
                    return self.setProjects(response.projects);
                }, function (err) {
                    d.reject(err);
                }).then(function () {
                    self.db.projects.toArray().then(function (projects) {
                        d.resolve(new Tree().createFlatTree(projects, function (arr) {
                            arr.sort(Utils.dynamicSortMultiple('child_order'));
                        }));
                    });
                });
            }
        });
    } catch (e) {
        d.reject(e);
    }
    return d.promise();
};

Todoist.prototype.getProjectsWithTaskCount = function () {
    var self = this;

    return this.getProjects()
        .then(function (projects) {
            return self.getTasksCountByProjects(projects);
        });
};

Todoist.prototype.setProjects = function (projects) {
    var self = this, d = $.Deferred();

    if (!projects) {
        d.resolve();
        return d.promise();
    }
    if (!self.inboxName) {
        for (var i = 0; i < projects.length; i++) {
            // noinspection JSUnresolvedVariable
            if (projects[i].inbox_project && projects[i].inbox_project === true) {
                self.inboxId = projects[i].id;
                self.inboxName = projects[i].name;
            }
        }
    }

    projects.forEach(function (project) {
        if (project.is_deleted === true) {
            project.is_deleted = 1;
        }
        if (project.is_deleted === false) {
            project.is_deleted = 0;
        }
    });

    // noinspection DuplicatedCode
    self.db.projects.bulkPut(projects).then(function () {
        self.db.projects.where('is_deleted').equals(1)['delete']().then(function () {
            d.resolve();
        });
    })['catch'](Dexie.BulkError, function (err) {
        d.reject(err);
    });

    return d.promise();
};

Todoist.prototype.getProjectsForTasks = function (tasks) {
    var d = $.Deferred();
    var self = this;

    var taskIds = tasks.map(function (task) {
        return task.project_id;
    });

    self.db.projects
        .where('id')
        .anyOf(taskIds)
        .toArray()
        .then(function (projects) {
            d.resolve(projects);
        })
        ['catch'](Dexie.BulkError, function (err) {
        d.reject(err);
    });


    return d.promise();
};

Todoist.prototype.getProjectById = function (id) {
    var self = this, d = $.Deferred();

    self.db.projects.where('id').equals(id).first(function (project) {
        d.resolve(project);
    });
    return d.promise();
};

Todoist.prototype.getTasksCountByProjects = function (projects) {
    var self = this, d = $.Deferred();
    var sorting = Utils.dynamicSort('-is_favorite');

    var i = 0, j = 0, result = [], count = 0;
    if (!projects) {
        d.reject('Projects not set');
    }

    self.getTasks(false).then(function (tasks) {
        for (i = 0; i < projects.sort(sorting).length; i++) {
            count = 0;
            for (j = 0; j < tasks.length; j++) {
                if (tasks[j].project_id === projects[i].id) {
                    count++;
                }
            }
            result.push({
                project: projects[i],
                count: count
            });
        }
        d.resolve(result);

    }, function (err) {
        d.reject(err);
    });
    return d.promise();
};
