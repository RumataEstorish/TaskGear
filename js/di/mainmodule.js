/*global $, SAP, Todoist, RequestRepository*/
/*jshint unused: false*/


function MainModule(){

    var ready = $.Deferred();
    var sap;
    var requestRepository;
    var todoist;
    var model;
    var self = this;

    tizen.systeminfo.getPropertyValue("BUILD", function (res) {
        model = res.model;

        sap = new SAP("TaskGear");
        requestRepository = new RequestRepository(sap, model);
        todoist = new Todoist(requestRepository);


        ready.resolve(self);
    });

    Object.defineProperties(this, {
        'sap' : {
            get: function(){
                return sap;
            }
        },
        'requestRepository' : {
            get: function(){
                return requestRepository;
            }
        },
        'todoist': {
            get: function(){
                return todoist;
            }
        },
        'model' :{
            get: function(){
                return model;
            }
        }
    });

    return ready.promise();

}