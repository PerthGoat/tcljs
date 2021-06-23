proc abs {n} {
  if {$n 0 <} {
    return [expr 0 $n -]
  } {
    return $n
  }
}

proc trunc {n} {
  return [expr $n [expr $n 1 %] -]
}

proc translate {pos vals} {
  set p(0) [expr $pos(0) $vals(0) +]
  set p(1) [expr $pos(1) $vals(1) +]
  set p(2) [expr $pos(2) $vals(2) +]
  
  return $p
}

proc translate_cube {pos vals} {
  set translated(0) [translate $pos(0) $vals]
  set translated(1) [translate $pos(1) $vals]
  set translated(2) [translate $pos(2) $vals]
  set translated(3) [translate $pos(3) $vals]
  set translated(4) [translate $pos(4) $vals]
  set translated(5) [translate $pos(5) $vals]
  set translated(6) [translate $pos(6) $vals]
  set translated(7) [translate $pos(7) $vals]
  
  return $translated
}

proc drawRect {p0 p1 p2 p3} {
  #putsdbg $p0
  drawLine $p0(0) $p0(1) $p1(0) $p1(1)
  drawLine $p1(0) $p1(1) $p2(0) $p2(1)
  drawLine $p2(0) $p2(1) $p3(0) $p3(1)
  drawLine $p0(0) $p0(1) $p3(0) $p3(1)
}

proc drawLine {x0 y0 x1 y1} {
  set x0 [trunc $x0]
  set y0 [trunc $y0]
  set x1 [trunc $x1]
  set y1 [trunc $y1]
  set dx [abs [expr $x1 $x0 -]]
  
  if {$x0 $x1 <} {
    set sx 1
  } {
    set sx -1
  }
  
  set dy [expr 0 [abs [expr $y1 $y0 -]] -]
  
  if {$y0 $y1 <} {
    set sy 1
  } {
    set sy -1
  }
  
  #puts $sx
  
  set err [expr $dx $dy +]
  while {1 1 =} {
    putpixel $x0 $y0 0 0 0
    if {[expr [trunc $x0] [trunc $x1] =] [expr [trunc $y0] [trunc $y1] =] &} {
      break
    }
    set e2 [expr 2 $err *]
    if {$e2 $dy >=} {
      set err [expr $err $dy +]
      set x0 [expr $x0 $sx +]
    }
    if {$e2 $dx <=} {
      set err [expr $err $dx +]
      set y0 [expr $y0 $sy +]
    }
  }
}

proc createMatrix {r1 r2 r3 r4} {
  set mat(0) $r1
  set mat(1) $r2
  set mat(2) $r3
  set mat(3) $r4
  
  return $mat
}

proc vec_multiply {v1 v2} {
  return [asarray "[expr $v1(0) $v2(0) *] [expr $v1(1) $v2(1) *] [expr $v1(2) $v2(2) *] [expr $v1(3) $v2(3) *]"]
}

proc vec_sum {v1} {
  return [expr $v1(0) $v1(1) $v1(2) $v1(3) + + +]
}

proc getColumnVector {m i} {
  set mr1 $m(0)
  set mr2 $m(1)
  set mr3 $m(2)
  set mr4 $m(3)
  
  return [asarray "$mr1($i) $mr2($i) $mr3($i) $mr4($i)"]
}

proc getRowVector {m i} {
  return $m($i)
}

proc matrix_multiply {m1 m2} {
  set row 0
  
  while {$row 4 <} {
    set column 0
    while {$column 4 <} {
      set mrow [getRowVector $m1 $row]
      set mcolumn [getColumnVector $m2 $column]
      
      set res [vec_multiply $mrow $mcolumn]
      
      set b1($column) [vec_sum $res]
      
      incr column
    }
    
    set b2($row) $b1
    incr row
  }
  return $b2
}

proc matrix_multiply_dot {m1 v1} {
  set column 0
  
  while {$column 4 <} {
    set mcolumn [getRowVector $m1 $column]
    set res [vec_multiply $v1 $mcolumn]
    set res [vec_sum $res]
    set newvec($column) $res
    incr column
  }
  
  #return $column
  return $newvec
}


proc translateMat {m1 x y z} {
  set translatematrix [createMatrix [asarray "1 0 0 $x"] [asarray "0 1 0 $y"] [asarray "0 0 1 $z"] [asarray "0 0 0 1"]]
  
  return [matrix_multiply $m1 $translatematrix]
}

