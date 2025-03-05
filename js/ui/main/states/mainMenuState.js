/*jshint unused: false*/

MainMenuState.OPEN_MAIN_MENU = 'OPEN_MAIN_MENU';

function MainMenuState(isTodayVisible, isNextWeekVisible, isProjectsVisible, isLabelsVisible) {
    Object.defineProperties(this, {
            'isTodayVisible': {
                get: function () {
                    return isTodayVisible;
                }
            },
            'isNextWeekVisible': {
                get: function () {
                    return isNextWeekVisible;
                }
            },
            'isProjectsVisible': {
                get: function () {
                    return isProjectsVisible;
                }
            },
            'isLabelsVisible': {
                get: function () {
                    return isLabelsVisible;
                }
            }
        }
    );
}