if exists("b:current_syntax")
  finish
endif

if !exists("main_syntax")
  let main_syntax = 'email'
endif

silent! syntax include @mailMarkdown syntax/markdown.vim
unlet! b:current_syntax

syn case match

syn match mailHeader /^\(to\|cc\|subject\|attachment\):/
syn region mailContent matchgroup=mailHeader start="^html:\s*$" matchgroup=mailComment end="^--\s.*\s--$" contains=@mailMarkdown nextgroup=mailContacts skipnl
syn region mailContacts start="^\w" end="^\s" contained contains=mailIdentifier,mailStatement
syn region mailStatement matchgroup=mailIdentifier start="<" matchgroup=mailIdentifier end=">" contained nextgroup=mailSettings skipnl skipwhite
syn region mailSettings start="^\s*vim" end="$" contained

hi def link mailHeader        PreProc
hi def link mailComment       Comment
hi def link mailContacts      String
hi def link mailStatement     Statement
hi def link mailIdentifier    Identifier
hi def link mailSettings      NonText

let b:current_syntax = "email"

if main_syntax == "email"
  unlet main_syntax
endif
