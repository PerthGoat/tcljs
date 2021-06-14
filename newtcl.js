let tcsr = `
puts [appa]
`;

function isAlphaNum(s) {
  return s.match(/^[a-z0-9+-/*.=><()$#]+$/i);
}

let ctx = document.getElementById('screenout').getContext('2d');

let varstack = [];
let procstack = {};
let exec_level = 0;
varstack.push({});

// debugging
let current_line = [1]; // holds the current line for debugging
let exec_name = ['MAIN']; // holds the current exec name for debugging

function resetS() {
  varstack = [];
  procstack = {};
  exec_level = 0;
  varstack.push({});

  // debugging
  current_line = [1]; // holds the current line for debugging
  exec_name = ['MAIN']; // holds the current exec name for debugging
}

function runSub(w) {
  if(w[0] == '{') {
    return w.substring(1, w.length - 1);
  }
  if(w[0] == '$') {
    w = w.substring(1, w.length);
    if(w[w.length - 1] == ')') {
      let spl = w.split('(');
      let name = spl[0];
      let index = runSub(spl[1].substring(0, spl[1].length - 1));
      //console.log(varstack[exec_level][name]);
      return varstack[exec_level][name][index];
    } else {
      return varstack[exec_level][w];
    }
  }
  if(w[0] == '[') {
    w = w.substring(1, w.length - 1);
    return runTCL(w);
  }
  if(w[0] == '"') {
    let ret_str = '';
    let sb_b = '';
    for(let i = 0;i < w.length;i++) {
      if(w[i] == '\\') {
        ret_str += w[++i];
        continue;
      }
      if(w[i] == '$') {
        while(w[i] != ' ' && w[i] != '\n' && i < w.length - 1) {
          sb_b += w[i++];
        }
        ret_str += runSub(sb_b) + w[i];
        sb_b = '';
      } else if(w[i] == '[') {
        sb_b += w[i];
        let watch = 1;
        i++;
        if(w[i] == ']') {
          watch--;
        }
        while(watch != 0) {
          sb_b += w[i];
          i++;
          if(w[i] == ']') {
            watch--;
          } else if(w[i] == '[') {
            watch++;
          }
        }
        sb_b += w[i];
        ret_str += runSub(sb_b);
        sb_b = '';
      }
      else {
        ret_str += w[i];
      }
    }
    return ret_str.substring(1, ret_str.length - 1);
  }
  return w;
}

function logColor(txt, color) {
  console.log(`%c${exec_level}>${txt}`, `background: ${color}`);
}

const debug = false;

function runCmd(cl) {
  if (debug) logColor(cl, '#E66');
  for(let i = 0;i < cl.length;i++) {
    cl[i] = runSub(cl[i]);
  }
  if (debug) logColor(cl, '#BBB');
  if (cl[0] in procstack) {
    let proc = procstack[cl[0]];
    let args = proc['procargs'].split(' ');
    if(proc['procargs'] == '') {
      args = [];
    }
    if(cl.length - 1 < args.length) {
      return `error not enough args passed to proc ${cl[0]}`;
    }
    exec_level++;
    
    current_line.push(1); exec_name.push(cl[0]);
    varstack.push({});
    //console.log(cl[1]);
    for(let i = 0;i < args.length;i++) {
      varstack[exec_level][args[i]] = cl[i + 1];
      //runCmd(['set', '{' + args[i] + '}', '{' + cl[i + 1] + '}']);
    }
    
    let proc_result = runTCL(proc['procbody']);
    
    varstack.pop();
    current_line.pop(); exec_name.pop();
    
    exec_level--;
    //console.log(proc);
    return proc_result;
  }
  switch(cl[0]) {
    case 'set':
    if(cl[1][cl[1].length - 1] == ')') {
      let spl = cl[1].split('(');
      let name = spl[0];
      let ind = spl[1].substring(0, spl[1].length - 1);
      if(varstack[exec_level][name] == undefined) {
        varstack[exec_level][name] = {};
      }
      varstack[exec_level][name][ind] = cl[2];
    } else {
      varstack[exec_level][cl[1]] = cl[2];
    }
    break;
    case 'proc':
    procstack[cl[1]]= {procargs: cl[2], procbody: cl[3]};
    //console.log(procstack);
    break;
    case 'puts':
    logColor('\t\n\t' + cl[1], '#BAF');
    addToResultBox('\=> ' + cl[1]);
    break;
    case 'putpixel': // putpixel x y r g b
    //logColor(`\t\n\t ${cl[1]} ${cl[2]} ${cl[3]} ${cl[4]} ${cl[5]}`, '#F00');
    let coordx = cl[1];
    let coordy = cl[2];
    let r = cl[3];
    let g = cl[4];
    let b = cl[5];
    
    ctx.fillStyle = `rgb(${r},${g},${b})`
    ctx.fillRect(parseFloat(coordx), parseFloat(coordy), 1, 1);
    
    break;
    case 'if':
      let ifstatement = cl[1];
      let ifbody = cl[2];
      let elsebody = cl[3];
      if(runTCL('expr ' + ifstatement) == 'true') {
        runTCL(ifbody);
      } else if(elsebody != undefined) {
        runTCL(elsebody);
      }
    break;
    case 'while':
      let whilestatement = cl[1];
      let whilebody = cl[2];
      while(runTCL('expr ' + whilestatement) == 'true') {
        runTCL(whilebody);
      }
    break;
    case 'uplevel':
    if (debug) logColor('UPLEVEL START', '#FF0');
    exec_level--;
    current_line.push(1);
    let tc_res = runTCL(cl[1]);
    current_line.pop();
    exec_level++;
    if (debug) logColor('UPLEVEL END', '#FF0');
    return tc_res;
    break;
    case 'return':
      return cl[1];
    break;
    case 'list':
      let cll = cl.slice(1, cl.length);
      return cll.join(' ');
    break;
    case 'expr':
    let math_stack = [];
    for(let i = 1;i < cl.length;i++) {
      if(!isNaN(parseFloat(cl[i]))) {
        math_stack.push(parseFloat(cl[i]));
      } else {
        switch(cl[i]) {
          case '+':
          math_stack[math_stack.length - 2] = math_stack[math_stack.length - 2] + math_stack[math_stack.length - 1];
          math_stack.pop();
          break;
          case '-':
          math_stack[math_stack.length - 2] = math_stack[math_stack.length - 2] - math_stack[math_stack.length - 1];
          math_stack.pop();
          break;
          case '*':
          math_stack[math_stack.length - 2] = math_stack[math_stack.length - 2] * math_stack[math_stack.length - 1];
          math_stack.pop();
          break;
          case '/':
          math_stack[math_stack.length - 2] = math_stack[math_stack.length - 2] / math_stack[math_stack.length - 1];
          math_stack.pop();
          break;
          case '=':
          math_stack[math_stack.length - 2] = math_stack[math_stack.length - 2] == math_stack[math_stack.length - 1];
          math_stack.pop();
          break;
          case '>':
          math_stack[math_stack.length - 2] = math_stack[math_stack.length - 2] > math_stack[math_stack.length - 1];
          math_stack.pop();
          break;
          case '<':
          math_stack[math_stack.length - 2] = math_stack[math_stack.length - 2] < math_stack[math_stack.length - 1];
          math_stack.pop();
          break;
        }
      }
    }
    if(math_stack.length == 0) {
      return cl[1];
    }
    return '' + math_stack[0];
    break;
    default:
    return `error unknown command ${cl[0]}`;
  }
  return '';
}

function runTCL(tcs) {
  let sb = '';

  let cmd_list = [];
  
  let lastval = '';

  for(let i = 0;i < tcs.length;i++) {
    if (tcs[i] == ' ' || tcs[i] == '\n' || tcs[i] == ';') {
      if(sb != '') {
        cmd_list.push(sb);
        sb = '';
      }
      if((tcs[i] == '\n' || tcs[i] == ';') && cmd_list.length > 0) {
        if(cmd_list[0][0] == '#') {
          cmd_list = [];
          current_line[exec_level]++;
          continue;
        }
        let cmd_result = runCmd(cmd_list);
        if(cmd_result.startsWith('error')) {
          let error_build = `${cmd_result} in ${exec_name[exec_level]} on line ${current_line[exec_level]}`
          for(let c = exec_level - 1;c >= 0;c--) {
            error_build += `\n\tcalled from line ${current_line[c]} in ${exec_name[c]}`;
          }
          
          addToResultBox(error_build);
          
        } else {
          lastval = cmd_result;
        }
        //console.log(cmd_list);
        cmd_list = [];
      }
      if(tcs[i] == '\n') current_line[exec_level]++;
      continue;
    }
    
    if(isAlphaNum(tcs[i])) {
      sb += tcs[i];
    } else if(tcs[i] == '[') {
      sb += tcs[i];
      let watch = 1;
      i++;
      if(tcs[i] == ']') {
        watch--;
      }
      while(watch != 0 && i < tcs.length) {
        if(tcs[i] == '\n') current_line[exec_level]++;
        sb += tcs[i];
        i++;
        if(tcs[i] == ']') {
          watch--;
        } else if(tcs[i] == '[') {
          watch++;
        }
      }
      if(tcs[i] != ']') {
        return 'error start square bracket without end square bracket';
      }
      sb += tcs[i];
    } else if(tcs[i] == '{') {
      sb += tcs[i];
      let watch = 1;
      i++;
      if(tcs[i] == '}') {
        watch--;
      }
      while(watch != 0 && i < tcs.length) {
        if(tcs[i] == '\n') current_line[exec_level]++;
        sb += tcs[i];
        i++;
        if(tcs[i] == '}') {
          watch--;
        } else if(tcs[i] == '{') {
          watch++;
        }
      }
      if(tcs[i] != '}') {
        return 'error start curly bracket without end curly bracket';
      }
      sb += tcs[i];
    } else if(tcs[i] == '"') {
      sb += tcs[i];
      i++;
      while(tcs[i] != '"' && i < tcs.length) {
        if(tcs[i] == '\n') current_line[exec_level]++;
        sb += tcs[i];
        i++;
      }
      if(tcs[i] != '"') {
        return 'error start quote without end quote';
      }
      sb += tcs[i];
    } else if(tcs[i] == '\\') {
      sb += tcs[++i];
    }
    else {
      return `error invalid char ${tcs[i]}`;
      //break;
    }
    
  }
  
  if(sb != '') {
    cmd_list.push(sb);
    sb = '';
  }
  
  if(cmd_list.length > 0) {
    if(cmd_list[0][0] == '#') {
      cmd_list = [];
      current_line[exec_level]++;
      return lastval;
    }
    let cmd_result = runCmd(cmd_list);
    if(cmd_result.startsWith('error')) {
      let error_build = `${cmd_result} in ${exec_name[exec_level]} on line ${current_line[exec_level]}`
      for(let c = exec_level - 1;c >= 0;c--) {
        error_build += `\n\tcalled from line ${current_line[c]} in ${exec_name[c]}`;
      }
      
      addToResultBox(error_build);
      
    } else {
      lastval = cmd_result;
    }
  }
  
  return lastval;
}
document.getElementById('code-editor').getElementsByClassName('codes')[0].value = tcsr;
/*
let t0 = performance.now();
let t_result = runTCL(tcsr);
if(t_result.startsWith('error')) {
  let error_build = `${t_result} in ${exec_name[exec_level]} on line ${current_line[exec_level]}`
  for(let c = exec_level - 1;c >= 0;c--) {
    error_build += `\n\tcalled from line ${current_line[c]} in ${exec_name[c]}`;
  }
  console.warn(error_build);
}

let t1 = performance.now();
logColor(`execution finished in ${(t1 - t0) / 1000} seconds`, '#5EBA7D');*/

function addToResultBox(s) {
  let c_res = document.getElementById('result').getElementsByClassName('resbox')[0];
  c_res.value += s + '\n';
  c_res.scrollTop = c_res.scrollHeight;
}

function runTclButton() {
  let code = document.getElementById('code-editor').getElementsByClassName('codes')[0].value;
  addToResultBox('START');
  let t0 = performance.now();
  resetS();
  let t_result = runTCL(code);
  
  if(t_result.startsWith('error')) {
    let error_build = `${t_result} in ${exec_name[exec_level]} on line ${current_line[exec_level]}`
    for(let c = exec_level - 1;c >= 0;c--) {
      error_build += `\n\tcalled from line ${current_line[c]} in ${exec_name[c]}`;
    }
    addToResultBox(error_build);
    //console.warn(error_build);
  }
  
  let t1 = performance.now();
  logColor(`execution finished in ${(t1 - t0) / 1000} seconds`, '#5EBA7D');
  addToResultBox(`execution finished in ${(t1 - t0) / 1000} seconds\n`);
}