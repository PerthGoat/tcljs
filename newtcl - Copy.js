
// standard library for other stuff to use
// preappended to every run
let standard_library = `
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

proc PI2 {} {
  return [expr [PI] 2 *]
}

proc sin {x} {
  set x [expr $x [PI2] %]
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
`;

let tcsr = `


proc blinkon {offsetx offsety} {
  set x 0
  while {$x 4 <} {
    set y 0
    while {$y 5 <} {
      putpixel [expr $x $offsetx +] [expr $y $offsety +] 0 0 0
      incr y
    }
    incr x
  }
}

proc blinkoff {offsetx offsety} {
  set x 0
  while {$x 4 <} {
    set y 0
    while {$y 5 <} {
      putpixel [expr $x $offsetx +] [expr $y $offsety +] 255 255 255
      incr y
    }
    incr x
  }
}

proc blinkloop {offsetx offsety} {
  blinkon $offsetx $offsety
  sleep 100
  blinkoff $offsetx $offsety
  sleep 100
}

proc getBlockFromIndex {index} {
  set block(0) "11111001100110011111"
  set block(1) "00100110001000100111"
  set block(2) "11110001111110001111"
  set block(3) "11110001111100011111"
  set block(4) "10011001111100010001"
  set block(5) "11111000111100011111"
  set block(6) "11111000111110011111"
  set block(7) "11110001001001000100"
  set block(8) "11111001111110011111"
  set block(9) "11111001111100011111"
  return $block($index)
}

proc drawLetterBlock {index offsetx offsety} {
  set blk [getBlockFromIndex $index]
  set y 0
  for {set i 0} {$i 20 <} {incr i} {
    set x [expr $i 4 %]
    if {0 $x =} {
      if {$i 0 =} {} {
        incr y
      }
    }
    set color [expr 255 [expr $blk($i) 255 *] -]
    putpixel [expr $x $offsetx +] [expr $y $offsety +] $color $color $color
  }
}

set ox 0
set oy 0

while {1 1 =} {
  set key [keyin]
  if {[expr $key 47 >] [expr $key 58 <] =} {
    drawLetterBlock [expr $key 48 -] $ox $oy
    set ox [expr $ox 5 +]
    if {$ox 64 >} {
      set ox 0
      set oy [expr $oy 6 +]
    }
    sleep 100
  } {
    if {$key 69 =} {
      set ox 0
      set oy [expr $oy 6 +]
    }
    blinkloop $ox $oy
  }
}

`;

