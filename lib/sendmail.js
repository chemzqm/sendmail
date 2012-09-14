var mail = require('emailjs'),
    clog = require('clog'),
    path = require('path'),
    readline = require('readline'),
    async = require('async'),
    parser = require('./parser'),
    spawn = require('child_process').spawn,
    exec = require('child_process').exec,
    fs = require('fs');

var createFileName = (function(){
  function pad(v){
    return v < 10? '0' + v: v+ '';
  }
  return function(){
    var d = new Date();
    return  pad(d.getMonth() + 1) + pad(d.getDate()) + pad(d.getHours()) + pad(d.getMinutes()) + '.email';
  };
})();

function pad(str, width){
  var len = Math.max(0, width - str.length);
  return str + Array(len).join(' ');
}

function prepareFile(cb){
  //parpare text for email file
  var extra = "", text, dir, filename;
  if(this.contacts) {
    var contacts = this.contacts;
    Object.keys(contacts).reduce(function(p, v, i){
      extra +=pad('"' + v + '" <'+ contacts[v].replace(/\s*<.*$/,'') + '> ', 30);
      extra += i%3===0? '\n':'';
    },'');
  }
  text = "to:\n" + "cc:\n" + "subject:\n" + "attachment:\n" +
             "html:\n\n" + this.content + this.footer +
             "-- lines below is not added to email --\n" +
             extra + "\n vim:syntax=email: ";
  filename = createFileName();
  dir = path.resolve(__dirname,"..","mails");
  fs.stat(dir, function(err, stat){
    if(err) fs.mkdirSync(dir);
    filename = path.resolve(dir, filename);
    fs.writeFile(filename, text, function(err){
      if(err) cb(err);
      else {
        this.filename = filename;
        cb();
      }
    }.bind(this));
  }.bind(this));
}

function changeFile(cb){
  var filename = this.filename,
      vim = spawn('vim',[filename], {stdio:[0,1,2]});
  process.stdin.setRawMode(true);
  vim.on('exit', function (code) {
    process.stdin.setRawMode(false);
    clog.info('vim exit with code: ' + code);
    if(code === 0) cb();
    else cb(new Error('vim exit with code ' + code));
  }.bind(this));
}

function parseFile(cb){
  fs.readFile(this.filename, 'utf8', function(err, data){
    if (err) cb(err);
    else {
      var mailParser = new parser.mailParser(data, this);
      mailParser.parse(function (err, res){
        if(err) cb(err);
        else cb(null, res);
      }.bind(this));
    }
  }.bind(this));
}

function sendMail(message, cb){
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question("send this email? [Y]: ",function(answer){
    var reject = ["no", "N", "n"];
    rl.close();
    if(~reject.indexOf(answer)) cb(null,'canceled');
    else {
      var server = mail.server.connect(this.server);
      server.send(message, function(err, msg) {
        if(err) cb(err);
        else cb(null, msg);
      });
    }
  }.bind(this));
}

function send(config, cb){
    var filename = config.filename, procs = [];
    if(!filename) { 
      config.quiet = false;
      procs.push(prepareFile.bind(config));
    }
    if(config.quiet !== true) procs.push(changeFile.bind(config));
    procs.push(parseFile.bind(config));
    procs.push(sendMail.bind(config));
    async.waterfall(procs, function(err, res){
      if(err) cb(err);
      else cb(null, res);
    });
}
/**
 * Pass configuration file and send email
 *
 * options:
 *   file [String] : optional email file or file number for sendmail
 *   content [String] : optional content for send
 *   quiet [Boolean] : if it's true mail will not be editted by vim
 *
 */
module.exports = function(options, cb){
    var file = options.file,
        profile = options.profile ? 'profile.' + options.profile + '.json' : 'profile.json';
    fs.readFile(__dirname + '/' + profile, 'utf8', function(err, data){
        if(err) cb(err);
        else {
          config = JSON.parse(data);
          config.content = options.content ||"";
          if(file) {
              file = /\.email$/.test(file)? file : file + ".email";
              config.filename = path.resolve(__dirname,'../mails', file);
          }
          send(config, cb);
        }
    });
};

module.exports.send= send;
