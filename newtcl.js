let standard_library = `
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

proc incr {x} {
  set listexpr [uplevel [list expr "\\$$x" 1 +]]
  uplevel [list set $x $listexpr]
}

proc decr {x} {
  set listexpr [uplevel [list expr "\\$$x" 1 -]]
  uplevel [list set $x $listexpr]
}

proc trunc {n} {
  return [expr $n [expr $n 1 %] -]
}

proc rand {state} {
  set res [expr $state 48271 *]
  set res [expr $res 65536 %]
  uplevel [list set rngstate $res]
  return $res
}
`;


// holds the default program
let tcsr = `setpixsz 16 16

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
  set block(A) "11111001111110011001"
  set block(B) "11101001111010011110"
  set block(C) "11111000100010001111"
  set block(D) "11101001100110011110"
  set block(E) "11111000111110001111"
  set block(F) "11111000111110001000"
  set block(M) "11111001100100001111"
  set block(-) "00000000111100000000"
  set block(P) "11111001111110001000"
  set block(L) "10001000100010001111"
  set block(Y) "10011001111100011111"
  set block(N) "11111001100110011001"
  set block("?") "01101001001000000010"
  return $block($index)
}

proc drawLetterBlock {index offsetx offsety} {
  set blk [getBlockFromIndex $index]
  set y 0
  set i 0
  while {$i 20 <} {
    set x [expr $i 4 %]
    if {0 $x =} {
      if {$i 0 =} {} {
        incr y
      }
    }
    set color [expr 255 [expr $blk($i) 255 *] -]
    putpixel [expr $x $offsetx +] [expr $y $offsety +] $color $color $color
    incr i
  }
}

proc drawFrame {} {
  fillcolor 0 0 16 16 0 0 0
}

proc drawBackground {} {
  fillcolor 1 1 14 14 0 0 255
}

proc drawSnake {sn} {
  set len [expr $sn(1) 2 +]
  
  set i 2
  while {$i $len <} {
    set seg $sn($i)
    putpixel $seg(0) $seg(1) 0 255 0
    incr i
  }
}

proc addSnakeSegment {snk x y} {
  set nextSnakeInd [expr $snk(1) 2 +]

  set snk($nextSnakeInd) [asarray "$x $y"]

  set snk(1) [expr $snk(1) 1 +]
  
  return $snk
}

proc moveSnake {snk} {
  set dir $snk(0)
  set len $snk(1)
  
  set orig $snk(2)
  # shift snake
  
  set i 0
  while {$i [expr $len 1 -] <} {
    set ind [expr $i 2 +]
    
    set next $snk([expr $ind 1 +])
    
    set snk([expr $ind 1 +]) $snk($ind)
    set snk($ind) $next
    
    incr i
  }
  
  # move snake head
  
  if {$snk(0) 0 =} {
    set orig(0) [expr $orig(0) 1 +]
  }
  
  if {$snk(0) 2 =} {
    set orig(0) [expr $orig(0) 1 -]
  }
  
  if {$snk(0) 1 =} {
    set orig(1) [expr $orig(1) 1 +]
  }
  
  if {$snk(0) 3 =} {
    set orig(1) [expr $orig(1) 1 -]
  }
  
  set snk(2) $orig
  
  #putsdbg $snk
  
  return $snk
}

proc getRandomFoodPos {lastpos} {
  set x $lastpos(0)
  set y $lastpos(1)
  
  set randx [expr [rand [time]] 14 %]
  set randy [expr [rand $x] 14 %]
  
  set randx [expr $randx 1 +]
  set randy [expr $randy 1 +]
  
  return [asarray "[trunc $randx] [trunc $randy]"]
}

proc ShowGameOver {} {
setpixsz 64 64
drawLetterBlock 6 4 10
drawLetterBlock 0 12 10
drawLetterBlock 0 20 10
drawLetterBlock D 28 10

drawLetterBlock 6 12 20
drawLetterBlock A 20 20
drawLetterBlock M 28 20
drawLetterBlock E 36 20

drawLetterBlock - 2 25
drawLetterBlock - 10 25
drawLetterBlock - 18 25
drawLetterBlock - 26 25
drawLetterBlock - 34 25
drawLetterBlock - 42 25
drawLetterBlock - 50 25

drawLetterBlock P 4 35
drawLetterBlock L 12 35
drawLetterBlock A 20 35
drawLetterBlock Y 28 35

drawLetterBlock A 4 45
drawLetterBlock 6 12 45
drawLetterBlock A 20 45
drawLetterBlock 1 28 45
drawLetterBlock N 36 45
drawLetterBlock "?" 44 45
}

proc checkForBodyCollision {snake} {
  set snakehead $snake(2)
  set len $snake(1)
  
  set i 1
  
  while {$i $len <} {
    set act [expr $i 2 +]
    
    set snakepiece $snake($act)
    
    
    if {[expr $snakehead(0) $snakepiece(0) =] [expr $snakehead(1) $snakepiece(1) =] &} {
      return "1"
    }
    incr i
  }
  
  return "0"
}

# a piece of food at a random-ish spot
set foodpiece [getRandomFoodPos [asarray "8 5"]]

# snake direction, length, segments
set snake [asarray "0 0"]

set snake [addSnakeSegment $snake 6 8]
set snake [addSnakeSegment $snake 5 8]

set ltime [time]

# goal delay of 150ms
set goal_delay 150

set real_delay $goal_delay

while {1 1 =} {
  set key [keyin]
  drawFrame
  drawBackground
  drawSnake $snake
  putpixel $foodpiece(0) $foodpiece(1) 255 0 0
  
  # key input for movement
  # d
  if {$key 100 =} {
    set snake(0) [expr $snake(0) 1 +]
  }
  # a
  if {$key 97 =} {
    set snake(0) [expr $snake(0) 1 -]
  }
  
  if {$snake(0) 3 >} {
    set snake(0) 0
  }
  
  if {$snake(0) 0 <} {
    set snake(0) 3
  }
  
  set snake [moveSnake $snake]
  set snakehead $snake(2)
  if {[expr $snakehead(0) $foodpiece(0) =] [expr $snakehead(1) $foodpiece(1) =] &} {
    # eat food
    set len $snake(1)
    
    set snaketail $snake([expr $len 1 +])
    
    set snake [addSnakeSegment $snake $snaketail(0) $snaketail(1)]
    
    set foodpiece [getRandomFoodPos [asarray "$foodpiece(0) $foodpiece(1)"]]
  }
  
  if {[checkForBodyCollision $snake] 1 =} {
    ShowGameOver
    break
  }
  
  if {$snakehead(0) 15 >} {
    ShowGameOver
    break
  }
  
  if {$snakehead(1) 15 >} {
    ShowGameOver
    break
  }
  
  if {$snakehead(0) 0 <} {
    ShowGameOver
    break
  }
  
  if {$snakehead(1) 0 <} {
    ShowGameOver
    break
  }
  
  set deltatime [expr [time] $ltime -]
  set ltime [time]
  set dtms [expr $deltatime 1000 *]
  set diff [expr $dtms $goal_delay -]
  
  if {$diff 0 >} {
    decr real_delay
  }
  
  if {$diff 0 <} {
    incr real_delay
  }
  
  sleep $real_delay
}`;

