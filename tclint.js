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
    if(str[strloc] == '$' && str[strloc + 1] == '{') {
      while(str[strloc] != '}') {
        strloc++;
      }
      strloc++;
      
      return strloc
    }
    
    while(str[strloc] == '$' || this.isAlphaNum(str[strloc])) {
      //console.log(str[strloc]);
      strloc++;
      
      if(strloc >= str.length) {
        break;
      }
    }
    //console.log(str[strloc])
    return strloc
  }
  
  cmdStart(str, strloc) {
    let n = this.getNextWord(str, strloc);
    if(str[n] == '(') { // array case, anychar
      while(str[n] != ')') {
        n++;
      }
      n++;
    }
    //console.log(str[n])
    let cmdstart = str.substring(strloc, n);
    
    return [n, cmdstart];
  }
  
  getCmd(str, strloc) {
    assert(str[strloc] == ' ');
    
    strloc++;
    
    let old = strloc; // doing this after removes the whitespace
    
    if(str[strloc] == '[') {
      strloc++;
      strloc = getNextWord(str, strloc);
      while(str[strloc] != ']') {
        assert(str[strloc] == ' ');
        strloc++;
        strloc = getNextWord(str, strloc)
      }
      strloc++;
    }
    else if(str[strloc] == '{') {
      strloc++;
      while(str[strloc] != '}') {
        strloc++;
      }
      strloc++;
    }
    else if(str[strloc] == '"') {
      strloc++;
      while(str[strloc] != '"') {
        strloc++;
      }
      strloc++;
    }
    else {
      return this.cmdStart(str, strloc);
    }
    
    return [strloc, str.substring(old, strloc)];
  }
  
  constructor(tcl_script) {
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
        
        console.log(cmdstart[1])
        
        while(tcl_script[i] == ' ') {        
          let nextcmd = this.getCmd(tcl_script, i);
          i = nextcmd[0]
          
          console.log(nextcmd[1])
        }
        
        //console.log(cmdstart[1])
        
        //console.log(cmdstart);
      }
      
    }
  }
}

let t_script = `set y(9) 10
# comment
puts $\{abcy}`;

let lt = new LexTCL(t_script);