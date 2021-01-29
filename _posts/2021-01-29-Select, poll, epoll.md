---
layout:     post
title:      "select, poll, epoll以及Linux下的IO模式"
date:       2021-01-29 18:48
author:     "Keal"
header-img: "img/post-bg-universe.jpg"
catalog: true
tags:
    - tech
    - linux
---

之前一直以为自己已经充分理解了select, poll, epoll,直到看到这样一个问题:

> 为什么 IO 多路复用要搭配非阻塞 IO?

自己琢磨的有点似是而非,所以重新好好复习下. 先从Linux下的IO模式说起吧.

### Linux IO模式

*Unix网络编程*这本书中有讲到5种IO模式:

1. 阻塞 I/O（blocking IO）
2. 非阻塞 I/O（nonblocking IO）
3.  I/O 多路复用（ IO multiplexing）
4.  信号驱动 I/O（ signal driven IO）
5.  异步 I/O（asynchronous IO）

![clipboard.png](https://tva1.sinaimg.cn/large/008eGmZEgy1gn4v5tv7c2j30h2093gnt.jpg)

这里面需要理解的一个关键点是: 数据是先到内核, 在到用户进程. 举个例子,你在你的用户进程里发起了一个recvfrom调用,那么就会有两个等待:

1. 用户进程等内核有数据来给你拷贝
2. 内核等待从网络中获取数据.

知道了这两个等待,我们再去看这几个IO模式.**阻塞和非阻塞的区别是在于第一个等待是否阻塞**.
IO多路复用跟阻塞IO很像,区别在于**IO多路复用第一个等待不是等待一个fd,而是等待多个fd中是否有已经准备好数据传输的.**

这里可以顺便说一下同步IO和异步IO

\- A synchronous I/O operation causes the requesting process to be blocked until that I/O operation completes;
\- An asynchronous I/O operation does not cause the requesting process to be blocked;

根据定义,你就知道在第二个等待,从网络中获取数据这个如果是阻塞的,那就是同步的,否则就是异步的.所以阻塞式IO,非阻塞式IO,IO多路复用都归为同步IO. 只有异步IO,第二个等待过程也不阻塞的时候算是异步IO

小结:

1. 是否阻塞看程序是否要等待内核数据准备好
2. 是否同步看需不需要等待从内核读取内容的操作完成

### Select, Poll, Epoll

#### Select

select的模式就是把第一个等待的过程里的fd从一个变成了多个.比如你想从一个fd里读数据, 你调用read来读,就完成了这个操作. 但是这样有个问题是,你一次只能对一个fd完成这个操作. 如果你需要对多个fd进行高效的读操作,朴素的一个想法是:		你使用非阻塞IO, 非阻塞IO会在没有数据时返回一个error告诉你现在没有数据. 所以你可以对每个fd进行遍历,尝试读取它,根据返回来判断有没有数据,没有就下一个.有就进行读操作.

select的做法很类似:
		你将所有的fd放入一个集合,select会遍历所有fd,最后返回准备好的fd集合.你就能知道应该对哪些fd来读了.

select的缺点:
		select的设计上的一个缺陷是能监控的最大文件描述符数量受限于linux系统单个进程支持的最大文件描述符数量(通常为1024),所以如果需要支持大于1024个的需求,使用select不是很方便
		select还有一个缺点是当数据量大时,数据在内核到用户进程之间的处理转移消耗会增大,影响性能.

select的优点:
		跨平台

#### Poll

poll跟select的在本质上没有区别,只是通过修改了数据结构来解除了select最大能监控的文件描述符上限.

#### Epoll

epoll跟select和poll最主要的区别就在于多了一个回调的机制, select和poll是用户触发某个操作后,去遍历fd查看是否就绪,举个例子,你每次调用select()的时候才会去做这个事情. 但是epoll里的fd会在数据到达准备就绪时,调用一个方法来将自己归为到就绪的集合里.这样以select()举例就是你select()可以直接返回就绪的fd了,不需要走一遍遍历fd检查是否就绪的操作.效率自然快.

epoll优点:
		效率不会因为fd数量的上升而迅速下降.

### 最后

  1. 文章中都是用对fd的读操作来举例的, 不代表fd只有读操作

  2. 文章旨在理解, 细节还是参考官方文档

  3. 为什么 IO 多路复用要搭配非阻塞 IO?

     以select()举例

     原因有两点:

     1. select()返回可读不代表一定有数据读,比如已经被监测这个fd的其他进程读走,内核丢弃什么的,可以参照select()函数的说明

        > Linux, select() may report a socket file descriptor as "ready for reading", while nevertheless a subsequent read blocks.  This could for example happen when
        >        data has arrived but upon examination has wrong checksum and is discarded.  There may be other circumstances in which a file descriptor is spuriously reported  as
        >        ready.  Thus it may be safer to use O_NONBLOCK on sockets that should not block.

        因此使用非阻塞读会存在阻塞的情况

     2. 即使可读,你不知道有多少数据读的情况下,使用阻塞读读取完整的数据要经历多个select(), read()的过程,如果使用非阻塞读,直接循环的read()直到返回error就行.所以使用非阻塞式IO比较有优势.

### Reference

1. https://segmentfault.com/a/1190000003063859
2. *Unix网络编程*
3. [为什么 IO 多路复用要搭配非阻塞 IO知乎问答](https://www.zhihu.com/question/37271342)

