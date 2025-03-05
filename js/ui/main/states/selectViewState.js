/*jshint unused: false*/

SelectViewState.SHOW_TODAY_VIEW = 'SHOW_TODAY_VIEW';
SelectViewState.SHOW_NEXT_VIEW = 'SHOW_NEXT_VIEW';
SelectViewState.SHOW_PROJECTS_VIEW = 'SHOW_PROJECTS_VIEW';
SelectViewState.SHOW_PROJECT_VIEW = 'SHOW_PROJECT_VIEW';
SelectViewState.SHOW_LABELS_VIEW = 'SHOW_LABELS_VIEW';
SelectViewState.SHOW_LABEL_VIEW = 'SHOW_LABEL_VIEW';

function SelectViewState(tasks, projects, labels) {
    Object.defineProperties(this, {
        'tasks': {
            get: function () {
                return tasks;
            }
        },
        'projects': {
            get: function () {
                return projects;
            }
        },
        'labels': {
            get: function () {
                return labels;
            }
        }
    });
}