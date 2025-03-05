/*global $, LANG_JSON_DATA*/
/*jshint unused: false*/

function translateUI() {
    $("#projectsPage h2").html(LANG_JSON_DATA.PROJECTS);
    $('#pickProjectsPage h2').html(LANG_JSON_DATA.PROJECTS);
    $("#labelsPage h2").html(LANG_JSON_DATA.LABELS);

    $("#swipeComplete").html(LANG_JSON_DATA.COMPLETE);
    $("#swipeSchedule").html(LANG_JSON_DATA.SCHEDULE);

    $("#settingsPage h2").html(LANG_JSON_DATA.SETTINGS);
    $("#todayStartup").prepend(LANG_JSON_DATA.TODAY);
    $("#nextWeekStartup").prepend(LANG_JSON_DATA.NEXT_7_DAYS);
    $("#projectsStartup").prepend(LANG_JSON_DATA.PROJECTS);
    $("#labelsStartup").prepend(LANG_JSON_DATA.LABELS);
    $("#okButton").html(LANG_JSON_DATA.OK);
    $('#sortCreated').prepend(LANG_JSON_DATA.TASK_CREATED_SORT);
    $('#sortCreatedFirst label').prepend(LANG_JSON_DATA.TASK_CREATED_SORT);
    $('#sortCreatedFirst span').html(LANG_JSON_DATA.FIRST);

    $("#taskContent label").prepend(LANG_JSON_DATA.CONTENT);
    $("#taskProject label").prepend(LANG_JSON_DATA.PROJECT);
    $("#taskDate label").prepend(LANG_JSON_DATA.DUE_DATE);

    $("#todayDate").html(LANG_JSON_DATA.TODAY);
    $("#tomorrowDate").html(LANG_JSON_DATA.TOMORROW);
    $("#nextWeekDate").html(LANG_JSON_DATA.NEXT_WEEK);
    $("#pickDate").html(LANG_JSON_DATA.PICK);
    $("#removeDate").html(LANG_JSON_DATA.NO_DATE);

    $("#postponePage h2").html(LANG_JSON_DATA.POSTPONE);
    $("#todayPostpone").html(LANG_JSON_DATA.TODAY);
    $("#tomorrowPostpone").html(LANG_JSON_DATA.TOMORROW);
    $("#nextWeekPostpone").html(LANG_JSON_DATA.NEXT_WEEK);
    $("#pickDatePostpone").html(LANG_JSON_DATA.PICK);
    $("#removeDatePostpone").html(LANG_JSON_DATA.NO_DATE);

    $("#loginPopupContent").html(LANG_JSON_DATA.CONNECT_TODOIST);
    $("#loginCancelButton").html(LANG_JSON_DATA.CANCEL);
    $("#loginOkButton").html(LANG_JSON_DATA.OK);
    
    $('#dueDatePage h2').html(LANG_JSON_DATA.DUE_DATE);
    $('#confirmCompletion label').prepend(LANG_JSON_DATA.CONFIRM);
    $('#confirmCompletion span').html(LANG_JSON_DATA.COMPLETION);
    $('#fullSync a').prepend(LANG_JSON_DATA.CLEAR_DATA);
    $('#fullSync a span').prepend(LANG_JSON_DATA.CLEAR_DATA_DESCRIPTION);
}