/*global LANG_JSON_DATA*/
/*jshint unused: false*/

var VIEW = {
    TODAY: 0,
    NEXT_WEEK: 1,
    PROJECTS: 2,
    LABELS: 3,
    toString: function(val) {
        switch (val) {
        	case 1:
            case "NEXT_WEEK":
                return LANG_JSON_DATA.NEXT_7_DAYS;
            case 2:
            case "PROJECTS":
                return LANG_JSON_DATA.PROJECTS;
            case 3:
            case "LABELS":
                return LANG_JSON_DATA.LABELS;
            default:
                return LANG_JSON_DATA.TODAY;
        }
    }
};