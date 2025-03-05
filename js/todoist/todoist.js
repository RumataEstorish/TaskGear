/*global GearHttp, Dexie, Log, $, SYNC_STATUS, LANG_JSON_DATA, GearModel, SORT_ORDER, Utils*/
/*jshint unused: false*/
/*jslint laxbreak: true*/

Todoist.SORT_CREATED_PREF = 'SORT_CREATED';
Todoist.SORT_CREATED_FIRST_PREF = 'SORT_CREATED_FIRST';
Todoist.API_VERSION_PREF = 'API_VERSION';
Todoist.DEFAULT_SYNC_TOKEN = '*';
Todoist.API_ADDRESS = 'https://todoist.com/API/v9/sync';

Todoist.ERRORS = {
    AUTH_NEEDED: 'AUTH_NEEDED',
    UNKNOWN_ERROR: 'ERROR',
    OFFLINE: 'OFFLINE',
    JSON_PARSE_ERROR: 'ERROR_PARSING_JSON'
};

Todoist.SYNC_STATUS = {
    OK: 0,
    CREATE: 1,
    CHECK: 2,
    UPDATE: 3,
    MOVE: 4,
    DELETE: 5
};

function Todoist(requestRepository) {

    var accessToken = localStorage.getItem("accessToken"),
        db = new Dexie("TaskGear"),
        inboxId = localStorage.getItem("inboxId"),
        inboxName = localStorage.getItem("inboxName"),
        syncToken = localStorage.getItem("syncToken"),
        user = localStorage.getItem("user"),
        sortCreated = localStorage.getItem(Todoist.SORT_CREATED_PREF),
        sortCreatedFirst = Utils.stringToBoolean(localStorage.getItem(Todoist.SORT_CREATED_FIRST_PREF), false),
        apiVersion = localStorage.getItem(Todoist.API_VERSION_PREF);

    var onerror;

    var parseTimeWithoutZ = false;

    if (!sortCreated) {
        sortCreated = SORT_ORDER.ASCENDING;
    }


    if (user) {
        try {
            user = JSON.parse(user);
        } catch (ignored) {
        }
    }

    if (Log.DEBUG === true) {
        accessToken = "YOUR_TEST_TOKEN_HERE";
    }

    if (apiVersion !== '9') {
        Dexie['delete']('TaskGear');
        this.syncToken = Todoist.DEFAULT_SYNC_TOKEN;
        localStorage.setItem(Todoist.API_VERSION_PREF, '9');
    }

    // Define a schema
    db.version(1).stores({
        tasks: 'id, due_date_utc, project_id, is_deleted, checked, in_history, is_archived',
        projects: 'id, item_order, is_deleted',
        labels: 'id, is_deleted'
    });

    db.version(2).stores({
        tasks: 'id, due_date_utc, project_id, is_deleted, checked, in_history, is_archived, sync_status',
        projects: 'id, item_order, is_deleted',
        labels: 'id, is_deleted'
    });

    db.version(3).stores({
        tasks: 'id, user_id, project_id, content, due, priority, parent_id, child_order, day_order, collapsed, labels, sync_status, assigned_by_uid, responsible_uid, checked, in_history, is_deleted, is_archived, sync_id, date_added',
        projects: 'id, name, color, parent_id, child_order, collapsed, shared, is_deleted, is_archived, is_favorite, inbox_project, team_inbox',
        labels: 'id, name, color, item_order, is_deleted, is_favorite'
    }).upgrade(function () {

    });

    db.version(4).stores({
        tasks: 'id, user_id, project_id, content, due, priority, parent_id, child_order, day_order, collapsed, labels, sync_status, assigned_by_uid, responsible_uid, checked, in_history, is_deleted, is_archived, sync_id, date_added, syncStatus',
        projects: 'id, name, color, parent_id, child_order, collapsed, shared, is_deleted, is_archived, is_favorite, inbox_project, team_inbox',
        labels: 'id, name, color, item_order, is_deleted, is_favorite'
    }).upgrade(function (trans) {
        return trans.tasks.toCollection().modify(function (task) {
            task.syncStatus = Todoist.SYNC_STATUS.OK;
        });
    });

    db.version(5).stores({
        tasks: 'id, user_id, project_id, content, due, priority, parent_id, child_order, day_order, collapsed, labels, sync_status, assigned_by_uid, responsible_uid, checked, is_deleted, is_archived, sync_id, added_at, syncStatus',
        projects: 'id, name, color, parent_id, child_order, collapsed, shared, is_deleted, is_archived, is_favorite, inbox_project, team_inbox',
        labels: 'id, name, color, item_order, is_deleted, is_favorite'
    }).upgrade(function (trans) {
    });

    // Open the database
    db.open()['catch'](function (error) {
        Log.e('Open DB error: ' + error);
    });

    /**
     * Private properties
     */
    Object.defineProperties(this, {
        '_requestRepository': {
            get: function () {
                return requestRepository;
            }
        }
    });

    Object.defineProperty(this, "db", {
        get: function () {
            return db;
        }
    });

    Object.defineProperty(this, "user", {
        get: function () {
            return user;
        },
        set: function (val) {
            localStorage.setItem("user", JSON.stringify(val));
            user = val;
        }
    });

    Object.defineProperty(this, "isAuthorized", {
        get: function () {
            return accessToken && accessToken !== "";
        }
    });

    Object.defineProperty(this, "accessToken", {
        get: function () {
            return accessToken;
        },
        set: function (val) {
            accessToken = val;
            localStorage.setItem("accessToken", val);
        }
    });

    Object.defineProperty(this, "onerror", {
        get: function () {
            return onerror;
        },
        set: function (val) {
            onerror = val;
        }
    });


    Object.defineProperty(this, "syncToken", {
        get: function () {
            return (!syncToken || syncToken === '') ? '*' : syncToken;
        },
        set: function (val) {
            syncToken = val;
            localStorage.setItem("syncToken", val);
        }
    });

    Object.defineProperty(this, "inboxId", {
        get: function () {
            return inboxId;
        },
        set: function (val) {
            inboxId = val;
            localStorage.setItem("inboxId", val);
        }
    });

    Object.defineProperty(this, "inboxName", {
        get: function () {
            return inboxName;
        },
        set: function (val) {
            inboxName = val;
            localStorage.setItem("inboxName", val);
        }
    });

    Object.defineProperty(this, 'today', {
        get: function () {
            var d = tizen.time.getCurrentDateTime();
            d.setHours(0);
            d.setMinutes(0);
            d.setSeconds(0);
            d.setMilliseconds(0);
            return d;
        }
    });

    Object.defineProperty(this, 'tomorrow', {
        get: function () {
            return this.today.addDuration(new tizen.TimeDuration(1, 'DAYS'));
        }
    });

    Object.defineProperty(this, 'yesterday', {
        get: function () {
            return this.today.addDuration(new tizen.TimeDuration(-1, 'DAYS'));
        }
    });

    Object.defineProperty(this, 'timezone', {
        get: function () {
            // noinspection JSUnresolvedVariable
            if (this.user && this.user.tz_info && this.user.tz_info.timezone) {
                return this.user.tz_info.timezone;
            }
            return null;
        }
    });

    Object.defineProperty(this, 'sortCreated', {
        get: function () {
            return sortCreated;
        },
        set: function (val) {
            sortCreated = val;
            localStorage.setItem(Todoist.SORT_CREATED_PREF, val);
        }
    });

    Object.defineProperty(this, 'sortCreatedFirst', {
        get: function () {
            return sortCreatedFirst;
        },
        set: function (val) {
            sortCreatedFirst = val;
            localStorage.setItem(Todoist.SORT_CREATED_FIRST_PREF, val);
        }
    });

    Object.defineProperty(this, 'parseTimeWithoutZ', {
        get: function () {
            return parseTimeWithoutZ;
        }
    });

    try {
        tizen.TZDate.parseWithTimeZone('2020-12-01Z').equalsTo(this.today);
    } catch (e) {
        parseTimeWithoutZ = true;
    }
}

