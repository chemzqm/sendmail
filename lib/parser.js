var mime = require('mime'),
    async = require('async'),
    fs = require('fs');
    path = require('path'),
    marked = require('color-marked');

marked.setOptions({
  color:true,
  gfm:true
});

function parseFile(file, cb){
  file = path.resolve(process.cwd(), file);
  fs.stat(file, function(err, stat){
    if(err) cb(err);
    else if(!stat.isFile()) cb(new Error(file + " is not a file!"));
    else {
      //var stream =fs.createReadStream(file, {flags:'r', bufferSize: 76*6*1024});
      var type = mime.lookup(file);
      var name = path.basename(file);
        cb(null, {
            filePath:file,
            fileName:name,
            contentType:type
        });
    }
  });
}
function mailParser(content, config){
  this.config = config;
  this.lines = content.split('\n');
}

mailParser.prototype.parse = function(cb){
  async.series({
      to: this.parseTo.bind(this),
      cc: this.parseCc.bind(this),
      subject: this.parseSubject.bind(this),
      attachments: this.parseAttachment.bind(this),
      text: this.parseContent.bind(this)
    }, function(err, res){
      if(err) cb(err); 
      else {
        res.from = this.config.headers.from;
        this.parseImage(res);
        res.html = marked(res.text);
        cb(null, res);
      }
    }.bind(this));
};

mailParser.prototype.parseImage = function(res){
  var text = res.text;
  var imgs = [];
  res.text = text.replace(/(?:\s|^)@img\(['"](.*?)["'](?:,['"](.*?)['"])?\)/, function(str, p1, p2){
    var filePath = path.resolve(process.cwd(), p1);
    var name = path.basename(p1);
    var fileName = p2 || name;
    var cid = fileName.replace(/\.\w+$/,'') + '@node.cc';
    res.attachments.push({
      fileName : fileName,
      filePath : filePath,
      contentType : mime.lookup(filePath),
      cid : cid
    });
    return '<img src="cid:' + cid + '"/>';
  });
}

mailParser.prototype.parseAttachment = function(cb){
  var line = this.lines.shift().replace(/^attachment:\s*/,'');
  if(line) {
    var files = line.split(/\s*,\s*/);
    async.map(files, parseFile, function(err, results){
      if(err) cb(err);
      else cb(null, results);
    });
  } else cb(null, []);
};

mailParser.prototype.parseContent = function(cb){
  var content_lines = [], line = this.lines.shift();
  if(line === undefined || !/^html:/.test(line)){
    cb(new Error('could not find html section'));
    return;
  }
  line = this.lines.shift();
  while(line !== undefined && !/^-- .*--$/.test(line)){
      content_lines.push(line);
      line = this.lines.shift();
  }
  if(!content_lines.length){
    cb(new Error('no content for this email'));
  } else {
    cb(null, content_lines.join('\n'));
  }
};

mailParser.prototype.getContact = function(name, cb){
  if(/\S+@\S+/.test(name)){
    cb(null, name);
    return;
  }
  var contact = this.config.contacts[name.trim()];
  if(!contact) cb( new Error('can not find contact from mame:' +  name));
  else cb(null, contact);
};

mailParser.prototype.parseTo = function(cb){
  var line = this.lines.shift().replace(/^to:\s*/,''), names;
  if(!line) cb(new Error("could not find receiver"));
  else {
    names = line.trim().split(/\s*,\s*/);
    async.map(names, this.getContact.bind(this), function(err, res){
      if(err) cb(err);
      else cb(null, res);
    });
  }
};
mailParser.prototype.parseCc = function(cb){
  var line = this.lines[0], names;
  if(!/^cc:/.test(line)) cb(null);
  else {
    this.lines.shift();
    line = line.replace(/^cc:\s*/,"");
    names = line.split(/\s*,\s*/);
    if(!line) cb(null);
    else async.map(names, this.getContact.bind(this), function(err, res){
        if(err) cb(err);
        else cb(null, res);
      });
  }
};
mailParser.prototype.parseSubject = function(cb){
  var line = this.lines[0];
  if(!/^subject:/.test(line)) cb( new Error("could not find subject"));
  else {
    this.lines.shift();
    line = line.replace(/^subject:\s*/,"");
    if(line.trim() === "") cb( new Error("subject is empty!"));
    else cb(null, line);
  }
};
exports.mailParser = mailParser;

