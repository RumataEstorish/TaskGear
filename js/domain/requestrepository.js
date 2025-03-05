/*global Utils, GearModel, GearHttp*/

function RequestRepository(sap, model) {

    var forcePhoneHttp = false;

    switch (Utils.getGearVersion(model)) {
        case GearModel.GEAR_S:
        case GearModel.GEAR_S2:
            forcePhoneHttp = true;
            break;
    }

    Object.defineProperties(this, {
        '_sap': {
            get: function () {
                return sap;
            }
        },
        '_model': {
            get: function () {
                return model;
            }
        },
        '_forcePhoneHttp': {
            get: function () {
                return forcePhoneHttp;
            }
        }
    });

}

RequestRepository.prototype.createRequest = function () {
    return new GearHttp(this._sap, this._model, this._forcePhoneHttp);
};