/**
 * Delete data
 */
Todoist.prototype.deleteData = function () {
    var self = this, d = $.Deferred();

    this.syncToken = Todoist.DEFAULT_SYNC_TOKEN;
    this.db.tasks.clear().then(function () {
        self.db.projects.clear().then(function () {
            self.db.labels.clear().then(function () {
                d.resolve();
            });
        });
    });
    return d.promise();
};

/**
 * Sync all items
 */
Todoist.prototype.fullSync = function () {
    var self = this, d = $.Deferred();

    Log.d('Full sync');

    this.deleteData().then(function () {
        self.sync(Todoist.DEFAULT_SYNC_TOKEN).then(function () {
            d.resolve();
        }, function (err) {
            d.reject(err);
        });
    });

    return d.promise();
};

/**
 * Server synchronization
 *
 * @param sync_token - if empty, then this.syncToken taken
 * @returns {Promise}
 */
Todoist.prototype.sync = function (sync_token) {
    var self = this, response = null, d = $.Deferred(), fail = function (err) {
        d.reject(err);
    };

    Log.d('Sync');

    if (!this.isAuthorized) {
        Log.d('Sync not authorized');
        d.reject(Todoist.ERRORS.AUTH_NEEDED);
        return d.promise();
    }

    this.sendNotSynchedTasks().then(function () {
        self.request("[\"items\", \"labels\", \"projects\", \"user\"]", (sync_token ? sync_token : self.syncToken)).then(function (resp) {
            response = resp;
            if (!response) {
                return d.reject('No response at sync');
            }

            if (response.user) {
                self.user = response.user;
            }

            // noinspection JSUnresolvedVariable
            self.syncToken = response.sync_token;

            self.setProjects(response.projects).then(function () {
                self.setLabels(response.labels).then(function () {
                    response.items.forEach(function (task) {
                        task.syncStatus = Todoist.SYNC_STATUS.OK;
                    });
                    self.setTasks(response.items).then(function () {
                        d.resolve();
                    }, fail);
                }, fail);
            }, fail);
        }, fail);
    }, fail);

    return d.promise();
};

