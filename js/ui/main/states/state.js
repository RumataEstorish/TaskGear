/*jshint unused: false*/

function State(id, data) {
    Object.defineProperties(this, {
        'id': {
            get: function () {
                return id;
            }
        },
        'data': {
            get: function () {
                return data;
            }
        }
    });
}