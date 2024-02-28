---
layout:     post
title:      "str,bytes,unicode in Python"
date:       2021-01-22 13:22
author:     "Keal"
header-img: "img/post-bg-rwd.jpg"
catalog: true
tags:
    - tech
    - python
---

python2到3里的编码问题算是常见问题了,发现很多文章有些讲的对但是缺少细节不容易明白,有些文章甚至讲的都不完全是对的.所以这篇文章如果能做到既对了,又能够细节充分让人一看就懂,还是很有意义的.

### bytes和unicode

python里的bytes类型可以理解为最底层的'00001111'这样的数据流,当进行网络传输或者文件传输时,都是通过bytes类型传输.

应用读取bytes需要对bytes作解码. 解码就需要知道编码类型. 以ASCII码来举例:

你知道'a'对应的ASCII码的二进制是"0110 0001", 那么你传输的时候使用的就是"0110 0001", 其他应用也应该使用ASCII来解码,这样就能把'0110 0001'转为'a'.

ASCII码里共对127个字符进行了编码.全部都只用到了一个字节(Byte), 主要是为了显示现代英语.对于其他不使用英语的国家来说肯定是有问题的,比如中文.如果使用ASCII来编码解码,是没办法读出一个中文的.所以后来有了一个支持中文的GBK系列的编码.这些有兴趣可以网上了解下.这里直接快进到unicode.

unicode的想法很简单,就是集合世界上所有的字符,从0开始给每一个字符安排一个对应的码点.举个例子, 英文字符'a'对应是"110 0001", 汉字字符"汉"对应"110110001001001". 这里有个问题就是,unicode虽然告诉了你"110 0001"对应英文字符'a', 汉字字符"汉"对应"110110001001001",但是没规定应该怎么存储这些码点. 比如"110 0001"只有7位, 而"110110001001001"是15位, 所以就出现了UTF-8编码.

介绍UTF-8编码之前,我想从最原始的编码想法谈起:只要知道unicode中最大的码点是多少位的,比如可能是31位,也就是需要4个字节来存储.那么使用4个字节不就可以存储所有的字符了?没错,这正是UTF-32的思想.但是很明显的一个缺点就是都使用4个字节会造成很大的浪费.比如英文字符'a'对应的unicode码点的二进制只有7位,1个字节就能存储,使用4个字节来存储,另外三个字节就等于浪费了.所以UTF-32并没有流行起来,最流行的还是支持可变长的UTF-8编码.

UTF-8编码是一种**可变长**编码,使用1-4个字节来存储字符,最大化的利用了存储空间. 它的编码规则如下:

1. 对于单个字节的字符，第一位设为 0，后面的 7 位对应这个字符的 Unicode 码点。因此，对于英文中的 0 - 127 号字符，与 ASCII 码完全相同。这意味着 ASCII 码那个年代的文档用 UTF-8 编码打开完全没有问题。
2. 对于需要使用 N 个字节来表示的字符（N > 1），第一个字节的前 N 位都设为 1，第 N + 1 位设为 0，剩余的 N - 1 个字节的前两位都设位 10，剩下的二进制位则使用这个字符的 Unicode 码点来填充。

那怎么知道应该按多少个字节的长度来读取字符呢?UTF-8的编码里把具有不同字节的字符的二进制头部区分开来.它的编码规则如下：

| Unicode 十六进制码点范围 | UTF-8 二进制                        |
| :----------------------- | :---------------------------------- |
| 0000 0000 - 0000 007F    | 0xxxxxxx                            |
| 0000 0080 - 0000 07FF    | 110xxxxx 10xxxxxx                   |
| 0000 0800 - 0000 FFFF    | 1110xxxx 10xxxxxx 10xxxxxx          |
| 0001 0000 - 0010 FFFF    | 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx |

从表中你就能知道0开头的就是一个字节,110开头的就是两个字节,1110开头的就是三个字节,11110开头的就是四个字节.

到这里基本能搞明白unicode和bytes了,接下来说说python里的字符串和这两者的关系.

### python里的str

#### python2

python2里的str其实就是bytes类型,在python2的环境中,可以看到str == bytes 的表达式为True

```python
>>> str == bytes
True
```

那么类似`UnicodeDecodeError: 'ascii' codec can't decode byte 0xe6 in position 0: ordinal not in range(128)`是如何出现的呢?

因为python解释器默认使用ASCII来解码内容,ASCII只包含了包括英文字母,数字,特殊符号在内的127个字符,并不包含中文字符.所以肯定会报错. 举个例子:

```python
# python2.6
a = ('汉'.encode('utf-8'))
print(a)
print(a.decode('ascii'))

# 执行结果
[root@bc33df42b9b8 keal]# python t1.py
  File "t1.py", line 1
SyntaxError: Non-ASCII character '\xe6' in file t1.py on line 1, but no encoding declared; see http://www.python.org/peps/pep-0263.html for details
```

这里第二行中使用了一个中文字符"汉",尝试将其按utf-8编码,但是执行时会报错,提示"\xe6"并非ASCII字符,这个"\xe6"是"汉"使用utf-8编码后的第一个字节. 完整的三个字节是'\xe6\xb1\x89'. 

```python
# python3.8测试
print('汉'.encode('utf-8'))

#执行结果
b'\xe6\xb1\x89'
```

所以在python2中,需要使用到中文的话会在开头加上"# coding:utf-8"来让解释器使用utf-8来进行解码.

python2里的unicode是单独一种类型. 可以使用u开头创建字符串或者unicode()方法将str转换为unicode.

我看到有些文章提到说python2里的str就是unicode, 因为类似`s' == u's'`的表达式会判断为True.其实这是不完全正确的,判断为True只是因为unicode与ASCII在低八位是一样的.也就是unicode兼容了ASCII.

### python3

python3里的str就是unicode类型, 解释器默认使用utf-8来解码, 所以python3默认就支持中文.

python3里的bytes类型是额外一种类型,可以通过调用字符串的`encode()`方法来将str转换为bytes.或者直接使用bytes()方法将字符串转换为byte类型.

### 总结

1. unicode包含了世界上的大多数字符.并且建立了一个字符-码点的关系.
2. UTF-8 编码包含了所有unicode字符, 并且完美兼容了ASCII
3. python2的str是bytes类型, 默认使用ASCII, 
4. python3的str是unicode类型, 默认使用UTF-8.
5. encode是将unicode按某种编码转换成bytes类型, decode是将bytes类型按某种编码解码成str,python2里,字符串的encode()方法,因为str是bytes类型的缘故.实际上会先对str做decode操作,变成unicode,在进行encode()的操作.