Todoist.prototype.createRequest = function () {
    var request = this._requestRepository.createRequest();
    request.open('POST', Todoist.API_ADDRESS);
    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    request.setRequestHeader("Authorization", "Bearer " + this.accessToken);
    return request;
};

Todoist.prototype.command = function (commands) {
    var request, self = this, d = $.Deferred();

    try {
        request = this.createRequest();
    } catch (e) {
        d.reject(e);
        return d.promise();
    }

    if (!commands || commands === '[]') {
        d.resolve('');
        return d.promise();
    }

    request.onreadystatechange = function () {

        if (request.request.status === 0 && request.request.readyState === 4 && request.request.responseText === '') {
            d.reject(Todoist.ERRORS.OFFLINE);
            return;
        }
        try {
            self.getResultFromRequest(request).then(function (res) {
                // noinspection JSUnresolvedVariable
                if (res.temp_id_mapping) {
                    // noinspection JSUnresolvedVariable
                    var tempIds = Object.keys(res.temp_id_mapping);
                    var ids = tempIds.map(function (key) {
                        // noinspection JSUnresolvedVariable
                        return res.temp_id_mapping[key];
                    });

                    if (tempIds.length > 0) {
                        self.getTasksById(tempIds).then(function (tasks) {
                            for (var i = 0; i < tasks.length; i++) {
                                tasks[i].id = ids[i];
                            }
                            self.db.tasks
                                .where('id')
                                .anyOf(tempIds)['delete']()
                                .then(function () {
                                    d.resolve(tasks);
                                }, function (err) {
                                    d.reject(err);
                                });
                        });
                        return;
                    }
                }
                d.resolve(res);
            }, function (err) {
                if (err === Todoist.ERRORS.UNKNOWN_ERROR || err === Todoist.ERRORS.JSON_PARSE_ERROR) {
                    setTimeout(function () {
                        self.command(commands);
                    }, 500);
                }
                d.reject(err);
            });
        } catch (e) {
            d.reject(e);
        }
    };

    try {
        request.send("commands=" + commands);
    } catch (e) {
        d.reject(e);
    }

    return d.promise();
};

Todoist.prototype.request = function (resource_types, sync_token) {
    var request, self = this, d = $.Deferred();

    try {
        request = this.createRequest();
    } catch (e) {
        d.reject(e);
        return d.promise();
    }

    request.onreadystatechange = function () {
        if (request.request.status === 0 && request.request.readyState === 4 && request.request.responseText === '') {
            d.reject(Todoist.ERRORS.OFFLINE);
            return;
        }

        self.getResultFromRequest(request).then(function (res) {
            d.resolve(res);
        }, function (err) {
            if (err === Todoist.ERRORS.UNKNOWN_ERROR || err === Todoist.ERRORS.JSON_PARSE_ERROR) {
                setTimeout(function () {
                    self.request(resource_types, sync_token);
                }, 500);
            }
            d.reject(err);
        });
    };

    try {
        request.send("sync_token=" + (sync_token ? sync_token : Todoist.DEFAULT_SYNC_TOKEN) + "&resource_types=" + resource_types);
    } catch (e) {
        d.reject(e);
    }

    return d.promise();
};

Todoist.prototype.parseDate = function (due) {

    if (!due) {
        return '';
    }

    var d = due;
    if (due.date) {
        d = due.date;
    }

    if (due instanceof tizen.TZDate){
        return due;
    }

    //var d = new Date(due.date);
    // noinspection JSCheckFunctionSignatures
    //return new tizen.TZDate(new Date(d.getTime()));

    if (this.parseTimeWithoutZ === false) {
        return tizen.TZDate.parseWithTimeZone(d + 'Z');
    }
    return tizen.TZDate.parseWithTimeZone(d);
};