proc scaleMat {m1 x y z} {
  set scalematrix [createMatrix [asarray "$x 0 0 0"] [asarray "0 $y 0 0"] [asarray "0 0 $z 0"] [asarray "0 0 0 1"]]
  
  return [matrix_multiply $m1 $scalematrix]
}

proc rotateMat {m1 x y z theta} {
  set st [sin $theta]
  set ct [cos $theta]
  
  if {$x 1 =} {
    set rotmat [createMatrix [asarray "1 0 0 0"] [asarray "0 $ct [expr 0 $st -] 0"] [asarray "0 $st $ct 0"] [asarray "0 0 0 1"]]
    set m1 [matrix_multiply $m1 $rotmat]
  }
  if {$y 1 =} {
    set rotmat [createMatrix [asarray "$ct 0 $st 0"] [asarray "0 1 0 0"] [asarray "[expr 0 $st -] 0 $ct 0"] [asarray "0 0 0 1"]]
    set m1 [matrix_multiply $m1 $rotmat]
  }
  if {$z 1 =} {
    set rotmat [createMatrix [asarray "$ct [expr 0 $st -] 0 0"] [asarray "$st $ct 0 0"] [asarray "0 0 1 0"] [asarray "0 0 0 1"]]
    set m1 [matrix_multiply $m1 $rotmat]
  }
  
  return $m1
}

proc multiply_cube {world cube} {
  set i 0
  while {$i 8 <} {
    set r($i) [matrix_multiply_dot $world $cube($i)]
    incr i
  }
  #prntstack
  #while {1 1 =} {sleep 100}
  return $r
}

setpixsz 32 32

set worldmatrix [createMatrix [asarray "1 0 0 0"] [asarray "0 1 0 0"] [asarray "0 0 1 0"] [asarray "0 0 0 1"]]

set worldmatrix [translateMat $worldmatrix 16 16 0]
set worldmatrix [scaleMat $worldmatrix 8 8 8]
#set worldmatrix [rotateMat $worldmatrix 1 1 0 1]

#puts $mult(0)

#puts [vec_multiply [asarray "1 2 3 4"] [asarray "4 5 6 7"]]

set orig_cube(0) [asarray "-1 -1 1 1"]
set orig_cube(1) [asarray "1 -1 1 1"]
set orig_cube(2) [asarray "1 1 1 1"]
set orig_cube(3) [asarray "-1 1 1 1"]

set orig_cube(4) [asarray "-1 -1 -1 1"]
set orig_cube(5) [asarray "1 -1 -1 1"]
set orig_cube(6) [asarray "1 1 -1 1"]
set orig_cube(7) [asarray "-1 1 -1 1"]

set new_cube [multiply_cube $worldmatrix $orig_cube]

#putsdbg $orig_cube

drawRect $new_cube(0) $new_cube(1) $new_cube(2) $new_cube(3)

#set worldmatrix [rotateMat $worldmatrix 0 1 0 0.5]

set j 0
while {1 1 =} {
  set worldmatrix [rotateMat $worldmatrix 0 0 0 0.1]
  set key [keyin]
#  puts $key
  if {$key 100 =} {
    set worldmatrix [rotateMat $worldmatrix 0 1 0 0.1]
  }
  if {$key 119 =} {
    set worldmatrix [rotateMat $worldmatrix 1 0 0 0.1]
  }
  if {$key 115 =} {
    set worldmatrix [rotateMat $worldmatrix 1 0 0 -0.1]
  }
  if {$key 97 =} {
    set worldmatrix [rotateMat $worldmatrix 0 1 0 -0.1]
  }

  fillcolor 0 0 64 64 255 255 255
  drawRect $new_cube(0) $new_cube(1) $new_cube(2) $new_cube(3)
  drawRect $new_cube(4) $new_cube(5) $new_cube(6) $new_cube(7)
  drawRect $new_cube(0) $new_cube(3) $new_cube(7) $new_cube(4)
  drawRect $new_cube(1) $new_cube(2) $new_cube(6) $new_cube(5)
  set new_cube [multiply_cube $worldmatrix $orig_cube]
  incr j
  sleep 10
}

# set orig_cube [translate_cube $orig_cube [asarray "1 1 1"]]

# fillcolor 0 0 64 64 255 0 0
# drawRect $orig_cube(0) $orig_cube(1) $orig_cube(2) $orig_cube(3)
# drawRect $orig_cube(4) $orig_cube(5) $orig_cube(6) $orig_cube(7)
# sleep 1
# incr j
# }