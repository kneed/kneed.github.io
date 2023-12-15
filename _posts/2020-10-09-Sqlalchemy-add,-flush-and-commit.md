---
layout:     post
title:      "Sqlalchemy add, flush and commit"
date:       2020-10-09 12:15
author:     "Keal"
header-img: "img/post-bg-universe.jpg"
catalog: true
tags:
    - tech
---

## Add

官方文档解释:

> Place an object in the `Session`.
>
> Its state will be persisted to the database on the next flush operation.
>
> Repeated calls to `add()` will be ignored. The opposite of `add()` is `expunge()`.

将python对象放入到sqlalchemy的session中, 类似INSERT操作, 但此时并未执行. 直到执行`flush()`或者`commit()`,才会将数据提交到数据库

## Flush

官方文档解释:

>Flush all the object changes to the database.
>
>Writes out all pending object creations, deletions and modifications to the database as INSERTs, DELETEs, UPDATEs, etc. Operations are automatically ordered by the Session’s unit of work dependency solver.
>
>Database operations will be issued in the current transactional context and do not affect the state of the transaction, unless an error occurs, in which case the entire transaction is rolled back. You may flush() as often as you like within a transaction to move changes from Python to the database’s transaction buffer.
>
>For `autocommit` Sessions with no active manual transaction, flush() will create a transaction on the fly that surrounds the entire set of operations into the flush.

`flush()`会将当前session对象的改变都提交到数据库执行, 但是数据只是保存在transaction buffer, 并未保存到数据库. 所以只有当前事务可见, 直到`commit()`之后, 才会保存到数据库, 其他事务才能获取到此事务更改的数据.

## Commit

官方文档解释:

>Flush pending changes and commit the current transaction.
>
>If no transaction is in progress, the method will first “autobegin” a new transaction and commit.
>
>If [1.x-style](https://docs.sqlalchemy.org/en/14/glossary.html#term-0) use is in effect and there are currently SAVEPOINTs in progress via [`Session.begin_nested()`](https://docs.sqlalchemy.org/en/14/orm/session_api.html?highlight=commit#sqlalchemy.orm.Session.begin_nested), the operation will release the current SAVEPOINT but not commit the outermost database transaction.
>
>If [2.0-style](https://docs.sqlalchemy.org/en/14/glossary.html#term-1) use is in effect via the [`Session.future`](https://docs.sqlalchemy.org/en/14/orm/session_api.html?highlight=commit#sqlalchemy.orm.Session.params.future) flag, <u>the</u> outermost database transaction is committed unconditionally, automatically releasing any SAVEPOINTs in effect.
>
>When using legacy “autocommit” mode, this method is only valid to call if a transaction is actually in progress, else an error is raised. Similarly, when using legacy “subtransactions”, the method will instead close out the current “subtransaction”, rather than the actual database transaction, if a transaction is in progress.

`commit()`会执行`flush()`操作,如果无错误会将所有更改保存到数据库. 

如果当前没有事务,会自己开一个事物提交,不会改变任何东西.



--如果不注意到这之间的区别, 容易犯一些错误. 比如一个对象的uuid, 大部分情况下是通过调用python的uuid4库在提交的时候自动生成的. 但是如果不知道什么时候会生成uuid的话,会导致一个问题,就是赋值的时候出现空.举个例子:

A是一个对象拥有一个uuid属性

a是一个对象拥有一个parent_uuid属性

如果是这样的代码:

```python
class A():
    __tablename__ = 'A'
    
    uuid = Column(UUID, primary_key=True, default=lambda: str(uuid4()), server_default=text("uuid_generate_v4()"))
  
  # 错误写法
  big_a = A()
  db.session.add(big_a)
  small_a = a()
  small_a.parent_uuid = big_a.uuid # 赋值为空,因为big_a的uuid属性现在并没有调用uuid4()生成
  
  # 正确写法
  big_a = A()
  db.session.add(big_a)
  db.session.flush()  # 需要flush之后,触发uuid4()生成默认uuid,此时赋值才能得到期望结果
  small_a.parent_uuid = big_a.uuid
```

#### Reference:

[sqlalchemy官方文档](https://www.sqlalchemy.org/)

