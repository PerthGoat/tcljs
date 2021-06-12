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
    let bracket_cnt = 0;
    if(str[strloc] == '{') {
      bracket_cnt++;
      while(bracket_cnt > 0) {
        strloc++;
        if(str[strloc] == '{') {
          bracket_cnt++;
        } else if(str[strloc] == '}') {
          bracket_cnt--;
        }
      }
      strloc++;
      
      return strloc;
    }
    
    while(this.isAlphaNum(str[strloc])) {
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
    } else if(word_type_lookahead == '[') {
      return this.getCmd(str, strloc - 1);
    }
    
    
    let raw_word = this.getNextWord(str, strloc);
    
    let ret_type = {};
    ret_type[word_type] = str.substring(strloc, raw_word);
    
    if(str[raw_word] == '(' && word_type == 'varexp') {
      let new_word = raw_word;
      while(str[new_word] != ')') {
        new_word++;
      }
      new_word++;
      
      ret_type[word_type] = {varexp: ret_type[word_type], index: str.substring(raw_word + 1, new_word - 1)};
      
      raw_word = new_word;
    }
    
    return [raw_word, ret_type];
  }
  
  cmdStart(str, strloc) {
    let type = '';
    let n = this.smartGetNextWord(str, strloc);
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
      strloc = this.smartGetNextWord(str, strloc)[0];
    }
    else if(str[strloc] == '"') {
      type = 'quote';
      let sb = '';
      //let sbc = [];
      strloc++;
      while(str[strloc] != '"') {
        let n = this.smartGetNextWord(str, strloc);
        if(n[0] > strloc) {
          if(sb.length > 0) {
            word_build.push({qqneutral: sb});
            sb = '';
          }
          strloc = n[0];
          word_build.push(n[1]);
        } else {
          sb += str[strloc];
          strloc++;
        }
      }
      //console.log(sbc);
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
    
    if(type == 'bracket') {
      end_var[type] = end_var[type].slice(1,-1);
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
    
    return this.tcl_lex_obj;
  }
}

let proc_list = {};
let var_list_scoped = [];

function getCurrentLevel() {
  return var_list_scoped.length - 1;
}

function trysub(wrd, level) {
  if('cmdexp' in wrd) {
    wrd = wrd['cmdexp'];
    wrd = wrd.map(x => ({'word': x}));
    wrd[0] = {'start': wrd[0]['word']};
    return {word: runTCLInterpreter(wrd, level)};
  } else if('varexp' in wrd) {
    return var_list_scoped[level][wrd['varexp']]
  } else {
    return wrd;
  }
}

function runTCLInterpreter(tcl_str, level) {
  let line_count = 0; // for compiler errors
  if(var_list_scoped[level] == undefined) {
    var_list_scoped[level] = {};
  }
  let lt = undefined;
  if(typeof tcl_str == 'string') {
    lt = new LexTCL(tcl_str);
  } else { // pre-lexed
    lt = tcl_str;
  }
  
  let returnstack = []; // stack of what to return
  
  console.log(lt);
  for(let i = 0;i < lt.length;i++) {
    assert('start' in lt[i]);
    line_count++;
    if('word' in lt[i]['start']) {
      switch(lt[i]['start']['word']) {
      case 'proc':
      let name = lt[++i]['word'];
      let args = lt[++i]['word'];
      let body = lt[++i]['word'];
      proc_list[name['word']] = {args: args['bracket'], body: body['bracket']};
      break;
      case 'set':
      let varname = lt[++i]['word'];
      let valname = '';
      if(!('start' in lt[i + 1])) { // peek ahead to see if set has another parameter
        valname = trysub(lt[++i]['word'], level);
        var_list_scoped[var_list_scoped.length - 1][varname['word']] = valname;
      }
      
      returnstack.push(var_list_scoped[var_list_scoped.length - 1][varname['word']]);
      break;
      case 'puts':
      console.log(trysub(lt[++i]['word'], level)['word']);
      break;
      default:
      console.warn(`error on command ${line_count}: not implemented '${lt[i]['start']['word']}'`);
      return;
      }
    }
  }
  console.log(returnstack);
}

let t_script = `proc buildarr {z} {
  for {set i 0} {$i $z <} {incr i} {
    set x($i) [expr $i 5 +]
  }
  
  return $x
}

proc printArr {a} {
  for {set i 0} {$i 10 <} {incr i} {
    if {$a($i) 11 =} {
      puts "A is $a($i)"
    }
  }
}

set y 10

puts $y`;

runTCLInterpreter(t_script, 0);