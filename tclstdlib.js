// standard library for other stuff to use
// preappended to every run
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

proc rand {state} {
  set res [expr $state 48271 *]
  set res [expr $res 65536 %]
  uplevel [list set rngstate $res]
  return $res
}
`;