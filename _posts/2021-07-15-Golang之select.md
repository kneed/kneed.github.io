---
layout:     post
title:      "Golang之select"
subtitle:   "\"select for ?\""
date:       2021-07-14 23:58:00
author:     "Keal"
header-img: "img/post-bg-go-1.png"
catalog: true
tags:
    - tech
    - go
---

## Select

select的使用方式和switch有点类似,作用和io多路复用里的select函数类似.

```go
func fibonacci(c, quit chan int) {
	x, y := 0, 1
	for {
		if x > 100 {
			quit <- 1
		}
		select {
		case c <- x:
			println(x)
			x, y = y, x+y
		case <-quit:
			fmt.Println("quit")
			time.Sleep(time.Second)
			return
		}
	}
}

func main() {
	c := make(chan int, 100)
	quit := make(chan int, 10)
	fibonacci(c, quit)
}

// 结果
0
1
1
2
3
5
8
13
21
34
55
89
quit

```

select会随机顺序遍历(防止饥饿问题)case条件里channel是否有满足,然后执行.如果同时满足,会随机选择一个执行.

需要注意的是,如果go死锁检测发现进行select的goroutine永远不可能被唤醒,则会报错退出.

例如声明变量c的时候,如果不指明缓冲区大小又没有程序从c中读取,则永远不会触发`case <- x`这一段.而case <- quit如果没有往quit通道中写入的话,也不会被触发. 空的select也同理

```go
func fibonacci(c, quit chan int) {
   x, y := 0, 1
   for {
      if x > 10000 {
         quit <- 1
      }
      select {
      case c <- x:
         println(x)
         x, y = y, x+y
      case <-quit:
         fmt.Println("quit")
         time.Sleep(time.Second)
         return
      }
   }
}

func main() {
   c := make(chan int)
   quit := make(chan int)
   fibonacci(c, quit)
}

# go run main.go  触发deadlock
fatal error: all goroutines are asleep - deadlock!
```