// holds a character that makes up a word, was originally
// alphanumerics but became other characters
function isAlphaNum(s) {
  return s.match(/^[a-z0-9+-/*.=><()$#%_&]+$/i);
}

// an async way to sleep in javascript without eating the browser thread
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// canvas for screen output
let canvas = document.getElementById('screenout');
let ctx = canvas.getContext('2d');

// global variables
let varstack = []; // the current variable stack
let procstack = {}; // the current process list
let exec_level = 0; // the level of the varstack in the current scope
varstack.push({}); // add scope level 0

// holds the code of the last key pressed for keypress functionality
let last_key_pressed = 0;

function resetS() { // reset interpreter state
  varstack = [];
  procstack = {};
  exec_level = 0;
  varstack.push({});
}

function deepcopy(a) { // handles deepcopy of arrays for passing to procedures so unwanted side effects don't happen with immutable variables
  return JSON.parse(JSON.stringify(a));
}

// handle substitutions of words
async function runSub(w) {
  if(w[0] == '{') { // brace substitution
    return w.substring(1, w.length - 1);
  }
  if(w[0] == '$') { // variable substitution
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
  if(w[0] == '[') { // bracket substitution
    w = w.substring(1, w.length - 1);
    return await runTCL(w, 'BRACKET');
  }
  if(w[0] == '"') { // quote sub, works different than typical substitution
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
  return w; // no sub can be performed
}

// debug function to log something to the chrome debug console in color
function logColor(txt, color) {
  console.log(`%c${exec_level}>${txt}`, `background: ${color}`);
}

const debug = false; // should the runCmd print debug info?

// handles definitions for all commands that need running
async function runCmd(cl) {
  if (debug) logColor(cl, '#E66');
  for(let i = 0;i < cl.length;i++) { // handle substitutions such as variable substitutions and command subs
    cl[i] = await runSub(cl[i]);
    if(typeof(cl[i]) == 'string' && cl[i].startsWith('error')) { // bubble errors
      return cl[i];
    }
  }
  
  if (debug) logColor(cl, '#BBB');
  
  // if it's a process
  if (cl[0] in procstack) {
    let proc = procstack[cl[0]];
    let args = proc['procargs'].split(' ');
    if(proc['procargs'] == '') {
      args = [];
    }
    if(cl.length - 1 < args.length) {
      return `error not enough args passed to proc ${cl[0]}`;
    }
    exec_level++; // advance to a nested lexical scope
    
    varstack.push({}); // new variable stack for this scope
    for(let i = 0;i < args.length;i++) { // set each variable to the passed in arguments
      varstack[exec_level][args[i]] = cl[i + 1];
    }
    
    // run the procedure and get the result
    let proc_result = await runTCL(proc['procbody'], cl[0]);
    
    // remove the old varstack
    varstack.pop();
    
    // step out of the lexical scope
    exec_level--;
    
    // return either a return statement or the result of the procedure
    return (typeof(proc_result) == 'object' && 'return' in proc_result) ? proc_result['return'] : proc_result;
  }
  // any other non special procedure command
  switch(cl[0]) {
    case 'set': // set var [val]
    // sets a variable to a value, including arrays
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
    case 'proc': // proc name {args} {body}
    // define a procedure
    procstack[cl[1]]= {procargs: cl[2], procbody: cl[3]};
    break;
    case 'puts': // puts value
    // print a value to the result box
    logColor('\t\n\t' + cl[1], '#BAF');
    addToResultBox('\=> ' + cl[1]);
    break;
    case 'putpixel': // putpixel x y r g b
    // print a pixel to the canvas of color rgb
    //logColor(`\t\n\t ${cl[1]} ${cl[2]} ${cl[3]} ${cl[4]} ${cl[5]}`, '#F00');
    let coordx = cl[1];
    let coordy = cl[2];
    let r = cl[3];
    let g = cl[4];
    let b = cl[5];
    
    ctx.fillStyle = `rgb(${r},${g},${b})`
    ctx.fillRect(parseFloat(coordx), parseFloat(coordy), 1, 1);
    
    break;
    case 'prntstack': // DEBUG, prints the current variable stack
      console.log(varstack);
    break;
    case 'putsdbg': // DEBUG, puts the memory representation of the current command
      console.log(cl);
    break;
    case 'fillcolor': // fillcolor x y w h r g b
      // fill a rectangle at x, y with width and height with a color rgb
      ctx.fillStyle = `rgb(${cl[5]},${cl[6]},${cl[7]})`
      ctx.fillRect(parseFloat(cl[1]), parseFloat(cl[2]), parseFloat(cl[3]), parseFloat(cl[4]));
    break;
    case 'asarray': // turns a list of arguments into an array representation
      // useful for many things such as matrix ops
      let spl = cl[1].split(' ');
      let nw = {};
      for(let s = 0;s < spl.length;s++) {
        nw[s] = spl[s]
      }
      return nw;
    break;
    case 'sleep': // sleep for x amount of time
    await sleep(parseFloat(cl[1]));
    break;
    case 'time': // get the current timing as a float with seconds and decimal subseconds
    return '' + (Date.now() / 1000)
    break;
    case 'setpixsz': // set the canvas width and height
    canvas.width = cl[1];
    canvas.height = cl[2];
    break;
    case 'keyin': // return the last key pressed and clear the buffer
      let kp = last_key_pressed;
      last_key_pressed = '';
      return '' + kp;
    break;
    case 'if': // if {condition} {body} [{else} {body}]
      // a classic if statement
      let ifstatement = cl[1];
      let ifbody = cl[2];
      let elsebody = cl[3];
      let res = '';
      // run the if statement condition using expr
      if(await runTCL('expr ' + ifstatement, 'IFSTATE') == 'true') {
        res = await runTCL(ifbody, 'IFBODY'); // if true run the body
      } else if(elsebody != undefined) {
        res = await runTCL(elsebody, 'ELSEBODY'); // if false run the alt body if it exists
      }
      
      // handle return and break statements in procedures
      if(typeof(res) == 'object') {
        if('return' in res) {
          return res;
        } else if (res[0] == 'break') {
          return res;
        } else {
          //console.log(res);
          return 'error got strange object in if result';
        }
      }
      // bubble error if an error occurs
      if(res.startsWith('error')) return res;
    break;
    case 'while': // while loop
      let whilestatement = cl[1];
      let whilebody = cl[2];
      //let loopkill = 0;
      // while the expr of the while statement is true
      while(await runTCL('expr ' + whilestatement, 'WHILESTATE') == 'true') {
        // then run the whilebody code
        let res = await runTCL(whilebody, 'WHILEBODY');
        // if a return or a break, kill the loop or procedure
        if(typeof(res) == 'object' && 'return' in res) return res;
        if(typeof(res) == 'object' && res[0] == 'break') break;
        if(res.startsWith('error')) return res; // if an error occurs bubble it up
        /*if(++loopkill == 200) {
          return 'error loop took too long';
        }*/
      }
    break;
    case 'break': // standard non-returning break statement to break loops
      return ['break'];
    break;
    case 'uplevel': // access the variables in a procedure above the current lexical scope
    if (debug) logColor('UPLEVEL START', '#FF0');
    exec_level--;
    let tc_res = await runTCL(cl[1], 'UPLEVEL');
    exec_level++;
    //console.log(exec_name);
    if (debug) logColor('UPLEVEL END', '#FF0');
    return tc_res;
    break;
    case 'return': // return a value from a procedure
      return {'return':cl[1]};
    break;
    case 'list': // removes first argument and then returns a string separated by spaces
      let cll = cl.slice(1, cl.length);
      return cll.join(' ');
    break;
    case 'expr': // run a math or boolean expression of some sort, uses reverse polish notation
    let math_stack = []; // set up the math stack
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
    return '' + math_stack[0]; // return the result as a string because it is friendly for the interpreter
    break;
    default:
    return `error unknown command ${cl[0]}`;
  }
  return '';
}

