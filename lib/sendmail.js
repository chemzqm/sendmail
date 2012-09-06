var mail = require('emailjs'),
    clog = require('clog'),
    path = require('path'),
    readline = require('readline'),
    async = require('async'),
    util = require('./util.js'),
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

function prepareFile(config, cb){
  //parpare text for email file
  var extra;
  if(config.contacts) {
    var contacts = config.contacts;
    extra = Object.keys(contacts).reduce(function(p, c){
      p += c;
    },'');
  }
  var text = "to:\n" + "cc:\n" + "subject:\n" + "attachment:\n" +
             "html:\n\n" + config.content || "" + config.footer || "" +
             "-- lines below is not added to email --\n" +
             extra;
  var filename = createFileName();
  var dir = path.resolve(__dirname,"..","mails");
  fs.stat(dir, function(err, stat){
    if(err) fs.mkdirSync(dir);
    filename = path.resolve(dir, filename);
    fs.writeFile(filename, text, function(err){
      if(err) cb(err);
      else {
        config.filename = filename;
        cb(null, config);
      }
    });
  });
}

function changeFile(config, cb){
  var filename = config.filename,
      vim = spawn('vim',[filename], {stdio:[0,1,2]});
  process.stdin.setRawMode(true);
  vim.on('exit', function (code) {
    process.stdin.setRawMode(false);
    clog.info('vim exit with code: ' + code);
    if(code === 0) cb(null, config);
    else cb(new Error('vim exit with code ' + code));
  });
}

function parseFile(config, cb){
  fs.readFile(config.filename, 'utf8', function(err, data){
    if (err) cb(err);
    else {
      var mailParser = new util.mailParser(data, config);
      mailParser.parse(function (err, res){
        if(err) cb(err);
        else cb(null, config, res);
      });
    }
  });
}

function sendMail(config, message, cb){
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question("send this email? [Y]: ",function(answer){
    var reject = ["no", "N", "n"];
    rl.close();
    if(~reject.indexOf(answer)) cb(null);
    else {
      var server = mail.server.connect(config.server);
      server.send(message, function(err, msg) {
        if(err) cb(err);
        else cb(null, msg);
      });
    }
  });
}

function sendEmail(config, cb){
    var filename = config.filename, procs;
    if(!filename) { 
      config.quiet = false;
      procs.push(function(cb){
        prepareFile.call(null, config, cb);
      });
    }
    if(config.quiet !== true) procs.push(changeFile);
    procs.push(parseFile);
    procs.push(sendEmail);
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
    if(file){
        file = /\.email$/.test(file)? file : file + ".email";
        config.filename = path.resolve(__dirname,'../mails', file);
    }
    fs.readFile(__dirname + '/' + profile, 'utf8', function(err, data){
        if(err) cb(err);
        else {
          config = JSON.parse(data);
          config.content = options.content;
          sendEmail(config, cb);
        }
    });
};

module.exports.sendmail = sendmail;
