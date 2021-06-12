class tcltd {
  constructor(tcl_script) {
    console.log(tcl_script);
  }
  
  runTcl() {
    
  }
  
}

function assert(x) {
  if(!x) {
    console.warn('ASSERT FAILED');
  }
}

// lexical analysis of code
class LexTCL {
  isAlphaNum(s) {
    return s.match(/^[a-z0-9]+$/i);
  }
  
  getNextWord(str, strloc) {
    if(str[strloc] == '{') {
      while(str[strloc] != '}') {
        strloc++;
      }
      strloc++;
      
      return strloc;
    }
    
    while(str[strloc] == '$' || this.isAlphaNum(str[strloc])) {
      //console.log(str[strloc]);
      strloc++;
      
      if(strloc >= str.length) {
        break;
      }
    }
    //console.log(str[strloc])
    return strloc;
  }
  
  smartGetNextWord(str, strloc) {
    let word_type_lookahead = str[strloc];
    let word_type = 'word';
    if(word_type_lookahead == '$') {
      word_type = 'varexp';
      strloc++;
    }
    
    let raw_word = this.getNextWord(str, strloc);
    
    let ret_type = {};
    ret_type[word_type] = str.substring(strloc, raw_word);
    
    return [raw_word, ret_type];
  }
  
  cmdStart(str, strloc) {
    let type = '';
    let n = this.smartGetNextWord(str, strloc);
    if(str[n[0]] == '(') { // array case, anychar
      type = 'array';
      while(str[n[0]] != ')') {
        n[0]++;
      }
      n[0]++;
    }
    let cmdstart = {};
    
    if(type != '') {
      cmdstart[type] = str.substring(strloc, n[0]);
    } else {
      cmdstart = n[1];
    }
    
    
    return [n[0], cmdstart];
  }
  
  getCmd(str, strloc) {
    assert(str[strloc] == ' ');
    
    let type = '';
    
    strloc++;
    
    let old = strloc; // doing this after removes the whitespace
    
    let word_build = [];
    
    if(str[strloc] == '[') {
      type = 'cmdexp';
      strloc++;
      let n = this.smartGetNextWord(str, strloc);
      word_build.push(n[1]);
      strloc = n[0];
      while(str[strloc] != ']') {
        assert(str[strloc] == ' ');
        strloc++;
        n = this.smartGetNextWord(str, strloc);
        word_build.push(n[1]);
        strloc = n[0];
      }
      strloc++;
    }
    else if(str[strloc] == '{') {
      type = 'bracket';
      strloc++;
      while(str[strloc] != '}') {
        strloc++;
      }
      strloc++;
    }
    else if(str[strloc] == '"') {
      type = 'quote';
      strloc++;
      while(str[strloc] != '"') {
        strloc++;
      }
      strloc++;
    }
    else {
      return this.cmdStart(str, strloc);
    }
    
    let end_var = {};
    end_var[type] = str.substring(old, strloc)
    
    if(word_build.length > 0) {
      end_var[type] = word_build;
    }
    
    return [strloc, end_var];
  }
  
  constructor(tcl_script) {
    this.tcl_lex_obj = [];
    //console.log(this.smartGetNextWord(tcl_script, 0));
    for(let i = 0;i < tcl_script.length;i++) {
      while(tcl_script[i] == ' ' || tcl_script[i] == '\t' || tcl_script[i] == '\n') {
        i++;
      }
      
      if(tcl_script[i] == '#') {
        while(tcl_script[i] != '\n') {
          i++;
        }
        i++;
      }
      
      if(tcl_script[i] == '$' || this.isAlphaNum(tcl_script[i])) {
        
        //let n = this.getNextWord(tcl_script, i);
        //let cmdstart = tcl_script.substring(i, n);
        
        let cmdstart = this.cmdStart(tcl_script, i);
        i = cmdstart[0];
        
        this.tcl_lex_obj.push({'start': cmdstart[1]});
        //console.log(cmdstart[1])
        
        while(tcl_script[i] == ' ') {        
          let nextcmd = this.getCmd(tcl_script, i);
          i = nextcmd[0]
          
          this.tcl_lex_obj.push({'word': nextcmd[1]});
          //console.log(nextcmd[1])
        }
        
        //console.log(cmdstart[1])
        
        //console.log(cmdstart);
      }
      
    }
    
    console.log(this.tcl_lex_obj);
  }
}

let t_script = `set y(9) 10
# comment
puts [expr 5 9 $a]`;

let lt = new LexTCL(t_script);