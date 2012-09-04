var mail = require('mailer'),
    clog = require('clog'),
    path = require('path'),
    readline = require('readline'),
    util = require('./util.js'),
    spawn = require('child_process').spawn,
    fs = require('fs');


var profile = fs.readFileSync(__dirname + '/profile.json');
var config = JSON.parse(profile);


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
    var message = mailParser.getHeaders();
    cb(message);
  });
}

function sendMail(message){
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question("send this email? [Y]: ",function(answer){
    rl.close();
    if(answer == "n" || answer == "no" || answer == "N"){
      return;
    } 
    for(var i in config.server){
      message[i] = config.server[i];
    }
    mail.send(message, function(err, message) {
      if(err) clog.error(err);
      else
        clog.info('email send successfully!');
    });
    
  });
}


module.exports = function(filename, content){
  config.content = content;
  if(filename){
    if(!/\.email$/.test(filename)){
      filename = filename + ".email";
    }
    filename = path.resolve(__dirname,'../mails', filename);
    changeFile(filename,function(filename){
      parseFile(filename,function(o){
        sendMail(o);
      });
    });
  }else{
  //start process
    prepareFile(function(filename){
      changeFile(filename, function(filename){
        parseFile(filename, function(o){
          sendMail(o);
        });
      });
    });
  }
};
