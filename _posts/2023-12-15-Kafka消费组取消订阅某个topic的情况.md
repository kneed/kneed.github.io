---
layout:     post
title:      "Kafka消费组取消订阅某个topic的情况"
date:       2023-12-15 20:54
author:     "Keal"
header-img: "img/tag19.jpg"
catalog: true
tags:
    - tech
---

最近遇到一个情况, 服务的一个消费组取消消费了一个topic后, 发现并没有真正取消订阅此topic, 导致在监控数据看, 此topic的lag数量会持续增加. 于是我感觉很好奇, 想了解下更多关于这个场景的细节.

### kafka基本概念介绍

以下图为例

![image-20231215172608453](https://raw.githubusercontent.com/kneed/typora_img_respository/main/typora/202312151726614.png)

**group**: 消费组可以订阅1个或者多个topic

**topic**: topic可以被1个或者多个消费组订阅, topic的数据存放在1个或多个partition中

**partition**: 一个partition可以存放1个或者多个topic的消息

**CURRENT-OFFSET**: 当前消费组消费到的消息offset

**LOG-END-OFFSET**:  当前topic对应partition消息的最后offset

**LAG**: LOG-END-OFFSET - CURRENT-OFFSET

### 问题描述

如前副图所示, 对于组user_service, 订阅的compelx-uuid.data topic, 已经没有消费者了(CONSUMER-ID为空), 但是消费组和topic的订阅关系仍然存在, 导致lag会不断增加. 这会让人误以为消费速度太慢或者服务挂了, 但实际上服务已经不再订阅这个topic了.

### 解答

kafka有一个配置`offset.retention.minutes`, 这个配置是用来保留offset的情况的, 默认是10080分钟,也就是7天. 在以下情况,kakfa会删掉影院组对于这个topic下某个partition的offset信息:

1. 消费组没有消费者(变为空)并且
2. 消费组不再订阅某个topic并且提交的offset未更新时间超过了这个配置值.
3. 删掉整个消费组
4. 删掉某个topic也会导致消费组订阅的这个topic的offset被丢弃

文档描述:

> #### [offsets.retention.minutes](https://kafka.apache.org/documentation/#brokerconfigs_offsets.retention.minutes)
>
> For subscribed consumers, committed offset of a specific partition will be expired and discarded when 1) this retention period has elapsed after the consumer group loses all its consumers (i.e. becomes empty); 2) this retention period has elapsed since the last time an offset is committed for the partition and the group is no longer subscribed to the corresponding topic. For standalone consumers (using manual assignment), offsets will be expired after this retention period has elapsed since the time of last commit. Note that when a group is deleted via the delete-group request, its committed offsets will also be deleted without extra retention period; also when a topic is deleted via the delete-topic request, upon propagated metadata update any group's committed offsets for that topic will also be deleted without extra retention period.
>
> |         Type: | int       |
> | ------------: | --------- |
> |      Default: | 10080     |
> | Valid Values: | [1,...]   |
> |   Importance: | high      |
> |  Update Mode: | read-only |



设计这个的原因其实也比较好理解:

1. 消费组不再订阅这个topic不代表之后不再订阅,存在临时下线的可能.如果删掉相关offset信息,重新建立会导致更复杂的处理场景.比如从头消费会导致重复修复,从最新一条消费则有可能丢掉消息.
2. 保存一个offset关系并不会消耗太多资源

在这两者比较下,设计上如何取舍也很好理解了

### 更新

在我们使用的kafka2.5.0环境中,发现并没有按预期的删除消费组取消订阅的topic的相关offset信息.继续查找之后,在kafka2.8.0版本之后,通过支持了delete offset操作, 可以再消费组运行时删除相关offset信息,避免lag堆积导致告警的问题.

### Reference

[kafka官方文档](https://kafka.apache.org/documentation/#brokerconfigs_offsets.retention.minutes)