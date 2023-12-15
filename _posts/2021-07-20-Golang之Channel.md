---
layout:     post
title:      "Golang之Channel"
subtitle:   "\"channel chan?\""
date:       2021-07-25 21:28:00
author:     "Keal"
header-img: "img/post-bg-go-4.png"
catalog: true
tags:
    - tech
    - go
---

## Channel

channel是golang实现的"通过通信来实现共享内存"并发同步方案.

Channel有点类似python里的Queue, 例如内部通过锁的机制实现了并发安全.遵循先入先出的设计.

Channel的三种类型:

- 同步 Channel — 不需要缓冲区，发送方会直接将数据交给（Handoff）接收方；
- 异步 Channel — 基于环形缓存的传统生产者消费者模型；
- `chan struct{}` 类型的异步 Channel — `struct{}` 类型不占用内存空间，不需要实现缓冲区和直接发送（Handoff）的语义；

Channel的底层结构

```go
type hchan struct {
	qcount   uint
	dataqsiz uint
	buf      unsafe.Pointer
	elemsize uint16
	closed   uint32
	elemtype *_type
	sendx    uint
	recvx    uint
	recvq    waitq
	sendq    waitq

	lock mutex
}
```

## Channel的状态和操作

3种状态:

1. nil值. 例如(`var c chan int`里的c)
2. active, 初始化后的channel会是这个状态
3. closed. 

| 操作      | nil的channel | 正常channel | 已关闭channel |
| --------- | ------------ | ----------- | ------------- |
| <- ch     | 阻塞         | 成功或阻塞  | 读到零值      |
| ch <-     | 阻塞         | 成功或阻塞  | panic         |
| close(ch) | panic        | 成功        | panic         |

## Channel的一些常见现象

### 发送

1. 当channel的`recvq`已经有goroutine在阻塞,则直接发送到此goroutine并将其设置为下一个运行的goroutine
2. 如果`recvq`没有正在阻塞的goroutine,此时有两种情况:a. channel有缓冲区,则将数据存储到缓冲区. b. 如果没有缓冲区,则会创建一个`sudog`结构并将其加入到`sendq`队列中.

### 接收

- 当存在等待的发送者时，通过 [`runtime.recv`](https://draveness.me/golang/tree/runtime.recv) 从阻塞的发送者或者缓冲区中获取数据；
- 当缓冲区存在数据时，从 Channel 的缓冲区中接收数据；
- 当缓冲区中不存在数据时，等待其他 Goroutine 向 Channel 发送数据；

我们梳理一下从 Channel 中接收数据时可能会发生的五种情况：

1. 如果 Channel 为空，那么会直接调用 [`runtime.gopark`](https://draveness.me/golang/tree/runtime.gopark) 挂起当前 Goroutine；
2. 如果 Channel 已经关闭并且缓冲区没有任何数据，[`runtime.chanrecv`](https://draveness.me/golang/tree/runtime.chanrecv) 会直接返回；
3. 如果 Channel 的 `sendq` 队列中存在挂起的 Goroutine，会将 `recvx` 索引所在的数据拷贝到接收变量所在的内存空间上并将 `sendq` 队列中 Goroutine 的数据拷贝到缓冲区；
4. 如果 Channel 的缓冲区中包含数据，那么直接读取 `recvx` 索引对应的数据；
5. 在默认情况下会挂起当前的 Goroutine，将 [`runtime.sudog`](https://draveness.me/golang/tree/runtime.sudog) 结构加入 `recvq` 队列并陷入休眠等待调度器的唤醒；

我们总结一下从 Channel 接收数据时，会触发 Goroutine 调度的两个时机：

1. 当 Channel 为空时；
2. 当缓冲区中不存在数据并且也不存在数据的发送者时；

## Reference

[channel常见用法](https://segmentfault.com/a/1190000017958702)

[Channel](https://draveness.me/golang/docs/part3-runtime/ch06-concurrency/golang-channel/)
