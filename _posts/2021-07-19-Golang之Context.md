---
layout:     post
title:      "Golang之context"
subtitle:   "\"context for ?\""
date:       2021-07-15 21:28:00
author:     "Keal"
header-img: "img/post-bg-go-4.png"
catalog: true
tags:
    - tech
    - go
    - concurrency

---

## Context

```go
type Context interface {
	Deadline() (deadline time.Time, ok bool)
	Done() <-chan struct{}
	Err() error
	Value(key interface{}) interface{}
}
```

通过Go源码可知,Context接口需要实现`Deadline`,`Done`,`Err`,`Value`四个方法

理解Context的作用之前,你可能更需要知道引入Context解决了什么问题. Context主要是为了解决多个goroutine之间的同步问题. 主要方式就是通过在各个函数间传递Context来共享上下文信息.举个例子:

**图 Golang_Without_Context**

![golang-without-context](https://tva1.sinaimg.cn/large/008i3skNgy1gsjzzczhrxj30xc0aa3yu.jpg)

在没有context的情况下,下层的goroutine实际上感知不了上层的情况,比如最上层是一个http请求,中间有一个数据库redis的请求,下面是一个数据库的请求. 如果最上层的goroutine取消了这次请求,那么下层所有的请求都应该尽快的终止,因为此时返回结果已经没有意义了.

**图 Golang_With_Context**

![golang-with-context](https://tva1.sinaimg.cn/large/008i3skNgy1gsk034sqgsj30xc0aajrp.jpg)

OK. 回到Context接口的四个方法里

1. `Deadline`: 返回context结束的时间.
2. `Done`: 返回一个Channel,这个Channel会在当前工作完成或者被取消后关闭,多次调用Done方法会返回同一个Channel.
3. `Err`:返回context结束的原因
4. `Value`:获取对应键的值.同个context多次调用`Value`会返回相同的结果.

context标准包中提供了创建Context的一些方法.例如`WithTimeout`, `WithValue`,`WithDeadline`.以`WithTimeout`为例来写一个测试用代码.

```go
func main() {
   ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
   defer cancel()

   go handle(ctx, 500*time.Millisecond)
   select {
   case <-ctx.Done():
      fmt.Println("main", ctx.Err())
      fmt.Println(ctx.Deadline())
   }
}

func handle(ctx context.Context, duration time.Duration) {
   select {
   case <-ctx.Done():
      fmt.Println("handle", ctx.Err())
   case <-time.After(duration):
      fmt.Println("process request with", duration)
   }
}
//go run main.go
process request with 500ms
main context deadline exceeded  //错误退出原因为deadline到了.
2021-07-19 16:17:45.374202 +0800 CST m=+1.000266755 true //Deadline返回的结束时间. true表示设置了deadline, 如果context没有设置deadline.则会返回false

```

上面代码中,通过`context.WithTimeout`创建了一个1s内就会被取消的ctx. handle函数会通过select等待两个channel的完成. ctx.Done()会在1s后返回, time.After(duration)会在参数duration的时间后返回.上面的例子中,duration为500ms,因此select会触发第二个case的代码.

**如果将handle的duration参数改成1500ms呢?**

```go
func main() {
   ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
   defer cancel()

   go handle(ctx, 1500*time.Millisecond)
   select {
   case <-ctx.Done():
      fmt.Println("main", ctx.Err())
      fmt.Println(ctx.Deadline())
   }
}

func handle(ctx context.Context, duration time.Duration) {
   select {
   case <-ctx.Done():
      fmt.Println("handle", ctx.Err())
   case <-time.After(duration):
      fmt.Println("process request with", duration)
   }
}
//go run main.go
main context deadline exceeded
handle context deadline exceeded
2021-07-19 16:39:18.68905 +0800 CST m=+1.000307493 true

```

可以看到,因为`ctx.Done`先返回,所以打印出了handle context deadline exceeded.

## Context的一些使用建议

1. Do not store Contexts inside a struct type; instead, pass a Context explicitly to each function that needs it. The Context should be the first parameter, typically named ctx.
2. Do not pass a nil Context, even if a function permits it. Pass context.TODO if you are unsure about which Context to use.
3. Use context Values only for request-scoped data that transits processes and APIs, not for passing optional parameters to functions.
4. The same Context may be passed to functions running in different goroutines; Contexts are safe for simultaneous use by multiple goroutines.

## Context设计的争论点

1. 传递context需要在每个函数中显示的作为参数传递,会导致context的泛滥
2. 通过context存储键值,如果没有规范,会比较难跟踪.比如多个地方都设了相同的值导致被覆盖这种情况难以排查.

## Reference

[官方博客关于context的介绍](https://blog.golang.org/context)

[官方context包的介绍](https://pkg.go.dev/context)

[知乎](https://zhuanlan.zhihu.com/p/68792989)

[draveness](https://draveness.me/golang/docs/part3-runtime/ch06-concurrency/golang-context/)
