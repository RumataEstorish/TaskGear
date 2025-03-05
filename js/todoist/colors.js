Colors.COLOR_NAMES = ["berry_red",
    "red",
    "orange",
    "yellow",
    "olive_green",
    "lime_green",
    "green",
    "mint_green",
    "teal",
    "sky_blue",
    "light_blue",
    "blue",
    "grape",
    "violet",
    "lavender",
    "magenta",
    "salmon",
    "charcoal",
    "grey",
    "taupe"
];

function Colors() {

}

Colors.prototype.getLabelColor = function (label) {
    // noinspection JSUnresolvedVariable
    if (label.is_favorite === true) {
        return '../../../images/favorite.png';
    }
    switch (Colors.COLOR_NAMES.indexOf(label.color)) {
        case 0:
            return '../../../images/labels/label_0.png';
        case 1:
            return '../../../images/labels/label_1.png';
        case 2:
            return '../../../images/labels/label_2.png';
        case 3:
            return '../../../images/labels/label_3.png';
        case 4:
            return '../../../images/labels/label_4.png';
        case 5:
            return '../../../images/labels/label_5.png';
        case 6:
            return '../../../images/labels/label_6.png';
        case 7:
            return '../../../images/labels/label_7.png';
        case 8:
            return '../../../images/labels/label_8.png';
        case 9:
            return '../../../images/labels/label_9.png';
        case 10:
            return '../../../images/labels/label_10.png';
        case 11:
            return '../../../images/labels/label_11.png';
        case 12:
            return '../../../images/labels/label_12.png';
        case 13:
            return '../../../images/labels/label_13.png';
        case 14:
            return '../../../images/labels/label_14.png';
        case 15:
            return '../../../images/labels/label_15.png';
        case 16:
            return '../../../images/labels/label_16.png';
        case 17:
            return '../../../images/labels/label_17.png';
        case 18:
            return '../../../images/labels/label_18.png';
        case 19:
            return '../../../images/labels/label_19.png';
    }

};

Colors.prototype.getProjectImage = function (project) {
    // noinspection JSUnresolvedVariable
    if (project.is_favorite === true) {
        return '../../../images/favorite.png';
    }
    switch (Colors.COLOR_NAMES.indexOf(project.color)) {
        case 0:
            return '../../../images/projects/project_0.png';
        case 1:
            return '../../../images/projects/project_1.png';
        case 2:
            return '../../../images/projects/project_2.png';
        case 3:
            return '../../../images/projects/project_3.png';
        case 4:
            return '../../../images/projects/project_4.png';
        case 5:
            return '../../../images/projects/project_5.png';
        case 6:
            return '../../../images/projects/project_6.png';
        case 7:
            return '../../../images/projects/project_7.png';
        case 8:
            return '../../../images/projects/project_8.png';
        case 9:
            return '../../../images/projects/project_9.png';
        case 10:
            return '../../../images/projects/project_10.png';
        case 11:
            return '../../../images/projects/project_11.png';
        case 12:
            return '../../../images/projects/project_12.png';
        case 13:
            return '../../../images/projects/project_13.png';
        case 14:
            return '../../../images/projects/project_14.png';
        case 15:
            return '../../../images/projects/project_15.png';
        case 16:
            return '../../../images/projects/project_16.png';
        case 17:
            return '../../../images/projects/project_17.png';
        case 18:
            return '../../../images/projects/project_18.png';
        case 19:
            return '../../../images/projects/project_19.png';
    }
};