function isAlphaNum(s) {
  return s.match(/^[a-z0-9+-/*.=><()$#%_&]+$/i);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let canvas = document.getElementById('screenout');
let ctx = canvas.getContext('2d');

let varstack = [];
let procstack = {};
let exec_level = 0;
varstack.push({});

// debugging
let exec_name = ['MAIN']; // holds the current exec name for debugging

// keypress stuff
let last_key_pressed = 0;

function resetS() {
  varstack = [];
  procstack = {};
  exec_level = 0;
  varstack.push({});

  // debugging
  exec_name = ['MAIN']; // holds the current exec name for debugging
}

function deepcopy(a) {
  return JSON.parse(JSON.stringify(a));
}

async function runSub(w) {
  if(w[0] == '{') {
    return w.substring(1, w.length - 1);
  }
  if(w[0] == '$') {
    w = w.substring(1, w.length);
    if(w[w.length - 1] == ')') {
      let spl = w.split('(');
      let name = spl[0];
      let index = await runSub(spl[1].substring(0, spl[1].length - 1));
      if(varstack[exec_level][name] == undefined || varstack[exec_level][name][index] == undefined) {
        return `error var ${name} not initialized`;
      }
      return deepcopy(varstack[exec_level][name])[index];
    } else {
      if(varstack[exec_level][w] == undefined) {
        return `error var ${w} not initialized`;
      }
      return deepcopy(varstack[exec_level][w]);
    }
  }
  if(w[0] == '[') {
    w = w.substring(1, w.length - 1);
    return await runTCL(w);
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
        while(w[i] != ' ' && w[i] != '\t' && w[i] != '\n' && i < w.length - 1) {
          sb_b += w[i++];
        }
        ret_str += await runSub(sb_b) + w[i];
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
        ret_str += await runSub(sb_b);
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

async function runCmd(cl) {
  if (debug) logColor(cl, '#E66');
  for(let i = 0;i < cl.length;i++) {
    cl[i] = await runSub(cl[i]);
    if(typeof(cl[i]) == 'string' && cl[i].startsWith('error')) {
      return cl[i];
    }
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
    
    exec_name.push(cl[0]);
    varstack.push({});
    //console.log(cl[1]);
    for(let i = 0;i < args.length;i++) {
      varstack[exec_level][args[i]] = cl[i + 1];
      //runCmd(['set', '{' + args[i] + '}', '{' + cl[i + 1] + '}']);
    }
    
    let proc_result = await runTCL(proc['procbody']);
    
    varstack.pop();
    exec_name.pop();
    
    exec_level--;
    //console.log(proc);
    return (typeof(proc_result) == 'object' && 'return' in proc_result) ? proc_result['return'] : proc_result;;
  }
  switch(cl[0]) {
    case 'set':
    if(cl[1][cl[1].length - 1] == ')') {
      let spl = cl[1].split('(');
      let name = spl[0];
      let ind = await runSub(spl[1].substring(0, spl[1].length - 1));
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
    case 'prntstack':
      console.log(varstack);
    break;
    case 'putsdbg':
      console.log(cl);
    break;
    case 'fillcolor': // fillcolor x y w h r g b
      ctx.fillStyle = `rgb(${cl[5]},${cl[6]},${cl[7]})`
      ctx.fillRect(parseFloat(cl[1]), parseFloat(cl[2]), parseFloat(cl[3]), parseFloat(cl[4]));
    break;
    case 'asarray':
      let spl = cl[1].split(' ');
      let nw = {};
      for(let s = 0;s < spl.length;s++) {
        nw[s] = spl[s]
      }
      return nw;
    break;
    case 'sleep':
    await sleep(parseFloat(cl[1]));
    break;
    case 'time':
    return '' + (Date.now() / 1000)
    break;
    case 'setpixsz':
    canvas.width = cl[1];
    canvas.height = cl[2];
    break;
    case 'keyin':
      let kp = last_key_pressed;
      last_key_pressed = '';
      return '' + kp;
    break;
    case 'if':
      let ifstatement = cl[1];
      let ifbody = cl[2];
      let elsebody = cl[3];
      let res = '';
      if(await runTCL('expr ' + ifstatement) == 'true') {
        res = await runTCL(ifbody);
      } else if(elsebody != undefined) {
        res = await runTCL(elsebody);
      }
      
      if(typeof(res) == 'object') {
        if('return' in res) {
          return res['return'];
        } else if (res[0] == 'break') {
          return res;
        } else {
          //console.log(res);
          return 'error got strange object in if result';
        }
      }
      if(res.startsWith('error')) return res;
    break;
    case 'while':
      let whilestatement = cl[1];
      let whilebody = cl[2];
      //let loopkill = 0;
      while(await runTCL('expr ' + whilestatement) == 'true') {
        let res = await runTCL(whilebody);
        if(typeof(res) == 'object' && 'return' in res) return res['return'];
        if(typeof(res) == 'object' && res[0] == 'break') break;
        if(res.startsWith('error')) return res;
        /*if(++loopkill == 200) {
          return 'error loop took too long';
        }*/
      }
    break;
    case 'break':
      return ['break'];
    break;
    case 'uplevel':
    if (debug) logColor('UPLEVEL START', '#FF0');
    exec_level--;
    let tc_res = await runTCL(cl[1]);
    exec_level++;
    //console.log(exec_name);
    if (debug) logColor('UPLEVEL END', '#FF0');
    return tc_res;
    break;
    case 'return':
      return {'return':cl[1]};
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
      }
      else if(cl[i] == 'true' || cl[i] == 'false') {
        math_stack.push(cl[i]);
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
          case '&':
          math_stack[math_stack.length - 2] = math_stack[math_stack.length - 2] == 'true' && math_stack[math_stack.length - 1] == 'true';
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
          case '>=':
          math_stack[math_stack.length - 2] = math_stack[math_stack.length - 2] >= math_stack[math_stack.length - 1];
          math_stack.pop();
          break;
          case '<=':
          math_stack[math_stack.length - 2] = math_stack[math_stack.length - 2] <= math_stack[math_stack.length - 1];
          math_stack.pop();
          break;
          case '!=':
          math_stack[math_stack.length - 2] = math_stack[math_stack.length - 2] != math_stack[math_stack.length - 1];
          math_stack.pop();
          break;
          case '%':
          math_stack[math_stack.length - 2] = math_stack[math_stack.length - 2] % math_stack[math_stack.length - 1];
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

async function runTCL(tcs) {
  if(!running) {
    return 'error execution halted'; // currently this sometimes misses if an if statement is running an expr
  }
  
  let sb = '';

  let cmd_list = [];
  
  let mylinecount = 0;
  
  let lastval = '';
  
  for(let i = 0;i < tcs.length;i++) {
    if (tcs[i] == ' ' || tcs[i] == '\t' || tcs[i] == '\n' || tcs[i] == ';') {
      if(sb != '') {
        cmd_list.push(sb);
        sb = '';
      }
      if((tcs[i] == '\n' || tcs[i] == ';') && cmd_list.length > 0) {
        if(cmd_list[0][0] == '#') {
          cmd_list = [];
          mylinecount++;
          continue;
        }
        let cmd_result = await runCmd(cmd_list);
        if(typeof(cmd_result) == 'string' && cmd_result.startsWith('error')) {
          let error_build = `${cmd_result} in ${exec_name[exec_level]} on line ${mylinecount}`;
          addToResultBox(error_build);
          
          return cmd_result;
        } else {
          if(typeof(cmd_result) == 'object' && '(return' in cmd_result || cmd_result[0] == 'break') {
            return cmd_result;
          }
          lastval = cmd_result;
        }
        //console.log(cmd_list);
        cmd_list = [];
      }
      if(tcs[i] == '\n') mylinecount++;
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
        if(tcs[i] == '\n') mylinecount++;
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
        if(tcs[i] == '\n') mylinecount++;
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
        if(tcs[i] == '\n') mylinecount++;
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
      mylinecount++;
      return lastval;
    }
    let cmd_result = await runCmd(cmd_list);
    if(typeof(cmd_result) == 'string' && cmd_result.startsWith('error')) {
      let error_build = `${cmd_result} in ${exec_name[exec_level]} on line ${mylinecount}`;
      addToResultBox(error_build);
      
      return cmd_result;
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

let running = false;
let stopped = true;
async function runTclButton() {
  if (running) {
    running = false;
  }
  
  if(!stopped) {
    setTimeout(runTclButton, 100);
    return;
  }
  
  canvas.width = 64;
  canvas.height = 64;
  
  ctx.fillStyle = `rgb(255,255,255)`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  running = true;
  stopped = false;
  let code = document.getElementById('code-editor').getElementsByClassName('codes')[0].value;
  addToResultBox('START');
  let t0 = performance.now();
  resetS();
  await runTCL(standard_library);
  let t_result = await runTCL(code);
  
  let t1 = performance.now();
  logColor(`execution finished in ${(t1 - t0) / 1000} seconds`, '#5EBA7D');
  addToResultBox(`execution finished in ${(t1 - t0) / 1000} seconds\n`);
  running = false;
  stopped = true;
}

function stopTCL() {
  running = false;
}

window.onkeypress = (e) => {
  last_key_pressed = e.key.charCodeAt(0);
};