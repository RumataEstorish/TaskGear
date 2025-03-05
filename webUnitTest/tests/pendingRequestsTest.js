/*global PendingRequests*/
QUnit.module("pendingRequestsTest.js");

QUnit.test('addRequestTest', function(assert){
	var pendingRequests = new PendingRequests();
	pendingRequests.add('[{"type" : "item_add"}]');
	pendingRequests.add('[{"type" : "item_update"}]');
	
	assert.ok(pendingRequests.create.length === 1, 'createElementExist');
	assert.ok(pendingRequests.update.length === 1, 'updateElementExist');
	assert.ok(pendingRequests.requests.create.length === 1 && pendingRequests.requests.update.length === 1, 'requests field have create and update');
});

QUnit.test('clearRequestTest', function(assert){
	var pendingRequests = new PendingRequests();
	pendingRequests.add('[{"type" : "item_add"}]');
	pendingRequests.add('[{"type" : "item_update"}]');
	
	pendingRequests.clear();
	assert.ok(pendingRequests.create.length === 0);
	assert.ok(pendingRequests.update.length === 0);
	assert.ok(pendingRequests.requests.create.length === 0 && pendingRequests.requests.update.length === 0);
});

QUnit.test('changeRequestIdTest', function(assert){
	var pendingRequests = new PendingRequests();
	pendingRequests.add('[{"type" : "item_add"}]');
	pendingRequests.add('[{"type" : "item_update", "args" : {"id" : "12345"}}]');
	pendingRequests.add('[{"type" : "item_update", "args" : {"id" : "56789"}}]');
	
	pendingRequests.changeRequestId('56789', '00000');
	assert.ok(pendingRequests.update[1].args.id === '00000');
	assert.ok(pendingRequests.update[0].args.id === '12345');
});