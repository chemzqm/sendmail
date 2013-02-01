function task(){
  var queue = []; 
  var obj;
  this.next = function(fn){
    var len = queue.length;
    queue.push(function(){
      var args = Array.prototype.slice.call(arguments);
      var next = queue[len + 1]; 
      if(args[1] !== undefined){
        obj = args[1];
      }else{
        args[1] = obj;
      }
      args[2] = next || function(){};
      fn.apply(null, args);
      if(!next){
        queue = null; 
        obj = null;
      }   
    }); 
    return this;
  }
  this.start = function(){
    return queue[0] && queue[0].apply(null, arguments);
  }
}

module.exports = task;