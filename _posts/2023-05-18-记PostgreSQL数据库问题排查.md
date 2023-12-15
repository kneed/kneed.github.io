---
layout:     post
title:      "Postgres数据库的Checkpoint机制"
subtitle:   ""
date:       2023-05-18 14:31:00
author:     "Keal"
header-img: "img/post-bg-alitrip.jpg"
catalog: true
tags:
    - tech
---

## 背景

项目生产环境有一个服务的数据库的监控数据有异常, 主要是CPU和WriteIOPS会有规律性的尖刺.

## ![image-20230418144810865](https://raw.githubusercontent.com/kneed/typora_img_respository/main/typora/202306021032615.png)

## 排查

### cpu飙升问题

CPU的使用率升高通常都是做数据量大的操作,例如多表Inner join或者同时在数据库做了一些计算操作. 因为尖刺是规律的5min出现一次,所以大概率猜到是某个定时任务导致的. 排查后发现有个5min的定时任务是去统计某个千万数据级别表, 同时还要做inner join操作, 每次执行这个sql的时候cpu就会飙升.

### WriteIOPS问题

WriteIOPS主要是db向硬盘写数据的次数统计数据.

排查了服务代码以及db日志后, 都没发现有这么规律的update或者insert的操作. 当时猜测可能跟autovaccum有关. 但通过

`select * from pg_stat_user_tables;`查看后发现autovaccum的时机和WriteIOPS发生的时机也不匹配. 继续排查后,发现大概率跟Checkpoint有关,同时AWS上这个数据库的`checkpoint_timeout`配置使用的也是默认配置(300s), 跟尖刺的时间规律是重叠的. 所以趁机好好了解下这个Checkpoint.



## Postgresql CheckPoint

理解CheckPoint之前,需要理解一下**WAL(write-head log)**, **WAL**是预写日志, 意思是数据在写入磁盘之前,会先写入WAL, 这样在数据库发生错误或者崩溃时,也能够通过WAL来恢复数据.

但有利也有弊, 通过WAL来维护了数据的持久的同时,也带来了性能开销的问题: 维护整个数据库所有数据的WAL需要占用磁盘空间. 如果没有任何策略的情况下, 几百G的数据文件可能会有几TB的WAL日志, 因此引入了CheckPoint.

CheckPoint就像玩游戏时的一个存档点, 当你失败时,可以从这个Checkpoint继续而不是从头再来. 对于Postgresql也是一样, 当Postgresql数据库崩溃需要恢复时, 只需要从Checkpoint开始恢复而不是从头开始的话, 就可以不需要保留所有的WAL日志.

### Checkpoint触发时机:

- 直接执行`CHECKPOINT`命令；
- 部分命令也会触发checkpoint（例如：`pg_start_backup`，`CREATE DATABASE`，或`pg_ctl stop|restart`和其他一些命令）；
- 自上一个checkpint以来已达到配置的时间；
- 自上一个检查点以来生成了已配置的最大WAL文件数量（也称为WAL用尽（running out of WAL）或填充WAL（filling WAL））。

前面两者一般都是手动执行, 所以主要看后面两者.

一个是时间的配置: `checkpoint_timeout`, 默认 = 5min

一个是空间的配置: `max_wal_size` , 默认 = 1GB

但要注意的是, 数据库执行CheckPoint也有三个步骤:

1. 识别共享缓冲区中的所有脏页（已修改的页）；
2. 将所有这些缓冲区写入文件系统缓存；
3. 调用`fsync()`将所有修改后的文件刷新到磁盘（数据文件）。

只有这三个步骤都完成了, 一个checkpoint才算完整的做完. 一开始PostgreSQL会一次性将所有数据刷入文件系统缓存在调用fsync刷入磁盘, 但会导致短时间内IO过高造成其他业务被影响. 因此增加了一个spread checkpoint的策略: 在一段时间内分批将数据写入文件系统缓存, 再在最后调用fsync刷入磁盘.而这个配置的名称就是`checkpoint_completion_target`

### 如何配置Checkpoint策略

`checkpoint_timeout`: 过高会导致恢复的速率变慢,过低会导致更多的IO

`max_wal_size`: 通常来说如果希望按时间来做checkpoint的话, `max_wal_size`最好配置的比两个checkpoint_timeout之间产生的wal_size稍大

`checkpoint_completion_target`: 大多数情况下配置0.9就好, 当你的`checkpoint_timeout`参数足够大时,可以适当按照`(checkpoint_timeout - 2min) / checkpoint_timeout`这个公式太调整. 不要调的太低,因为大多数时候系统并不需要预留那么多时间完成fsync的操作.

## Reference

[Basics of Tuning Checkpoints]()

[30.5. WAL Configuration](https://www.postgresql.org/docs/current/wal-configuration.html)

