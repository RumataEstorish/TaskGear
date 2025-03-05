/*global Tree, Utils*/

QUnit.module("treeTest.js");

QUnit.test('create tree child have parent', function(assert){
	var res = [];
    var p1 = {id : 0};
    var p2 = {id : 2, parent_id : 0};
    var p4 = { id: 4, parent_id: 0};
    var p3 = {id : 3};
    var tree = new Tree();
       
    res = tree.createTree([p1, p2, p3, p4]);

    assert.strictEqual(res.length, 2, 'Root count');
    assert.strictEqual(res[0], p1, 'Parent');
    assert.strictEqual(res[0].children[0], p2, 'Child');
    assert.strictEqual(res[0].children.length, 2, 'Children length');
    assert.strictEqual(res[1], p3);
});


QUnit.test('create tree child have no parent', function(assert){
	var res = [];
    var p1 = {id : 0};
    var p2 = {id : 2, parent_id : 1};
    var tree = new Tree();
       
    res = tree.createTree([p1, p2]);

    assert.strictEqual(res.length, 2, 'Root count');
    assert.strictEqual(res[0], p1, 'Parent 1');
    assert.strictEqual(res[1], p2, 'Parent 2');
});

QUnit.test('sort tree test', function(assert){
	var res = [];
    var p1 = {id : 0, test: 1};
    var p2 = {id : 1, test: 0};
    var p3 = {id : 2, test: 2};
    var p4 = {id : 4, parent_id : 0, test: 10};
    var p5 = {id: 5, parent_id: 0, test: 9, cat: 2};
    var p6 = {id: 6, parent_id: 0, test: 8, cat: 1};
    var p7 = {id: 7, parent_id: 0, test: 9, cat: 0};
    var tree = new Tree();
       
    res = tree.createTree([p1, p2, p3, p4, p5, p6, p7]);
    
    tree.sortTree(res, function(arr){
    	arr.sort(Utils.dynamicSortMultiple('test', 'cat'));
    });
    
    assert.strictEqual(res[0], p2, 'P2 first');
    assert.strictEqual(res[1], p1, 'P1 second');
    assert.strictEqual(res[2], p3, 'P3 third');
    
    assert.strictEqual(res[1].children[0], p6, 'P6 child first');
    assert.strictEqual(res[1].children[1], p7, 'P7 child second');
    assert.strictEqual(res[1].children[2], p5, 'P5 child third');
    assert.strictEqual(res[1].children[3], p4, 'P4 child fourth');
});

QUnit.test('flat tree test', function(assert){
	var res = [];
    var p1 = {id : 0, test: 1};
    var p2 = {id : 1, test: 0};
    var p3 = {id : 2, test: 2};
    var p4 = {id : 4, parent_id : 0, test: 10};
    var p5 = {id: 5, parent_id: 0, test: 9, cat: 2};
    var p6 = {id: 6, parent_id: 0, test: 8, cat: 1};
    var p7 = {id: 7, parent_id: 0, test: 9, cat: 0};
    var tree = new Tree();
       
    res = tree.createTree([p1, p2, p3, p4, p5, p6, p7]);
    
    tree.sortTree(res, function(arr){
    	arr.sort(Utils.dynamicSortMultiple('test', 'cat'));
    });
    
    res = tree.flatTree(res);
    
    assert.strictEqual(res[0], p2, 'P2');
    assert.strictEqual(res[1], p1, 'P1');
    assert.strictEqual(res[2], p6, 'P6');
    assert.strictEqual(res[3], p7, 'P7');
    assert.strictEqual(res[4], p5, 'P5');
    assert.strictEqual(res[5], p4, 'P4');
    assert.strictEqual(res[6], p3, 'P3');
});

QUnit.test('crateFlatTree test', function(assert){
	var res = [];
    var p1 = {id : 0, test: 1};
    var p2 = {id : 1, test: 0};
    var p3 = {id : 2, test: 2};
    var p4 = {id : 4, parent_id : 0, test: 10};
    var p5 = {id: 5, parent_id: 0, test: 9, cat: 2};
    var p6 = {id: 6, parent_id: 0, test: 8, cat: 1};
    var p7 = {id: 7, parent_id: 0, test: 9, cat: 0};

    res = new Tree().createFlatTree([p1, p2, p3, p4, p5, p6, p7], function(arr){
    	arr.sort(Utils.dynamicSortMultiple('test', 'cat'));
    });
    
    assert.strictEqual(res[1].test, 1);
    assert.strictEqual(res[0], p2, 'P2');
    assert.strictEqual(res[1], p1, 'P1');
    assert.strictEqual(res[2], p6, 'P6');
    assert.strictEqual(res[3], p7, 'P7');
    assert.strictEqual(res[4], p5, 'P5');
    assert.strictEqual(res[5], p4, 'P4');
    assert.strictEqual(res[6], p3, 'P3');
    
    assert.strictEqual(res[3].level, 1);
    assert.strictEqual(res[0].level, 0);
});