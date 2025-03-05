function Tree(){

}

Tree.prototype.createFlatTree = function(arr, sortFunc){
	var root = this.createTree(arr);
	this.sortTree(root, sortFunc);
	return this.flatTree(root);
};

Tree.prototype.flatTree = function(root){
	var flatTree = [], walkTree = function(nodes){
		for (var i = 0; i<nodes.length; i++){
			flatTree.push(nodes[i]);
			if (nodes[i].children.length > 0){
				walkTree(nodes[i].children);
			}
		}
	};
	walkTree(root);
	
	return flatTree;
};

Tree.prototype.sortTree = function(root, sortFunc){
	sortFunc(root);
	for (var i = 0; i<root.length; i++){
		if (root[i].children.length > 0){
			this.sortTree(root[i].children, sortFunc);
		}
	}
};

Tree.prototype.createTree = function(arr){
	   var tree = [],
       mappedArr = {},
       arrElem,
       mappedElem;

   // First map the nodes of the array to an object -> create a hash table.
   for(var i = 0, len = arr.length; i < len; i++) {
     arrElem = arr[i];
     mappedArr[arrElem.id] = arrElem;
     mappedArr[arrElem.id].children = [];
     mappedArr[arrElem.id].level = 0;
   }

   for (var id in mappedArr) {
     if (mappedArr.hasOwnProperty(id)) {
       mappedElem = mappedArr[id];
       // If the element is not at the root level, add it to its parent array of children.
       if (mappedElem.parent_id !== null && mappedElem.parent_id !== undefined && mappedArr[mappedElem.parent_id]) {
    	   mappedElem.level = mappedArr[mappedElem.parent_id].level + 1;
    	   mappedArr[mappedElem.parent_id].children.push(mappedElem);
       }
       // If the element is at the root level, add it to first level elements array.
       else {
         tree.push(mappedElem);
       }
     }
   }
   return tree;
};