// invoke the TCL interpreter
async function runTCL(tcs, name) {
  // if not running then break out of the interpreter loop
  if(!running) {
    return 'error execution halted'; // currently this sometimes misses if an if statement is running an expr
  }
  
  // string builder to build up commands from characters
  let sb = '';
  
  // a list of the parsed command words
  let cmd_list = [];
  
  // linecount of the program
  let mylinecount = 0;
  
  // the last return value to return from the interpreter
  let lastval = '';
  
  // for each char in the input
  for(let i = 0;i < tcs.length;i++) {
    // if the end of a word or line
    if (tcs[i] == ' ' || tcs[i] == '\t' || tcs[i] == '\n' || tcs[i] == ';') {
      // if the stringbuffer is not empty
      if(sb != '') {
        cmd_list.push(sb); // then add it to the word list and empty the sb
        sb = '';
      }
      // if the end of a command and there is words built up in the command list
      if((tcs[i] == '\n' || tcs[i] == ';') && cmd_list.length > 0) {
        
        // if the command is a comment then skip that line
        if(cmd_list[0][0] == '#') {
          cmd_list = [];
          mylinecount++;
          continue;
        }
        // otherwise run the command and get the result
        let cmd_result = await runCmd(cmd_list);
        // if the command has an error
        if(typeof(cmd_result) == 'string' && cmd_result.startsWith('error')) {
          // print it and bubble the error back up
          let error_build = `${cmd_result} in ${name} on line ${mylinecount}`;
          addToResultBox(error_build);
          
          return cmd_result;
        } else {
          // otherwise, if there is a return statement or a break statement
          if(typeof(cmd_result) == 'object' && 'return' in cmd_result || cmd_result[0] == 'break') {
            return cmd_result; // immediately leave the interpreter
          }
          lastval = cmd_result; // otherwise just set the last value to the result of the command
        }
        //console.log(cmd_list);
        cmd_list = []; // empty the command list when done
      }
      // for each newline advance the line count
      if(tcs[i] == '\n') mylinecount++;
      continue;
    }
    
    // if there is a value in the character list that is valid for a word
    if(isAlphaNum(tcs[i])) { // build a word
      sb += tcs[i];
    } else if(tcs[i] == '[') { // brackets are a special word
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
    } else if(tcs[i] == '{') { // braces are a special word
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
    } else if(tcs[i] == '"') { // quotes are a special word
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
    } else if(tcs[i] == '\\') { // backslash escape
      sb += tcs[++i];
    }
    else { // if none of these match report an error that none match
      return `error invalid char ${tcs[i]}`;
      //break;
    }
    
  }
  
  // after the loop,
  // if there's anything left in the stringbuffer process it
  if(sb != '') {
    cmd_list.push(sb);
    sb = '';
  }
  
  // run leftover command
  if(cmd_list.length > 0) {
    if(cmd_list[0][0] == '#') {
      cmd_list = [];
      mylinecount++;
      return lastval;
    }
    let cmd_result = await runCmd(cmd_list);
    if(typeof(cmd_result) == 'string' && cmd_result.startsWith('error')) {
      let error_build = `${cmd_result} in ${name} on line ${mylinecount}`;
      addToResultBox(error_build);
      
      return cmd_result;
    } else {
      lastval = cmd_result;
    }
  }
  
  // return the last value
  return lastval;
}

