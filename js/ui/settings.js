/*global Log, VIEW, Utils, Dexie*/

Settings.DEFAULT_VIEW_PREF = 'DEFAULT_VIEW';
Settings.SELECTED_PROJECT_ID_PREF = 'SELECTED_PROJECT_ID';
Settings.SELECTED_LABEL_ID_PREF = 'SELECTED_LABEL_ID';

function Settings(onInitialized) {
    var db = new Dexie("TaskGearSettings");
    var defaultView = VIEW.TODAY;// = Utils.tryParseInt(localStorage.getItem(Settings.DEFAULT_VIEW_PREF), VIEW.PROJECTS);
    var selectedProjectId;// = Utils.tryParseInt(localStorage.getItem(Settings.SELECTED_PROJECT_ID_PREF), null);
    var selectedLabelId;// = Utils.tryParseInt(localStorage.getItem(Settings.SELECTED_LABEL_ID_PREF), null);

    db.version(1).stores({
        settings: 'id, value'
    });

    // Open the database
    db.open()['catch'](function (error) {
        Log.e(error);
    });

    db.settings.toArray(function (set) {
        set.forEach(function (s) {
            switch (s.id) {
                case Settings.DEFAULT_VIEW_PREF:
                    defaultView = Utils.tryParseInt(s.value, VIEW.TODAY);
                    break;
                case Settings.SELECTED_PROJECT_ID_PREF:
                    selectedProjectId = s.value;
                    break;
                case Settings.SELECTED_LABEL_ID_PREF:
                    selectedLabelId = s.value;
                    break;
            }
        });
        if (onInitialized){
            onInitialized();
        }
    });

    Object.defineProperties(this, {
        'defaultView': {
            get: function () {
                return defaultView;
            },
            set: function (val) {
                defaultView = val;
                db.settings.put({id: Settings.DEFAULT_VIEW_PREF, value: val})['catch'](function(err){
                    Log.e(err);
                });
                //localStorage.setItem(Settings.DEFAULT_VIEW_PREF, val);
            }
        },
        'selectedProjectId': {
            get: function () {
                return selectedProjectId;
            },
            set: function (val) {
                selectedProjectId = val;
                db.settings.put({id: Settings.SELECTED_PROJECT_ID_PREF, value: val})['catch'](function(err){
                    Log.e(err);
                });
                //localStorage.setItem(Settings.SELECTED_PROJECT_ID_PREF, val);
            }
        },
        'selectedLabelId': {
            get: function () {
                return selectedLabelId;
            },
            set: function (val) {
                selectedLabelId = val;
                db.settings.put({id: Settings.SELECTED_LABEL_ID_PREF, value: val})['catch'](function(err){
                    Log.e(err);
                });
                //localStorage.setItem(Settings.SELECTED_LABEL_ID_PREF, val);
            }
        }
    });
}