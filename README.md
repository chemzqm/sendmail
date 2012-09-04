# Sendmail - Write html email quickly and send it at terminal

  Sendmail is a perfect tool for programmers who prefer to use terminal vim as editor and want to write complicated email easily with [markdown](http://daringfireball.net/projects/markdown/syntax) syntax and [highlight](http://softwaremaniacs.org/soft/highlight/en/) enabled.

## Install
``` bash
git clone https://github.com/chemzqm/sendmail.git
cd sendmail
npm install
```

## Configuration
  
* Change file `sendmail/lib/profile.json.example` to
  `sendmail/lib/profile.json`.
* Change text in `[]` of profile.json to your settings.
* Below is an example of gmail settings:

  ``` json
  {
    "server":{
      "user":"chemzqm", 
      "domain":"[127.0.0.1]",
      "password":"********", 
      "host":"smtp.gmail.com", 
      "port":465
        authentication : "login",        // auth login is supported; anything else is no auth
      "ssl":true
    },
    "headers":{
      "from":"chemzqm <chemzqm@gmail.com>"
    },
    "footer":"Thanks,<br />Jack\n",  // will be added to the end of your email
    "contacts":{
      "chemzqm":"chemzqm <chemzqm@gmail.com>"
    }
  }
  ```
  Server settings is the same as project: [mailder](https://github.com/Marak/node_mailer).

  Headers is the default head you want to set for your email, including `from cc to subject` etc.

  Contacts is used for convenient input of contacts emails, all the contact's names will be added to the end of email file you are editing, and what you need to do is just type the `property name` of contacts seperated by `,` to the fields `to` and/or `cc`, the property name will be converted to property value before email sending.

## Usage

* Make sure path `~/bin` is included in `$PATH`, if not, add below to your file `~/.bashrc`

  ``` bash
  export $PATH=$PATH:~/bin
  ```

* Enable sendmail by :

  ``` bash
  $ ln -s /full/path/to/bin/sendmail ~/bin/sendmail
  ```

* Send a new email:

  ``` bash
  $ sendmail
  ```

  with optional file content as email content

  ``` bash
  $ sendmail filename
  ```

* Get help:
  ``` bash
  $ sendmail -h

  Usage: sendmail [options] [number|filename]

  Options:

    -h, --help                     output usage information
    -V, --version                  output the version number
    -l --list                      show all mails with filename number subject
    -e --edit <number|filename>    edit previous mail and send
    -d --delete <number|filename>  remove previous mail
    -c --cat <number|filename>     show email content
    -g --grep <text>               grep text in all emails

  ```

## Notice

Multi profile support and attachment is not supported yet.

## License

MIT <3
