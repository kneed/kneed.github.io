---
layout:     post
title:      "从gRPC源码学习Golang默认参数和可变参数的使用"
subtitle:   ""
date:       2021-10-26 22:38:00
author:     "Keal"
header-img: "img/post-bg-go-3.png"
catalog: true
tags:
    - tech
    - go
 


---

## Golang默认参数和可变参数

Golang函数支持默认参数吗？No

Golang函数支持可变参数吗？Yes

```go
package main

import "fmt"

//可变参数的声明
func test(a ...int) {
   var total int
   for _, num := range(a) {
      total += num
   }
   fmt.Println(total)
}

func main() {
   params := []int{1,2,3,4}
  //可变参数传参方式
   test(params...)
   test(2,3,4,5)
}

//结果
10
14

```

Ok，可变参数的问题解决了，那默认参数怎么解决呢？直接说思路：

既然Golang不支持默认参数，那就在函数内部构造默认参数，通过读取可变参数来修改默认参数.代码大概会这样。

```go
// 函数的参数聚合struct
type Params struct {
   Allow bool
   Size int
}

func defaultParamsTest(optionalParams ...interface{}) {
   // 声明默认的参数
   p := Params{
      Allow: true,
      Size: 100,
   }
   // 根据传参optionalParams修改p
}
```

这样会有个问题，你的optionalParams虽然可以是interface{}类型，但是并不能很好的从传参中读懂要设置什么值. 于是我们需要改造一下optionalParams这个参数. 它需要做到两点：

1. 可变长的传参
2. 能够修改p的值

第一点很简单，通过Go的`...`语法可以实现

第二点则需要理解函数在Go中也跟Python类似，是可以作为传参的"一等公民"。因此可以通过传递一个函数参数，接收p的指针作为，达到修改p的目的。代码可能会是这样：

```go
func defaultParamsTest(optionalParams ...func(p *Params, v interface{})) {
   // 声明默认的参数
   p := Params{
      Allow: true,
      Size: 100,
   }
   // 根据传参optionalParams修改p
   for _, f := range(optionalParams) {
      f()
   }
}
```

这样写会遇到的问题是optionalParams函数中的v值读取不到.怎么办呢？*Params是函数内部可以获取的，v参数如何传递呢.动态构建固定参数的函数是一种方法

```go
// WithAllow返回的函数，接受一个*Params参数，并把Allow的bool传参设置到*Params中
func WithAllow(b bool) func(p *Params){
   return func(p *Params){
      p.Allow = b
   }
}
```

完整的例子

```go
package main

import "fmt"

// 构造一个参数结构
type Params struct {
   Allow bool
   Size  int
}

func defaultParamsTest(optionalParams ...func(p *Params)) {
   // 声明默认的参数
   p := Params{
      Allow: true,
      Size:  100,
   }
   // 根据传参optionalParams修改p
   for _, f := range optionalParams {
      f(&p)
   }
   fmt.Printf("%+v", p)
}

func WithAllow(b bool) func(p *Params) {
   return func(p *Params) {
      p.Allow = b
   }
}

func WithSize(v int) func(p *Params) {
   return func(p *Params) {
      p.Size = v
   }
}

func main() {
   params := []func(p *Params){
      WithAllow(false),
      WithSize(50),
   }
   defaultParamsTest(params...)
}

//打印结果
{Allow:false Size:50}
```

### 总结

1. 将可变的参数聚合到一个struct中
2. 函数内部声明这个struct
3. 声明一个类似WithAllow的函数，将可变参数的设置通过函数的方式提供给用户设置

### 优点

1. 对用户友好，可以很方便的拓展和修改可变参数。

### 缺点

1. 代码量增加了

这就是grpc-go项目中使用到的思路。但是grpc-go对函数传参和WithAllow的返回结果在作了一层抽象，但是整体思路一样。



### Reference

[grpc-go](https://github.com/grpc/grpc-go)

dialoptions.go文件和clientconn.go文件分别有设计和使用