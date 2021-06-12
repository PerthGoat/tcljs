function assert(x) {
  if(!x) {
    console.warn('ASSERT FAILED');
  }
}

// lexical analysis of code
class LexTCL {
  isAlphaNum(s) {
    return s.match(/^[a-z0-9+-/*.=><]+$/i);
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
    
    if(str[raw_word] == '(') {
      let new_word = raw_word;
      while(str[new_word] != ')') {
        new_word++;
      }
      new_word++;
      
      ret_type[word_type] = {word: ret_type[word_type], index: str.substring(raw_word + 1, new_word - 1)};
      
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
        //i++;
        continue;
      }
      
      if(i >= tcl_script.length) {
        break;
      }
      
      if(tcl_script[i] == '$' || this.isAlphaNum(tcl_script[i])) {
        
        //let n = this.getNextWord(tcl_script, i);
        //let cmdstart = tcl_script.substring(i, n);
        
        let cmdstart = this.cmdStart(tcl_script, i);
        i = cmdstart[0];
        
        this.tcl_lex_obj.push({'start': cmdstart[1]});
        //console.log(cmdstart[1])
        
        while(tcl_script[i] == ' ' && tcl_script[i + 1] != ';') {      
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
    return runTCLInterpreter(wrd, level)['pend'];
  } else if('varexp' in wrd) {
    if(typeof(wrd['varexp']) == 'string') {
      return var_list_scoped[level][wrd['varexp']];
    }
    return var_list_scoped[level][wrd['varexp']['word']][wrd['varexp']['index']];
  } else if('quote' in wrd) {
    expl = wrd['quote'];
    
    for(let i = 0;i < expl.length;i++) {
      expl[i] = trysub(expl[i], level)['word'];
    }
    return {word: expl.join('')};
  }  else if('qqneutral' in wrd) {
    return {word: wrd['qqneutral']}
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
      if(lt[i]['start']['word'] in proc_list) {
        let procedure = proc_list[lt[i]['start']['word']];
        let args = new LexTCL(procedure['args']);
        if(args.length > 0) {
          args[0] = {'word': args[0]['start']}
        }
        let args_stack = {};
        //console.log(args);
        // calculate the required arguments
        let req_args = args.length;
        for(let j = 0;j < args.length;j++) {
          if('bracket' in args[j]['word']) {
            req_args--;
          } else {
            args_stack[args[j]['word']['word']] = trysub(lt[++i]['word'], level)
          }
        }
        
        if(req_args.length > 0 && 'start' in lt[i]) {
          console.warn(`error on command ${line_count}: not enough words passed to ${lt[i]['start']['word']}`);
        }
        
        // run the function
        //console.log(procedure);
        let body = procedure['body'];
        let next_level = getCurrentLevel() + 1;
        var_list_scoped[next_level] = args_stack;
        
        returnstack.push(runTCLInterpreter(body, next_level));
        var_list_scoped.pop();
        //console.log(lt[i]);
        continue;
      }
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
      let index = '';
      if(typeof(varname['word']) != 'string') {
        index = varname['word']['index'];
        varname = varname['word']['word'];
      } else {
        varname = varname['word'];
      }
      if(!('start' in lt[i + 1])) { // peek ahead to see if set has another parameter
        valname = trysub(lt[++i]['word'], level);
        if(index != '') {
          if(var_list_scoped[level][varname] == undefined) {
            var_list_scoped[level][varname] = {};
          }
          var_list_scoped[level][varname][index] = valname;
        } else {
          var_list_scoped[level][varname] = valname;
        }
      }
      //console.log(var_list_scoped);
      returnstack.push(var_list_scoped[level][varname]);
      break;
      case 'puts':
      let toput = trysub(lt[++i]['word'], level)['word'];
      if(toput == undefined) {
        toput = trysub(lt[i]['word'], level)['bracket']
      }
      console.log(toput);
      document.getElementById('resultbox').value += toput + '\n';
      break;
      case 'return':
      return trysub(lt[++i]['word'], level);
      case 'uplevel': // to modify variables in different stack instances
      let mylevel = {word: level - 1};
      if(!('start' in lt[i + 2])) {
        mylevel = trysub(lt[++i]['word'], level);
      }
      if('varexp' in lt[i + 1]['word']) {
        lt[i+1]['word'] = trysub(lt[i+1]['word'], level)
      }
      returnstack.push(runTCLInterpreter(lt[++i]['word']['bracket'], parseInt(mylevel['word'])));
      break;
      case 'while': // looping statement
        let wcondition = trysub(lt[++i]['word'], level);
        let wbody = trysub(lt[++i]['word'], level);
        let w_cond_text = 'expr ' + wcondition['bracket'];
        let w_cond_result = runTCLInterpreter(w_cond_text, level)['pend']['word'];
        
        while(w_cond_result) {
          let res = runTCLInterpreter(wbody['bracket'], level);
          if(res != undefined && !('pend' in res)) { // bubble return out from if statement
            return res;
          }
          w_cond_result = runTCLInterpreter(w_cond_text, level)['pend']['word'];
        }
      break;
      case 'if': // basic control statement
      let condition = trysub(lt[++i]['word'], level);
      let ifbody = trysub(lt[++i]['word'], level);
      let elsebody = '';
      if(!('start' in lt[i + 1])) {
        elsebody = trysub(lt[++i]['word'], level);
      }
      let condition_text = 'expr ' + condition['bracket'];
      //console.log(condition_text);
      let cond_result = runTCLInterpreter(condition_text, level)['pend']['word'];
      
      if(cond_result) {
        let res = runTCLInterpreter(ifbody['bracket'], level);
        if(res != undefined && !('pend' in res)) { // bubble return out from if statement
          return res;
        }
      } else if(elsebody != '') {
        let res = runTCLInterpreter(elsebody['bracket'], level);
        if(res != undefined && !('pend' in res)) { // bubble return out from if statement
          return res;
        }
      }
      //console.log(condition, ifbody, elsebody);
      break;
      case 'expr': // basic reverse polish math parsing
      let math_stack = [];
      i++;
      while(!('start' in lt[i])) {
        let term = trysub(lt[i]['word'], level);
        let stack_len = math_stack.length;
        // math code here
        switch(term['word']) {
          case '+':
          math_stack[stack_len-2] = math_stack[stack_len-2] + math_stack[stack_len-1];
          math_stack.pop();
          break;
          case '-':
          math_stack[stack_len-2] = math_stack[stack_len-2] - math_stack[stack_len-1];
          math_stack.pop();
          break;
          case '*':
          math_stack[stack_len-2] = math_stack[stack_len-2] * math_stack[stack_len-1];
          math_stack.pop();
          break;
          case '/':
          math_stack[stack_len-2] = math_stack[stack_len-2] / math_stack[stack_len-1];
          math_stack.pop();
          break;
          case '=':
          math_stack[stack_len-2] = math_stack[stack_len-2] == math_stack[stack_len-1];
          math_stack.pop();
          break;
          case '>':
          math_stack[stack_len-2] = math_stack[stack_len-2] > math_stack[stack_len-1];
          math_stack.pop();
          break;
          case '<':
          math_stack[stack_len-2] = math_stack[stack_len-2] < math_stack[stack_len-1];
          math_stack.pop();
          break;
          default:
          math_stack.push(parseFloat(term['word']));
        }
        // end math code
        i++;
        if(i >= lt.length) {
          break;
        }
      }
      //console.log(math_stack);
      returnstack.push({word: math_stack[0]});
      break;
      default:
      console.warn(`error on command ${line_count}: not implemented '${lt[i]['start']['word']}'`);
      return;
      }
    }
    else if('varexp' in lt[i]['start']) {
      newcmd = var_list_scoped[level][lt[i]['start']['varexp']]['bracket']
      returnstack.push(runTCLInterpreter(newcmd, level));
    }
  }
  //var_list_scoped[level] = undefined;
  return {'pend': returnstack[returnstack.length - 1]};
}

let t_script = `

set a hello
set b "$a world"

puts $b

`;

//console.log(new LexTCL(t_script));

runTCLInterpreter(t_script, 0);
console.log(var_list_scoped);

function button_hookup() {
  let runval = runTCLInterpreter(document.getElementById('commandbox').value, 0);
  if(!('pend' in runval)) {
    document.getElementById('resultbox').value += runval + '\n';
  }
  document.getElementById('resultbox').value += 'done\n';
}