/*jshint unused: false*/

NavigationState.OPEN_SETTINGS_PAGE = 'OPEN_SETTINGS_PAGE';
NavigationState.PICK_TASK_DATE_PAGE = 'PICK_TASK_DATE_PAGE';
NavigationState.PICK_PROJECTS_PAGE = 'PICK_PROJECTS_PAGE';

function NavigationState(selectedProjectId, projects) {

    Object.defineProperties(this, {
        'selectedProjectId': {
            get: function () {
                return selectedProjectId;
            }
        },
        'projects': {
            get: function () {
                return projects;
            }
        }
    });
}