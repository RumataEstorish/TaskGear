UpdateTaskCheckState.TASK_CHECK = 'TASK_CHECK';
UpdateTaskCheckState.TASK_UNCHECK = 'TASK_UNCHECK';

function UpdateTaskCheckState(task) {
    Object.defineProperties(this, {
        'task': {
            get: function () {
                return task;
            }
        }
    });
}