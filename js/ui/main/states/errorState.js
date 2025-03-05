/*jshint unused: false*/

ErrorState.ERROR = 'ERROR';
ErrorState.TYPE_GEAR_ERROR = 'TYPE_GEAR_ERROR';
ErrorState.EMPTY_TASK_CONTENT = 'EMPTY_TASK_CONTENT';

function ErrorState(err) {
    Object.defineProperty(this, 'error', {
        get: function () {
            return err;
        }
    });
}