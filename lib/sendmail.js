var mail = require('emailjs'),
    clog = require('clog'),
    path = require('path'),
    readline = require('readline'),
    util = require('./util.js'),
    spawn = require('child_process').spawn,
    exec = require('child_process').exec,
    fs = require('fs');


var config;


function prepareFile(cb){
  //parpare text for email file
  var extra = "";
  if(config.contacts){
    var contacts = config.contacts;
    for(var name in contacts){
      extra += name + " ";
    }
  }
  config.content = config.content || "";
  var text = "to:\n" +
             "cc:\n" +
             "subject:\n" +
             "html:\n\n" +
             config.content + 
             config.footer +
             "-- lines below is not added to email --\n" +
             extra;
  var filename = function(){
    function pad(v){
      return v < 10? '0' + v: v+ '';
    }
    var d = new Date();
    return  pad(d.getMonth() + 1) + pad(d.getDate()) + pad(d.getHours()) + pad(d.getMinutes()) + '.email';
  }();
  var dir = path.resolve(__dirname,"..","mails");
  fs.stat(dir, function(err, stat){
    if(err) fs.mkdirSync(dir);
    //write content
    filename = path.resolve(dir, filename);
    fs.writeFile(filename, text, function(err){
      if(err) clog.error(err); 
      cb(filename);
    });
  });
}

function changeFile(filename, cb){
  var vim = spawn('vim',[filename], {stdio:[0,1,2]});
  process.stdin.setRawMode(true);
  vim.on('exit', function (code) {
    process.stdin.setRawMode(false);
    clog.info('vim exit with code: ' + code);
    if(code === 0){
      cb(filename);
    }
  });
}

function parseFile(filename, cb){
  fs.readFile(filename, 'utf-8', function(err, data){
    var mailParser = new util.mailParser(data, config);
    mailParser.parse();
    cb(mailParser.getHeaders());
  });
}

function sendMail(message, filename){
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question("send this email? [Y]: ",function(answer){
    var reject = ["no", "N", "n"];
    if(~reject.indexOf(answer)){
      rl.question("keep this email? [Y]: ", function(answer){
        if(~reject.indexOf(answer)){
          exec('rm ' + filename,function(err, stdout, stderr){
            if(err) clog.error(err);
            rl.close();
            console.log(stdout);
          });
        }else{
          rl.close();
        }
      });
      return;
    } 
    rl.close();
    var server = mail.server.connect(config.server);
    server.send(message, function(err, message) {
      if(err) clog.error(err);
      else
        clog.info('email send successfully!');
    });
    
  });
}

function sendFile(filename, quiet){
    if(!filename){//new file
        prepareFile(function(filename){
            if(!filename){ clog.error("Email file not created"); }
            sendFile(filename, false);
        });
        return;
    }
    var cb = function(){
        parseFile(filename, function(o){
            sendMail(o,filename);
        });
    };
    if(quiet === true){
        cb();
    }else{
        changeFile(filename, cb);
    }
}
module.exports = function(options){
    var filename, file = options.file;
    if(file){
        if(!/\.email$/.test(file)){
            file = file + ".email";
        }
        filename = path.resolve(__dirname,'../mails', file);
    }
    var profile = options.profile ? 'profile.' + options.profile + '.json' : 'profile.json';
    fs.readFile(__dirname + '/' + profile, 'utf8', function(err, data){
        if(err) clog.error(err);
        config = JSON.parse(data);
        config.content = options.content;
        sendFile(filename, options.quiet);
    });
};
