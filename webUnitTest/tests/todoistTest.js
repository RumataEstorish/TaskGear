/*global Todoist, SAP*/
QUnit.module("todoistTest.js");

/*QUnit.test('todoistCommand', function(assert){
	var todoist = new Todoist(new SAP('Todoist')), done = assert.async();
	
	Log.DEBUG = true;
	todoist.command([{task : 'create'}]).then (function(){
		assert.strictEqual(todoist.pendingRequests.length > 0);
		done();
	}, function(){
		assert.strictEqual(todoist.pendingRequests.length > 0);
		done();
	});
});*/

var testTask = {
	id : 1, due_date_utc : 1234, project_id : 1, is_deleted : 0, checked : 0, in_history : 0, is_archived : 0, name : 'TestTask'	
};

var testProject = {
	id : 1, item_order : 1, is_deleted : 0, name : 'TestProject'	
};

var testLabel = {
	id : 10, is_deleted : 0, name : 'TestLabel'	
};

/*QUnit.test('todoistUpdateAll', function(assert){
	var todoist = new Todoist(new SAP('Todoist'), function(){}), done = assert.async(), response = { tasks : [testTask], projects : [testProject], labels : [testLabel]};
	
	assert.ok(response.labels.length === 1);
	done();
	todoist.updateAll(response).then(function(){
		assert.ok(true);
		done();
		/*todoist.getTaskById(1).then(function(task){
			assert.strictEquals(task.id, testTask.id);
			
		});
	});
});*/

QUnit.test('todoistSetLabels', function(assert){
	assert.expect(4);
	
	var todoist = new Todoist(new SAP('Todoist'), function(){
		
	}), done = assert.async(4);
	
	todoist.setLabels(null).then(function(){
		assert.ok(true);
		done();
	});
	
	todoist.setLabels(undefined).then(function(){
		assert.ok(true);
		done();
	});
	
	todoist.setLabels([]).then(function(){
		assert.ok(true);
		done();
	});
	
	todoist.setLabels([testLabel]).then(function(){
		assert.ok(true);
		done();
		/*todoist.getLabelById(testLabel.id).then(function(label){
			assert.strictEquals(label.name, testLabel.name);
			done();
		});		*/
	});
});

QUnit.test('todoistSetProjects', function(assert){
	assert.expect(3);
	
	var todoist = new Todoist(new SAP('Todoist'), function(){
		
	}), done = assert.async(3);
	
	todoist.setProjects(null).then(function(){
		assert.ok(true);
		done();
	});
	
	todoist.setProjects(undefined).then(function(){
		assert.ok(true);
		done();
	});
	
	todoist.setProjects([]).then(function(){
		assert.ok(true);
		done();
	});
});

QUnit.test('todoistSetTasks', function(assert){
	
	assert.expect(4);
	
	var todoist = new Todoist(new SAP('Todoist'), function(){
		
	}), done = assert.async(4);
	
	
	todoist.setTasks(null).then(function(){
		assert.ok(true);
		done();
	});
	
	todoist.setTasks(undefined).then(function(){
		assert.ok(true);
		done();
	});
	
	
	todoist.setTasks([]).then(function(){
		assert.ok(true);
		done();
	});
	
	todoist.setTasks([testTask]).then(function(){
		assert.ok(true);
		done();
	});
});

/*QUnit.test('todoistSync', function(assert){
	var todoist = new Todoist(new SAP('Todoist'), function(){}), done = assert.async();
	Log.DEBUG = true;
	
	todoist.fullSync().then(function(tasks){
		assert.ok(tasks.length > 0);
		done();
	}, function(){
		assert.ok(todoist.pendingRequests.length > 0);
		done();
	});
});*/

QUnit.test("todoistReplaceOutlook", function(assert) {
	var content = '[[outlook=id3=aWQ9MDAwMDAwMDA0OTlGQ0FFMUFDOTVCMzRFQkQyN0E2OUI4NEVFQThDMjA3MDBDM0I2OEUxMEY3NzUxMUNFQjRDRDAwQUEwMEJCQjZFNjAwMDAwMDAwMDAwQzAwMDBEOTUzOUMyMjYxQTZCQjQ1QjlEQUI2MkM3MDgxQjNDMTAxMDAxRDAwMDAwMDAwMDA7bWlkPTwyMDE4MTAzMDIxNDg1OS5teDdxdm5GREBzbXRwNGoubWFpbC55YW5kZXgubmV0Pg==, Тестовое сообщение Microsoft Outlook ]]';
	var content2 = 'Test';
	var res = Todoist.replaceOutlook(content);
	var res2 = Todoist.replaceOutlook(content2);
	assert.ok(res === 'Тестовое сообщение Microsoft Outlook');
	assert.strictEqual(res2, content2);
});

QUnit.test('todoistFormatLinks', function(assert){
	var content = '**\uD83D\uDCDD [TP-Stunde](https://www.notion.so/xxx/xxx-5f0a43d9abfb4ce292c9ba9) nachbereiten**';
	var content2 = 'Test';
	var res = Todoist.formatLinks(content);
	var res2 = Todoist.formatLinks(content2);
	assert.ok(res === 
		'**\uD83D\uDCDD <a href="https://www.notion.so/xxx/xxx-5f0a43d9abfb4ce292c9ba9">TP-Stunde</a> nachbereiten**');
	
	assert.strictEqual(res2, content2);
});

QUnit.test('todoistReplaceSymbolPair', function(assert){
	var contentBold = '**\uD83D\uDCDD [TP-Stunde](https://www.notion.so/xxx/xxx-5f0a43d9abfb4ce292c9ba9) nachbereiten**';
	var contentItalic = '*\uD83D\uDCDD [TP-Stunde](https://www.notion.so/xxx/xxx-5f0a43d9abfb4ce292c9ba9) nachbereiten*';
	var content = 'Test';
	var resBold = Todoist.replaceSymbolPairs(contentBold, /\*\*/g, '<b>', '</b>');
	var resItalic = Todoist.replaceSymbolPairs(contentItalic, /\*/g, '<i>', '</i>');
	
	assert.ok(resBold === 
		'<b>\uD83D\uDCDD [TP-Stunde](https://www.notion.so/xxx/xxx-5f0a43d9abfb4ce292c9ba9) nachbereiten</b>', 'Replace bold');
	assert.ok(resItalic === 
		'<i>\uD83D\uDCDD [TP-Stunde](https://www.notion.so/xxx/xxx-5f0a43d9abfb4ce292c9ba9) nachbereiten</i>', 'Replace italic');
	
	assert.strictEqual(Todoist.replaceSymbolPairs(content, /\*/g, '<i>', '</i>'), content);
	assert.strictEqual(Todoist.replaceSymbolPairs(content, /\*\*/g, '<b>', '</b>'), content);
});