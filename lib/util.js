var clog = require('clog'),
    marked = require('auto-marked');

marked.setOptions({
  color:true,
  gfm:true
});

function mailParser(content, config){
  this.config = config;
  this.headers = config.headers;
  this.cur = 0;
  this.lines = content.split('\n');
}

mailParser.prototype.next = function(){
  if(this.cur > this.lines.length){
    return false;
  }
  var line = this.lines[this.cur];
  this.cur = this.cur + 1;
  return line;
};

mailParser.prototype.parse = function(){
  this.parseTo();
  this.parseCc();
  this.parseSubject();
  this.parseHtml();
};

mailParser.prototype.parseHtml = function(){
  var lines = [];
  var line = this.next();
  if(/^html:/.test(line)){
    line = this.next();
    while(!/^-- .*--$/.test(line)){
        lines.push(line);
        line = this.next();
        if(line === false) break;
    }
    if(lines.legth === 0){
      clog.warn('no content will be send');
      return;
    }
    var content = lines.join('\n');
    this.headers.text = content;
    this.html = marked(content);
  }
  else{
    clog.error('could not find html section');
  }
};

mailParser.prototype.getContact = function(name){
  var contact = this.config.contacts[name.trim()];
  if(!contact){
    clog.error('Can not find contact from mame:' +  name);
  }
  return this.config.contacts[name.trim()];
};
mailParser.prototype.parseTo = function(){
  var line = this.next();
  if(/^to:/.test(line)){
    line = line.replace(/^to:\s*/,"");
    if(line.trim() === "" ){
      clog.error("send to is not defined");
      return;
    }
    this.headers.to = line.split(',').map(function(val){
       return this.getContact(val); 
      },this).join(',');
  }
  else{
    clog.error("could not find to");
  }
};
mailParser.prototype.parseCc = function(){
  var line = this.next();
  if(/^cc:/.test(line)){
    line = line.replace(/^cc:\s*/, "");
    if(line.trim() === "") return;
    this.headers.cc = line.split(',').map(function(val){
       return this.getContact(val); 
      },this).join(',');
  }
  else{
    clog.error("could not find cc");
  }
};
mailParser.prototype.parseSubject = function(){
  var line = this.next();
  if(/^subject:/.test(line)){
    line = line.replace(/^subject:\s*/,"");
    if(line.trim() === ""){
      clog.error("subject is empty!");
    }
    this.headers.subject = line;
  }
  else{
    clog.error("could not find subject");
  }
};
mailParser.prototype.getHeaders = function(){
  return this.headers;
};
exports.mailParser = mailParser;

