/*global Todoist, Dexie, $, Utils*/
Todoist.prototype.getLabels = function () {
    var self = this, d = $.Deferred();

    self.db.labels.count(function (count) {
        if (count > 0) {
            self.db.labels.toArray(function (arr) {
                d.resolve(arr);
            });
            return;
        }
        self.request("[\"labels\"]", self.syncToken).then(function (response) {
            return self.setLabels(response.labels);
        }, function (err) {
            d.reject(err);
        }).then(function () {
            self.db.labels.toArray(function (arr) {
                d.resolve(arr);
            });
        });
    });

    return d.promise();
};

Todoist.prototype.getLabelsWithTaskCount = function () {
    var self = this;
    return this.getLabels()
        .then(function (labels) {
            return self.getTasksCountByLabels(labels);
        });
};

Todoist.prototype.setLabels = function (labels) {
    var self = this, d = $.Deferred();

    if (!labels) {
        d.resolve();
        return d.promise();
    }

    labels.forEach(function (label) {
        if (label.is_deleted === true) {
            label.is_deleted = 1;
        }
        if (label.is_deleted === false) {
            label.is_deleted = 0;
        }
    });

    // noinspection DuplicatedCode
    self.db.labels.bulkPut(labels).then(function () {
        self.db.labels.where('is_deleted').equals(1)['delete']().then(function () {
            d.resolve();
        });
    })['catch'](Dexie.BulkError, function (err) {
        d.reject(err);
    });

    return d.promise();
};

Todoist.prototype.getLabelById = function (id) {
    var self = this, d = $.Deferred();

    self.db.labels.where('id').equals(id).first(function (label) {
        d.resolve(label);
    });
    return d.promise();
};

/*
 * Returns result as { label, count }
 */
Todoist.prototype.getTasksCountByLabels = function (labels) {
    var self = this, d = $.Deferred();
    var sorting = Utils.dynamicSort('-is_favorite');

    var i = 0, j = 0, result = [], count = 0;

    if (!labels) {
        d.reject('Labels not set');
    }

    self.getTasks(false).then(function (tasks) {
        for (i = 0; i < labels.sort(sorting).length; i++) {
            count = 0;
            for (j = 0; j < tasks.length; j++) {
                if (tasks[j].labels && tasks[j].labels.indexOf(labels[i].name) !== -1) {
                    count++;
                }
            }
            result.push({
                label: labels[i],
                count: count
            });
        }
        d.resolve(result);
    }, function (err) {
        d.reject(err);
    });
    return d.promise();
};