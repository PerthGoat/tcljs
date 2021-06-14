let tcsr = `
proc for {initCmd testExpr advanceCmd bodyScript} {
  uplevel $initCmd
  set testCmd [list expr $testExpr]
  while {[uplevel $testCmd]} {
    uplevel $bodyScript
    uplevel $advanceCmd
  }
}

proc incr {x} {
  set listexpr [uplevel [list expr "\\$$x" 1 +]]
  uplevel [list set $x $listexpr]
}

# compute POWER of x to the y
proc pow {x y} {
  if {$y 0 =} {
    return 1
  }
  
  set res $x
  for {set i 1} {$i $y <} {incr i} {
    
    set res [expr $res $x *]
  }
  return $res
}

proc factorial {x} {
  set fact 1
  for {} {$x 1 >} {set x [expr $x 1 -]} {
    set fact [expr $fact $x *]
  }

  return $fact
}

# compute sqrt of n
# this is a poor algorithm for it, it just gets it approximately correct in 10 iterations
proc sqrt {n} {
  # run for 10 iterations
  
  set est 0
  
  set cness 0
  
  for {set i 0} {$i 10 <} {incr i} {
    set cness [pow $est 2]
    # negative diff is too high
    # positive diff is too low
    set diff [expr $n $cness -]
    set smalldiff [expr $diff 10 /]
    #puts $smalldiff
    
    set est [expr $est $smalldiff +]
    
    #puts $est
  }
  
  return $est
}

# arctangent of x using the taylor series
proc arctan {x} {
  
  set xsum 0
  set flip 0
  
  for {set i 0} {$i 50 <} {incr i} { 
    set pw [expr $i 2 *]
    set pw [expr $pw 1 +]
    
    set xt [pow $x $pw]
    
    set xd [expr $xt $pw /]
    
    if {$flip 0 =} {
      set xsum [expr $xsum $xd +]
      set flip 1
    } {
      set xsum [expr $xsum $xd -]
      set flip 0
    }
    
    #puts $xd
  }
  return $xsum
}


# get PI
proc PI {} {
  set fr1 [expr 1 5 /]
  set fr1 [arctan $fr1]
  set fr1 [expr $fr1 4 *]
  set fr2 [expr 1 239 /]
  set fr2 [arctan $fr2]
  
  set pi4 [expr $fr1 $fr2 -]
  
  set pi [expr $pi4 4 *]
  
  return $pi
}

# override PI with a default val from wolfram
proc PI {} {
  return 3.14159265358979323846264338327950288
}

proc sin {x} {
  set xsum 0
  set flip 0
  
  for {set i 0} {$i 10 <} {incr i} {
    set pw [expr $i 2 *]
    set pw [expr $pw 1 +]
    set fact [factorial $pw]
    
    set xt [pow $x $pw]
    
    set xd [expr $xt $fact /]
    
    if {$flip 0 =} {
      set xsum [expr $xsum $xd +]
      set flip 1
    } {
      set xsum [expr $xsum $xd -]
      set flip 0
    }
    
    #puts $xd
  }
  
  return $xsum
}

proc cos {x} {
  set halfpi [PI]
  set halfpi [expr $halfpi 2 /]
  set sum [expr $halfpi $x +]
  return [sin $sum]
}

proc tan {x} {
  set s [sin $x]
  set c [cos $x]
  
  return [expr $s $c /]
}

proc arrayTest {name} {
  for {set i 0} {$i 3 <} {incr i} {
    puts [tan $name($i)]
  }
}

set x(0) 0
set x(1) 1
set x(2) 2



# puts $x(1)

arrayTeast $x
# puts [tan 4]`;

function isAlphaNum(s) {
  return s.match(/^[a-z0-9+-/*.=><()$#]+$/i);
}

let varstack = [];
let procstack = {};
let exec_level = 0;
varstack.push({});

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
    
    varstack.push({});
    //console.log(cl[1]);
    for(let i = 0;i < args.length;i++) {
      varstack[exec_level][args[i]] = cl[i + 1];
      //runCmd(['set', '{' + args[i] + '}', '{' + cl[i + 1] + '}']);
    }
    
    let proc_result = runTCL(proc['procbody']);
    
    varstack.pop();
    
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
    let tc_res = runTCL(cl[1]);
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
  
  let current_line = 1;
  
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
          current_line++;
          continue;
        }
        let cmd_result = runCmd(cmd_list);
        if(cmd_result.startsWith('error')) {
          console.warn(`${cmd_result} on line ${current_line}`);
        } else {
          lastval = cmd_result;
        }
        //console.log(cmd_list);
        cmd_list = [];
      }
      if(tcs[i] == '\n') current_line++;
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
      while(watch != 0) {
        if(tcs[i] == '\n') current_line++;
        sb += tcs[i];
        i++;
        if(tcs[i] == ']') {
          watch--;
        } else if(tcs[i] == '[') {
          watch++;
        }
      }
      sb += tcs[i];
    } else if(tcs[i] == '{') {
      sb += tcs[i];
      let watch = 1;
      i++;
      if(tcs[i] == '}') {
        watch--;
      }
      while(watch != 0) {
        if(tcs[i] == '\n') current_line++;
        sb += tcs[i];
        i++;
        if(tcs[i] == '}') {
          watch--;
        } else if(tcs[i] == '{') {
          watch++;
        }
      }
      sb += tcs[i];
    } else if(tcs[i] == '"') {
      sb += tcs[i];
      i++;
      while(tcs[i] != '"') {
        if(tcs[i] == '\n') current_line++;
        sb += tcs[i];
        i++;
      }
      sb += tcs[i];
    } else if(tcs[i] == '\\') {
      sb += tcs[++i];
    }
    else {
      console.warn(`invalid char ${tcs[i]}`);
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
      current_line++;
      return lastval;
    }
    let cmd_result = runCmd(cmd_list);
    if(cmd_result.startsWith('error')) {
      console.warn(`${cmd_result} on line ${current_line}`);
    } else {
      lastval = cmd_result;
    }
  }
  
  return lastval;
}
document.getElementById('code-editor').getElementsByClassName('codes')[0].value = tcsr;
let t0 = performance.now();
runTCL(tcsr);
let t1 = performance.now();
logColor(`execution finished in ${(t1 - t0) / 1000} seconds`, '#5EBA7D');