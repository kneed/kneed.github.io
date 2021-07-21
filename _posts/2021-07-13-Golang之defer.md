---
layout:     post
title:      "Golang之defer"
subtitle:   "\"defer\""
date:       2021-07-13 19:22:00
author:     "Keal"
header-img: "img/post-bg-go-4.png"
catalog: true
tags:
    - tech
    - go
---

## Defer

defer关键字的主要作用是指定一个在函数返回前执行的函数.最常见的使用就是释放锁,关闭文件描述符,释放数据库连接.

这里主要讲两个问题:

- `defer` 关键字的调用时机以及多次调用 `defer` 时执行顺序是如何确定的；
- `defer` 关键字使用传值的方式传递参数时会进行预计算，导致不符合预期的结果；



```go
func main() {
	for i := 0; i < 5; i++ {
		defer fmt.Println(i)
	}
}

$ go run main.go
4
3
2
1
0
```

从这段代码的运行结果看,多次`defer`的调用顺序类似栈是后进先出.即最后的defer会最先执行.

```go
func main() {
	startedAt := time.Now()
	defer fmt.Println(time.Since(startedAt))
	
	time.Sleep(time.Second)
}

$ go run main.go
0s
```

这段代码里,`time.Since(startedAt)`是在defer关键词调用时计算的,而不是期望的函数返回前计算. 这是因为defer里的函数的参数会先立刻拷贝,不会等到真正执行的时候计算. 可以通过匿名函数来解决这个问题.

```go
func main() {
	startedAt := time.Now()
	defer func() { fmt.Println(time.Since(startedAt)) }()
	
	time.Sleep(time.Second)
}

$ go run main.go
1s
```

使用匿名函数后的结果为预期结果.



## Reference

golang的系列在draveness的博客中有一些列非常详细的介绍.本篇都只是描述一些个人认为的重点内容.如果想知道相关golang设计过程,源码,机器执行指令等内容.推荐直接看draveness的内容或者其他更为详细的博文.

https://draveness.me/golang/

