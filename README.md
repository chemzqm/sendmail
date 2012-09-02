# Sendmail - Write html email quickly and send it at terminal

  Sendmail is a perfect tool for programmers who prefer to use terminal vim as editor and want to write complicated email easily with [markdown](http://daringfireball.net/projects/markdown/syntax) syntax and [highlight](http://softwaremaniacs.org/soft/highlight/en/) enabled.

## Install
``` bash
git clone https://github.com/chemzqm/sendmail.git
cd sendmail
npm install
```

## Configuration
  
* change file `sendmail/lib/profile.json.example` to
  `sendmail/lib/profile.json`.
* change text in `[]` of profile.json to your settings.
* below is an example of gmail settings:
``` json
{
  "server":{
    "USER":"chemzqm", 
    "PASSWord":"********", 
    "HOST":"smtp.gmail.com", 
    "SSL":true
  },
  "headers":{
    "from":"chemzqm <chemzqm@gmail.com>"
  },
  "footer":"Thanks,<br />Jack\n",
  "contacts":{
    "chemzqm":"chemzqm <chemzqm@gmail.com>"
  }
}
```
Server settings is the same as project: [emailjs](https://github.com/eleith/emailjs).
Headers is the default head you want to set for your email, including `from cc to subject` etc.
Contaccts is used for convenient input of contacts emails, all the contacts's names will be added to the end of email file you are editing, and what you need to do is just type the `property name` of contacts seperated by `,` to the fileds `to` and/or `cc`, the property name will be converted to property value before email sending.

