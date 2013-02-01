var mailer = require('nodemailer'),
    clog = require('clog'),
    tty = require('tty'),
    path = require('path'),
    readline = require('readline'),
    task = require('./task'),
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
/**
 * Create file and flush default content to the file
 * @param  {Error}   err    Error instance
 * @param  {Object}   config config object of email
 * @param  {Function} next
 */
function prepareFile(err, config, next){
  if(err){ next(err); return; };
  if(config.filename){ next(); return;};
  //parpare text for email file
  var extra = "";
  if(config.contacts) {
    var contacts = config.contacts;
    Object.keys(contacts).reduce(function(p, v, i){
      extra += pad(v + ' <'+ contacts[v].replace(/\s*<.*$/,'') + '> ', 30);
      extra += ( i%3===0 ? '\n' : '');
    },'');
  }
  if(!config.text){
    config.text = ["to:", "cc:", "subject:", "attachment:", "html:",
            config.content + config.footer,
            "-- hint: @img('path', 'name') --",
            extra, " vim:syntax=email:"].join('\n');
  }
  dir = path.resolve(__dirname,"..","mails");
  fs.stat(dir, function(err, stat){
    if(err) fs.mkdirSync(dir);
    var filename = path.resolve(dir, createFileName());
    fs.writeFile(filename, config.text, function(err){
      if(err) next(err);
      else {
        config.filename = filename;
        next();
      }
    });
  });
}
/**
 * Starting editting the email file with vim
 * @param  {Error}   err    
 * @param  {Object}   config 
 * @param  {Function} next   
 */
function changeFile(err, config, next){
  if(err){ next(err); return;}
  if(config.quiet){ next(); return;}
  vim = spawn('vim',[config.filename], {stdio:[0,1,2]});
  process.stdin.setRawMode(true);
  vim.on('exit', function (code) {
    process.stdin.setRawMode(false);
    clog.info('vim exit with code: ' + code);
    if(code === 0) next();
    else next(new Error('vim exit with code ' + code));
  });
}

/**
 * Parse the file content to object
 */
function parseFile(err, config, next){
  if(err){ next(err); return;}
  fs.readFile(config.filename, 'utf8', function(err, data){
    if (err) next(err);
    else {
      config.text = data;
      var mailParser = new parser.mailParser(data, config);
      mailParser.parse(function (err, res){
        if(err) next(err);
        else{
          config.message = res;
          next();
        }
      });
    }
  });
}

function sendMail(err, config, next){
  if(err){next(err); return;}
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question("send this email? [Y]: ",function(answer){
    var reject = ["no", "N", "n"];
    rl.close();
    if(~reject.indexOf(answer)) next(null,'canceled');
    else {
      var transport = mailer.createTransport(config.server.type || "SMTP", config.server);
      transport.sendMail(config.message, function(err) {
        if(err) next(err);
        else next(null, "done");
        transport.close();
      });
    }
  });
}

function send(config, cb){
    var proc = new task();
    proc.next(prepareFile)
        .next(changeFile)
        .next(parseFile)
        .next(sendMail)
        .next(cb);
    proc.start(null, config);
}
/**
 * Pass configuration file and send email
 *
 * options:
 *   file [String] : optional full path email file for sendmail
 *   content [String] : optional content for send
 *   quiet [Boolean] : if it's true mail will not be editted by vim
 *
 */
module.exports = function(options, cb){
    var  profile = options.profile ? 'profile.' + options.profile + '.json' : 'profile.json';
    fs.readFile(__dirname + '/' + profile, 'utf8', function(err, data){
        if(err) cb(err);
        else {
          var config = JSON.parse(data);
          config.content = options.content || "";
          config.quiet = options.quiet;
          var file = options.file;
          if(file) {
              fs.stat(file, function(err, stats){
                if(err || !stats.isFile()){
                  cb(new Error('File: ' + file + ' not exist! '));
                }else{
                  config.filename = file;
                  send(config, cb);
                }
              })
          }else{
            send(config, cb);
          }
        }
    });
};

module.exports.send = send;
