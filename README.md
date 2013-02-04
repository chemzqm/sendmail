# Sendmail - Write html email quickly and send it at terminal

  Sendmail is a perfect tool for programmers who prefer to use terminal vim as editor and want to write complicated email easily with [markdown](http://daringfireball.net/projects/markdown/syntax) syntax and [highlight](http://softwaremaniacs.org/soft/highlight/en/) enabled.

  **Attachments**, **embeded images**, **load content from file**, **syntax highlight** are supported.

## Install

Make sure path `~/bin` is included in `$PATH`, if not, add below to your file `~/.bashrc`

  ``` bash
  export $PATH=$PATH:~/bin
  ```

  ``` bash
  git clone https://github.com/chemzqm/sendmail.git
  cd sendmail
  npm install
  ln -s bin/sendmail ~/bin/sendmail
  ```

## Configuration
  
* Change file `sendmail/lib/profile.json.example` to
  `sendmail/lib/profile.json`.
* Change text in `[]` of profile.json to your settings.
* Below is an example of gmail settings:

  ``` json
  {
    "server":{
      "auth":{
        "user":"yourname", 
        "pass":"yourpassword"
      },
      "host":"smtp.gmail.com", 
      "port":587
    },
    "headers":{
      "from":"chemzqm <chemzqm@gmail.com>"
    },
    "footer":"Thanks,<br />Jack\n",
    "contacts":{
      "chemzqm":"chemzqm <chemzqm@gmail.com>",
      "nick":"fullname <xx@xxx.com>"
    }
  }
  ```
Server settings is the same as project: [nodemailer](http://github.com/andris9/nodemailer).

Headers is the default head you want to set for your email, including `from cc to subject` etc.

Contacts is used for convenient input of contacts emails, all the contact's names will be added to the end of email file you are editing, and what you need to do is just type the `property name` of contacts seperated by `,` to the fields `to` and/or `cc`, the property name will be converted to property value before email sending.

## Enable vim highlight

  ```bash
  cp /path/to/sendmail/email.vim ~/.vim/syntax/
  ```

## Usage

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
  filter is not available yet.
  
* Mutiple support
  
  The email fields 'to', 'cc', 'attachment' could be multiple values seperated by ','


* Send *embeded image*, use the following tag in the html sention
  ``` 
  @img('/path/to/file'*[, 'imagename'])
  ```
  Notice image name is *optional*

* Command line help:
  ``` bash
  $ sendmail -h

  Usage: sendmail [options] [number|filename]

  Options:

    -h, --help                     output usage information
    -V, --version                  output the version number
    -l --list                      show all mails with filename number subject
    -e --edit <number|filename>    edit previous mail by number or filename and send
    -q --quiet                     send email without using vim to edit
    -d --delete <number|filename>  remove email, could be number separated by comma like: 0,1,2
    -c --cat <number>              show email content, could be number separated by comma like: 0,1,2
    -g --grep <text>               grep text in all emails
    -p --profile <name>            use profile when sending email specified by name

  ```


## License

MIT