Todoist.prototype.isToday = function (date) {

    if (!date) {
        return false;
    }

    var d = this.parseDate(date);
    var today = this.today;
    var tomorrow = this.tomorrow;


    return d.equalsTo(today) || (d.laterThan(today) && d.earlierThan(tomorrow));
};

Todoist.prototype.isTomorrow = function (date) {
    if (!date) {
        return false;
    }

    var d = this.parseDate(date);
    var tomorrow = this.tomorrow;
    var nextTomorrow = tomorrow.addDuration(new tizen.TimeDuration(1, 'DAYS'));

    return d.equalsTo(tomorrow) || (d.laterThan(tomorrow) && d.earlierThan(nextTomorrow));
};

Todoist.prototype.toDisplayDate = function (date) {
    if (!date) {
        return '';
    }

    var d = this.parseDate(date), replace = new RegExp('([.,;\\/ ]*' + d.getFullYear() + '\\s?\\D*)', 'g');

    return d.toLocaleDateString().replace(replace, '').trim();
};

Todoist.prototype.toDisplayTime = function (date) {
    if (!date) {
        return '';
    }

    var d = this.parseDate(date);
    var time = d.toLocaleTimeString();

    if (tizen.time.getTimeFormat().indexOf('ap', 0) > -1) {
        return time.substring(0, time.lastIndexOf(tizen.time.getTimeFormat()[1])) + time.substring(time.lastIndexOf(tizen.time.getTimeFormat()[1]) + 3);
    }
    return time.substring(0, time.lastIndexOf(tizen.time.getTimeFormat()[1]));
};

/**
 * Retrieve data from request
 * @returns parsed JSON. If token is expired - return null
 */
Todoist.prototype.getResultFromRequest = function (request) {
    var res = null;
    var d = $.Deferred();

    if (request.request.readyState === 4 && request.request.status === 200) {
        try {
            res = JSON.parse(request.request.responseText);
        } catch (e) {
            d.reject(Todoist.ERRORS.JSON_PARSE_ERROR);
            return d.promise();
        }

        if (res.error) {
            d.reject(res.error);
            return d.promise();
        }

        d.resolve(res);
        return d.promise();
    }

    if (request.request.readyState === 4) {
        if (request.request.responseText === '') {
            d.reject(Todoist.ERRORS.UNKNOWN_ERROR);
            return d.promise();
        }

        try {
            res = JSON.parse(request.request.responseText);
        } catch (e) {
            d.reject(Todoist.ERRORS.JSON_PARSE_ERROR);
            return d.promise();
        }

        if (res.error === 'Invalid token') {
            d.reject(Todoist.ERRORS.AUTH_NEEDED);
            return d.promise();
        }

        Log.e("Request error. Status: " + request.request.status + "; Response: " + request.request.responseText, true);
        d.reject(Todoist.ERRORS.UNKNOWN_ERROR);
        return d.promise();
    }

    return d.promise();
};

Todoist.replaceSymbolPairs = function (content, symbols, replaceOdd, replaceEven) {
    var count = 0, match = content.match(symbols), len = match ? match.length : 0;

    if (len <= 1) {
        return content;
    }

    if (len % 2 !== 0) {
        len--;
    }

    return content.replace(symbols, function (match) {
        if (count === len) {
            return match;
        }
        if (count++ % 2 !== 0) {
            return replaceEven;
        }
        return replaceOdd;
    });
};

Todoist.formatLinks = function (content) {
    try {
        // noinspection RegExpRedundantEscape
        var res = content, match = null, reg = /\[(.*?)\]\((.*?)\)/gi,
            reg2 = /(https?:\/?\/?w?w?w?\.?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b[-a-zA-Z0-9@:%_\+.~#?&\/=]*)\W?\((.*?)\)/gi;

        if (content.indexOf('(') < 0) {
            return res;
        }

        while ((match = reg.exec(res)) !== null) {
            res = res.replace('[' + match[1] + ']', match[1]);// + '<a href="' + match[2] + '"></a>');
            res = res.replace('(' + match[2] + ')', '');
        }

        while ((match = reg2.exec(res)) !== null) {
            res = res.replace(match[1] + ' ', '');
            res = res.replace(match[1], '');
            res = res.replace('(' + match[match.length - 1] + ')', match[match.length - 1]); //+ '<a href="' + match[1] + '"></a>');
        }

        return res;
    } catch (ignored) {
    }
};

Todoist.replaceOutlook = function (content) {
    var match = null, reg = /\[\[outlook=id\d+=[\S]*\s?/gi;

    if (content.indexOf('[[') === -1) {
        return content;
    }

    while ((match = reg.exec(content)) !== null) {
        content = content.replace(match[0], '');
        content = content.replace(' ]]', '');
    }

    return content;
};