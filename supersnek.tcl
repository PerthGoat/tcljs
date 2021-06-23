setpixsz 16 16

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
  
  set randx [expr [rand $x] 14 %]
  set randy [expr [rand $y] 14 %]
  
  set randx [expr $randx 1 +]
  set randy [expr $randy 1 +]
  
  return [asarray "$randx $randy"]
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

# draw the snake frame
drawFrame

drawBackground

set snake [addSnakeSegment $snake 8 8]
set snake [addSnakeSegment $snake 8 8]
set snake [addSnakeSegment $snake 8 8]
set snake [addSnakeSegment $snake 8 8]
set snake [addSnakeSegment $snake 8 8]
set snake [addSnakeSegment $snake 8 8]
set snake [addSnakeSegment $snake 8 8]
set snake [addSnakeSegment $snake 8 8]
set snake [addSnakeSegment $snake 8 8]
set snake [addSnakeSegment $snake 8 8]
set snake [addSnakeSegment $snake 8 8]
set snake [addSnakeSegment $snake 8 8]

while {1 1 =} {
  set key [keyin]
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
  
  sleep 150
}