/*jshint unused: false*/

EditPageState.OPEN_EDIT_PAGE = 'OPEN_EDIT_PAGE';
EditPageState.SET_EDIT_PAGE_FIELDS = 'SET_EDIT_PAGE_FIELDS';
EditPageState.OPEN_EDIT_CONTENT = 'OPEN_EDIT_CONTENT';
EditPageState.UPDATE_CONTENT = 'UPDATE_CONTENT';
EditPageState.UPDATE_DATE = 'UPDATE_DATE';
EditPageState.UPDATE_PROJECT = 'UPDATE_PROJECT';

function EditPageState(isEdit, content, date, project) {
    Object.defineProperties(this, {
        'isEdit': {
            get: function () {
                return isEdit;
            }
        },
        'content': {
            get: function () {
                return content;
            }
        },
        'date': {
            get: function () {
                return date;
            }
        },
        'project': {
            get: function () {
                return project;
            }
        }
    });
}