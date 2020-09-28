---
layout:     post
title:      "进程,线程在Linux和Python"
date:       2020-09-24 14:06
author:     "Keal"
header-img: "img/post-bg-universe.jpg"
catalog: true
tags:
    - tech
    - python
    - concurrency
---

## 前言

进程和线程其实都是操作系统负责调度执行的, **操作系统是以进程为单位去分配空间和执行的**

线程存活于进程之中, 同一个进程中的线程, 共享一个虚拟内存空间以及其中资源. 线程有自己的线程id

## Linux中的进程和线程

Linux并未像Windows那样提供`CreateProcess`和`CreateThread`API来明确区分线程和进程的创建, 而是将线程和进程视为同一种东西,叫做Task. 因为允许在进程中共享物理内存空间, 所以实际也是支持多线程

### 创建子进程

1. fork()

   完全复制父进程内容, 与父进程共享同一份内存空间

2. clone()

   提供了多个flag来改变子进程对父进程资源继承的行为

### 创建线程

​		pthread库	

## Python多进程(3.8)

​		[multiprocess官方文档](https://docs.python.org/zh-cn/3/library/multiprocessing.html)

​		[subprocss官方文档](https://docs.python.org/zh-cn/3/library/subprocess.html)

### 实践注意:

1. 尽量避免使用任何的共享内存的方式来实现通信, 例如Manager, Pipe, 除非你确保不会出现数据竞争或者你能处理这种情况
2. 尽量使用消息的方式来实现通信, 例如适用Queue. Queue的实现中已经处理了相关锁的机制, 可以帮你从锁的处理中解脱出来.
3. 妥善使用`terminate`()方法, 只在需要强制终止进程的时候使用, 并且在terminate后需要通过`is_alive()`或`join()`来回收子进程资源.否则将产生一个[僵尸进程](https://zh.wikipedia.org/wiki/%E5%83%B5%E5%B0%B8%E8%BF%9B%E7%A8%8B)
4. 使用`join()`来等待子进程结束并回收子进程.
5. multiprocess库创建的是子进程, subprocess创建的是一个额外的独立进程

## python多线程(3.8)

​		[官方文档](https://docs.python.org/zh-cn/3/library/threading.html)

### 实践注意:

1. 区别信号量和锁的使用, 虽然都可以用作对资源的控制, 但是信号量推荐用在有限的资源上,例如数据库连接池的数量,线程或进程的数量等. 锁推荐用在需要同步执行的数据中.
2. 虽然Lock锁和Semaphore都支持在不同的线程中acquire和release, 但是这样做的时候需要特别注意, 因为当一个线程acquire后, 如果负责release的线程阻塞或者不执行, 则会导致后续的请求都因为acquire失败而无法执行.

## Conurrent

​		[官方文档](https://docs.python.org/zh-cn/3/library/concurrent.html)

主要对线程和进程进行了统一的进一步抽象, 通过同样的调用方式来实现并发处理.简化了使用者的学习成本



