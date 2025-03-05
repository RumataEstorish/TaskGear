/*global Utils, Log*/

/*jshint unused: false*/
/*jslint laxbreak: true*/
function EditTaskData(id, content, projectId, dueDate, timezone){
	var _content = content, _projectId = projectId, _newProjectId = null, _dueDate = dueDate, _id = id;
	
	if (!_id){
		_id = Utils.generateUUID();
	}
	
	Object.defineProperty(this, "id", {
		get : function(){
			return _id;
		},
		set :function(val){
			_id = val;
		}
	});
	
	Object.defineProperty(this, "content", {
		get : function(){
			return _content;
		},
		set : function(val){
			_content = val;
		}
	});
	
	Object.defineProperty(this, "newProjectId", {
		get : function(){
			return _newProjectId;
		},
		set : function(val){
			_newProjectId = val;
		}
	});
	
	Object.defineProperty(this, "projectId", {
		get : function(){
			return _projectId;
		},
		set : function(val){
			_projectId = val;
		}
	});
	
	Object.defineProperty(this, "dueDate", {
		get : function(){
			if (_dueDate){
				if (!(_dueDate instanceof tizen.TZDate)){
					_dueDate = new tizen.TZDate(new Date(_dueDate)).toUTC();
				}
				_dueDate.setSeconds(59);
				/*if (timezone){
					_dueDate = _dueDate.toTimezone(timezone);
				}*/
				return _dueDate.toYYYYMMDDTHHMM();
			}
			return _dueDate;
		},
		set : function(val){
				_dueDate = val;
		}
	});
	Object.defineProperty(this, "dateString", {
		get : function(){
			if (_dueDate){
				if (!(_dueDate instanceof tizen.TZDate)){
					_dueDate = new tizen.TZDate(new Date(_dueDate)).toUTC();
				}
				/*if (timezone){
					_dueDate = _dueDate.toTimezone(timezone);
				}*/
				_dueDate.setSeconds(59);
				return _dueDate.toYYYYMMDD();
			}
			return '';
		}
	});
	
	Object.defineProperty(this, "dueDateSeconds", {
		get : function(){
			if (_dueDate){
				if (!(_dueDate instanceof tizen.TZDate)){
					_dueDate = new tizen.TZDate(new Date(_dueDate)).toUTC();
				}
				/*if (timezone){
					_dueDate = _dueDate.toTimezone(timezone);
				}*/
				_dueDate.setSeconds(59);
				return _dueDate.toYYYYMMDDTHHMMSS() + ' ' + _dueDate.getTimezone();
			}
			return "";
		}
	});
}

EditTaskData.prototype.copyToTask = function(task){

		if (this.content){
			task.content = this.content;
		}
		if (this.newProjectId || this.newProjectId === 0 || this.projectId || this.projectId === 0) {
			task.projectId = (this.newProjectId || this.newProjectId === 0) ? this.newProjectId
					: this.projectId;
		}
		if (this.dateString || this.dateString === 0) {
			task.dateString = this.dateString;
		}
		return task;
};