// set the code editor to the default value initially
document.getElementById('code-editor').getElementsByClassName('codes')[0].value = tcsr;

// add a log line to the result box
function addToResultBox(s) {
  let c_res = document.getElementById('result').getElementsByClassName('resbox')[0];
  c_res.value += s + '\n';
  c_res.scrollTop = c_res.scrollHeight;
}

// running is used to prevent the button from starting again
// stopped is used to track when the previous thread has actually exited the loops it is processing
// aka running
// this setup is needed to sync the asynchronous code
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

  // preset the canvas width and height to 64x64
  // this preset can be changed later by TCL
  canvas.width = 64;
  canvas.height = 64;
  
  // clear the canvas to solid white by default
  ctx.fillStyle = `rgb(255,255,255)`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // now the TCL interpreter is running but not stopped
  running = true;
  stopped = false;
  // get the code in the code editor
  let code = document.getElementById('code-editor').getElementsByClassName('codes')[0].value;
  addToResultBox('START');
  let t0 = performance.now();
  resetS(); // reset the interpreter
  await runTCL(standard_library, 'STD'); // parse the standard library before running the code
  let t_result = await runTCL(code, 'MAIN');
  
  let t1 = performance.now();
  logColor(`execution finished in ${(t1 - t0) / 1000} seconds`, '#5EBA7D');
  addToResultBox(`execution finished in ${(t1 - t0) / 1000} seconds\n`);
  running = false;
  stopped = true;
}

// helps with asynchronous stopping
function stopTCL() {
  running = false;
}

// holds the last key pressed anywhere on the page
// to enable it to be easily used by the interpreter
window.onkeypress = (e) => {
  last_key_pressed = e.key.charCodeAt(0);
};